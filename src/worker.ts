import { query, pool } from './db';
import { getLLMClient } from './llm';
import { randomUUID } from 'crypto';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { tools } from './tools';

async function processRun(runId: string) {
  const publisher = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
  console.log(`[Worker] Processing run ${runId}`);
  
  while (true) {
    // 1. Fetch current run state along with agent model and user API keys
    const { rows: runRows } = await query(
      `SELECT r.*, a.model as agent_model, u.gemini_api_key, u.openai_api_key 
       FROM runs r 
       LEFT JOIN agents a ON r.agent_id = a.id 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE r.id = $1`,
      [runId]
    );
    if (runRows.length === 0) break;
    const run = runRows[0];

    const provider = (run.agent_model || process.env.LLM_PROVIDER || 'gemini').toLowerCase();
    const userApiKey = provider === 'openai' ? run.openai_api_key : run.gemini_api_key;
    
    if (run.status === 'DONE' || run.status === 'FAILED') {
      console.log(`[Worker] Run ${runId} is ${run.status}`);
      break;
    }

    if (!userApiKey || !userApiKey.trim()) {
      console.log(`[Worker] Run ${runId} failed: User has not configured their ${provider} API key in Settings.`);
      await query('UPDATE runs SET status = $1, finished_at = NOW() WHERE id = $2', ['FAILED', runId]);
      
      const stepId = randomUUID();
      await query(
        `INSERT INTO steps (id, run_id, step_number, phase, model_output, tokens_in, tokens_out, cost_usd, latency_ms) 
         VALUES ($1, $2, 1, 'PLANNING', $3, 0, 0, 0, 0)`,
        [
          stepId, runId, 
          JSON.stringify({ text: `❌ Execution Failed: Missing ${provider.toUpperCase()} API Key. Please configure your API key in Settings before running agents.` })
        ]
      );

      publisher.publish(`run-events:${runId}`, JSON.stringify({ 
        type: 'RUN_COMPLETED', 
        data: { status: 'FAILED', error: 'Missing API Key' } 
      }));
      break;
    }

    const llmClient = getLLMClient(userApiKey, provider);

    // 2. Fetch the latest step
    const { rows: stepRows } = await query(
      'SELECT * FROM steps WHERE run_id = $1 ORDER BY step_number DESC LIMIT 1',
      [runId]
    );
    
    let currentPhase = 'PLANNING';
    let stepNumber = 1;
    
    if (stepRows.length > 0) {
      const latestStep = stepRows[0];
      stepNumber = latestStep.step_number + 1;
      
      // Determine next phase based on last step's phase
      if (latestStep.phase === 'PLANNING') {
        if (latestStep.tool_name) { // Oh wait, schema says tool_name
          currentPhase = 'TOOL_CALL';
        } else {
          // If planning returned no tool, we are done
          await query('UPDATE runs SET status = $1, finished_at = NOW() WHERE id = $2', ['DONE', runId]);
          break;
        }
      } else if (latestStep.phase === 'TOOL_CALL') {
        currentPhase = 'TOOL_RESULT';
      } else if (latestStep.phase === 'TOOL_RESULT') {
        currentPhase = 'PLANNING';
      }
    }

    console.log(`[Worker] Run ${runId} | Step ${stepNumber} | Phase ${currentPhase}`);

    // Update run's current step and status
    await query('UPDATE runs SET current_step = $1, status = $2 WHERE id = $3', [stepNumber, currentPhase, runId]);

    const stepId = randomUUID();
    let startTime = Date.now();

    if (currentPhase === 'PLANNING') {
      let memoryContext: string[] = [];
      if (stepNumber === 1) {
         // Retrieve past memories
         const fakeQueryEmbedding = Array(1536).fill(0.1);
         const { rows: memRows } = await query(
           `SELECT summary FROM run_memory WHERE agent_id = $1 ORDER BY embedding <-> $2::vector LIMIT 3`,
           [run.agent_id, `[${fakeQueryEmbedding.join(',')}]`]
         );
         memoryContext = memRows.map(r => r.summary);
         console.log(`[Worker] Injected ${memoryContext.length} memories into context.`);
      } else {
         // Retrieve previous steps for this run
         const { rows: allSteps } = await query('SELECT * FROM steps WHERE run_id = $1 ORDER BY step_number ASC', [runId]);
         memoryContext = allSteps.map(s => {
           if (s.phase === 'PLANNING' && s.tool_name) {
             return `Assistant decided to call tool: ${s.tool_name} with input: ${JSON.stringify(s.tool_input)}`;
           } else if (s.phase === 'TOOL_RESULT') {
             return `Tool ${s.tool_name} returned: ${JSON.stringify(s.tool_output)}`;
           }
           return '';
         }).filter(Boolean);
      }

      // Call LLM
      const llmRes = await llmClient.generate(run.input_task, memoryContext);
      const latency = Date.now() - startTime;
      
      // Persist planning step
      await query(
        `INSERT INTO steps (id, run_id, step_number, phase, model_output, tool_name, tool_input, tokens_in, tokens_out, cost_usd, latency_ms) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          stepId, runId, stepNumber, currentPhase, 
          JSON.stringify({ text: llmRes.text }), 
          llmRes.toolCall?.name || null, 
          llmRes.toolCall ? JSON.stringify(llmRes.toolCall.input) : null,
          llmRes.tokensIn, llmRes.tokensOut, 0.001, latency
        ]
      );
      
      // Update totals in run
      await query(
        `UPDATE runs SET total_tokens = COALESCE(total_tokens, 0) + $1, total_cost_usd = COALESCE(total_cost_usd, 0) + $2 WHERE id = $3`,
        [llmRes.tokensIn + llmRes.tokensOut, 0.001, runId]
      );
      
      const stepData = {
        id: stepId,
        run_id: runId,
        step_number: stepNumber,
        phase: currentPhase,
        model_output: { text: llmRes.text },
        tool_name: llmRes.toolCall?.name || null,
        tool_input: llmRes.toolCall ? llmRes.toolCall.input : null,
      };
      
      publisher.publish(`run-events:${runId}`, JSON.stringify({ type: 'STEP_CREATED', data: stepData }));
      
      if (!llmRes.toolCall) {
        await query('UPDATE runs SET status = $1, finished_at = NOW() WHERE id = $2', ['DONE', runId]);
        publisher.publish(`run-events:${runId}`, JSON.stringify({ type: 'RUN_COMPLETED', data: { status: 'DONE' } }));
        
        // Generate and store run memory summary
        const fakeEmbedding = Array(1536).fill(Math.random());
        const summary = `Summary of run ${runId} tasks: ${run.input_task}. It was successfully completed.`;
        await query(
          `INSERT INTO run_memory (id, agent_id, run_id, summary, embedding) VALUES ($1, $2, $3, $4, $5::vector)`,
          [randomUUID(), run.agent_id, runId, summary, `[${fakeEmbedding.join(',')}]`]
        );
        console.log(`[Worker] Saved run memory for ${runId}`);
        break;
      }

    } else if (currentPhase === 'TOOL_CALL') {
      // Fetch tool name and input from the previous PLANNING step
      const { rows: prevRows } = await query(
        'SELECT tool_name, tool_input FROM steps WHERE run_id = $1 AND phase = $2 ORDER BY step_number DESC LIMIT 1',
        [runId, 'PLANNING']
      );
      const prevStep = prevRows[0];
      
      const tool = tools[prevStep.tool_name];
      if (!tool) {
         // tool not found
         await query('UPDATE runs SET status = $1, finished_at = NOW() WHERE id = $2', ['FAILED', runId]);
         publisher.publish(`run-events:${runId}`, JSON.stringify({ type: 'RUN_COMPLETED', data: { status: 'FAILED' } }));
         break;
      }

      console.log(`[Worker] Executing tool ${prevStep.tool_name}...`);
      let toolOutput;
      let latency = 0;
      let success = false;
      
      try {
        toolOutput = await tool.execute(prevStep.tool_input);
        latency = Date.now() - startTime;
        success = true;
      } catch (err: any) {
        if (!tool.idempotent) {
           console.log(`[Worker] Tool ${tool.name} failed and is not idempotent. Requires confirmation.`);
           await query('UPDATE runs SET status = $1 WHERE id = $2', ['NEEDS_CONFIRMATION', runId]);
           break;
        }
        
        console.log(`[Worker] Tool ${tool.name} failed. Retrying...`);
        // Simple auto-retry logic for idempotent
        try {
           toolOutput = await tool.execute(prevStep.tool_input);
           latency = Date.now() - startTime;
           success = true;
        } catch (retryErr: any) {
           await query('UPDATE runs SET status = $1, finished_at = NOW() WHERE id = $2', ['FAILED', runId]);
           publisher.publish(`run-events:${runId}`, JSON.stringify({ type: 'RUN_COMPLETED', data: { status: 'FAILED' } }));
           break;
        }
      }

      if (success) {
        // Persist tool result step
        await query(
          `INSERT INTO steps (id, run_id, step_number, phase, tool_name, tool_output, latency_ms) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [stepId, runId, stepNumber, 'TOOL_RESULT', prevStep.tool_name, JSON.stringify(toolOutput), latency]
        );
        
        const stepData = {
          id: stepId,
          run_id: runId,
          step_number: stepNumber,
          phase: 'TOOL_RESULT',
          tool_name: prevStep.tool_name,
          tool_output: toolOutput
        };
        
        publisher.publish(`run-events:${runId}`, JSON.stringify({ type: 'STEP_CREATED', data: stepData }));
      }

    } else if (currentPhase === 'TOOL_RESULT') {
       // Transition to planning immediately
       // The next loop iteration will handle the actual planning
    }
  }
  
  console.log(`[Worker] Finished processing run ${runId}`);
}
export async function startWorker() {
  console.log('[Worker] Starting BullMQ worker...');
  
  const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
  });
  
  const worker = new Worker('agent-runs', async job => {
    console.log(`[Worker] Received job ${job.id} for run ${job.data.runId}`);
    await processRun(job.data.runId);
  }, { connection });
  
  worker.on('completed', job => {
    console.log(`[Worker] Job ${job.id} has completed!`);
  });

  worker.on('failed', (job, err) => {
    console.log(`[Worker] Job ${job?.id} has failed with ${err.message}`);
  });
}

// Support running directly
if (require.main === module) {
  startWorker().catch(console.error);
}
