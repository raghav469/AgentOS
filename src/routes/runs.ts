import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { randomUUID } from 'crypto';
import { runQueue } from '../queue';

interface CreateRunBody {
  agent_id: string;
  input_task: string;
}

export const runRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  // Add authentication hook to all routes in this plugin
  server.addHook('preValidation', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });

  // GET /api/runs
  server.get('/', async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { rows } = await client.query(`
        SELECT r.* FROM runs r
        JOIN agents a ON r.agent_id = a.id
        WHERE a.user_id = $1
        ORDER BY r.started_at DESC
      `, [request.user.id]);
      return rows;
    } finally {
      client.release();
    }
  });

  // GET /api/runs/:id
  server.get<{ Params: { id: string } }>('/:id', async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { id } = request.params;
      const { rows } = await client.query(`
        SELECT r.* FROM runs r
        JOIN agents a ON r.agent_id = a.id
        WHERE r.id = $1 AND a.user_id = $2
      `, [id, request.user.id]);
      if (rows.length === 0) {
        return reply.status(404).send({ error: 'Run not found' });
      }
      return rows[0];
    } finally {
      client.release();
    }
  });

  // GET /api/runs/:id/steps
  server.get<{ Params: { id: string } }>('/:id/steps', async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { id } = request.params;
      
      // Verify run ownership first
      const { rows: runRows } = await client.query(`
        SELECT r.id FROM runs r JOIN agents a ON r.agent_id = a.id WHERE r.id = $1 AND a.user_id = $2
      `, [id, request.user.id]);
      
      if (runRows.length === 0) {
        return reply.status(404).send({ error: 'Run not found' });
      }

      const { rows } = await client.query('SELECT * FROM steps WHERE run_id = $1 ORDER BY step_number ASC', [id]);
      return rows;
    } finally {
      client.release();
    }
  });

  // POST /api/runs
  server.post<{ Body: CreateRunBody }>('/', async (request: any, reply) => {
    const client = await server.pg.connect();
    try {
      const { agent_id, input_task } = request.body;
      const id = randomUUID();
      
      // Verify agent belongs to user
      const { rows: agentRows } = await client.query('SELECT id, model FROM agents WHERE id = $1 AND user_id = $2', [agent_id, request.user.id]);
      if (agentRows.length === 0) {
        return reply.status(404).send({ error: 'Agent not found' });
      }
      const agent = agentRows[0];

      // Check if user has configured an API key for the chosen model provider
      const { rows: userRows } = await client.query('SELECT gemini_api_key, openai_api_key FROM users WHERE id = $1', [request.user.id]);
      const user = userRows[0];
      const provider = (agent.model || 'gemini').toLowerCase();
      const userApiKey = provider === 'openai' ? user?.openai_api_key : user?.gemini_api_key;

      if (!userApiKey || !userApiKey.trim()) {
        return reply.status(400).send({
          error: `API Key Required: You must enter your personal ${provider.toUpperCase()} API key in Settings before launching runs.`
        });
      }

      const { rows } = await client.query(
        `INSERT INTO runs (id, agent_id, input_task, status, current_step, total_cost_usd, total_tokens) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [id, agent_id, input_task, 'QUEUED', 0, 0, 0]
      );
      
      const run = rows[0];
      
      // Enqueue job
      await runQueue.add('process-run', { runId: id });
      
      return reply.status(201).send(run);
    } finally {
      client.release();
    }
  });
};
