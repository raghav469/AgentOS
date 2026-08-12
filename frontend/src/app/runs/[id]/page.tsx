import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Activity, CheckCircle, Clock, XCircle, Bot, Wrench, Sparkles, Terminal, Shield } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';
import { getUserProfile } from '@/lib/user';

export const dynamic = 'force-dynamic';

async function getRunDetails(id: string, token: string | undefined) {
  try {
    const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://agentos-yxmp.onrender.com').replace(/\/$/, '');
    const res = await fetch(`${apiUrl}/api/runs/${id}`, {
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    return null;
  }
}

async function getRunSteps(id: string, token: string | undefined) {
  try {
    const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://agentos-yxmp.onrender.com').replace(/\/$/, '');
    const res = await fetch(`${apiUrl}/api/runs/${id}/steps`, {
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (err) {
    return [];
  }
}

export default async function RunDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = (await cookies()).get('agentos_auth')?.value;
  const user = await getUserProfile();
  const userEmail = user?.email;

  const run = await getRunDetails(id, token);
  const steps = await getRunSteps(id, token);

  // Mock fallback if viewing a demo run from dashboard
  const displayRun = run || {
    id: id,
    input_task: 'Research competitor pricing and features',
    status: 'DONE',
    total_tokens: 1840,
    total_cost_usd: '0.0024',
    started_at: 'May 24, 2025 10:45 AM',
    agent_id: 'Bot-1'
  };

  const displaySteps = steps.length > 0 ? steps : [
    {
      step_number: 1,
      phase: 'THOUGHT',
      model_output: { text: 'Analyzing task instructions and evaluating tools required.' },
      tokens_in: 420,
      tokens_out: 85,
      cost_usd: '0.0004',
      latency_ms: 380
    },
    {
      step_number: 2,
      phase: 'TOOL_CALL',
      tool_name: 'search_web',
      tool_input: { query: 'Vercel vs Netlify pricing comparison 2026' },
      tool_output: { results: ['Vercel Pro: $20/mo', 'Netlify Pro: $19/mo'] },
      tokens_in: 650,
      tokens_out: 140,
      cost_usd: '0.0008',
      latency_ms: 620
    },
    {
      step_number: 3,
      phase: 'FINAL_ANSWER',
      model_output: { text: 'Based on search results, Vercel Pro is $20/mo and Netlify Pro is $19/mo. Both include 1TB bandwidth.' },
      tokens_in: 400,
      tokens_out: 145,
      cost_usd: '0.0006',
      latency_ms: 410
    }
  ];

  return (
    <div className="app-container">
      <Sidebar userEmail={userEmail} />

      <main className="main-content bg-[#0b0f17]">
        <PageWrapper>
          
          {/* TOP BACK BAR */}
          <div className="mb-6">
            <Link href="/runs" className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Runs
            </Link>
          </div>

          {/* RUN TITLE HEADER */}
          <div className="bg-[#121824] border border-white/5 rounded-xl p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-xs px-2.5 py-1 bg-slate-800 text-teal-400 rounded-md border border-teal-500/20">
                    Run ID: {displayRun.id.split('-')[0]}
                  </span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase flex items-center gap-1.5 ${
                    displayRun.status === 'DONE' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : displayRun.status === 'FAILED'
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                  }`}>
                    {displayRun.status === 'DONE' && <CheckCircle className="w-3.5 h-3.5" />}
                    {displayRun.status === 'FAILED' && <XCircle className="w-3.5 h-3.5" />}
                    {displayRun.status === 'QUEUED' && <Clock className="w-3.5 h-3.5" />}
                    {displayRun.status}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">{displayRun.input_task}</h1>
              </div>
            </div>

            {/* METRICS ROW */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/60 text-xs">
              <div>
                <p className="text-slate-500 font-medium">Agent</p>
                <p className="text-slate-200 font-semibold mt-0.5 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-teal-400" /> {displayRun.agent_id || 'Bot-1'}
                </p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Total Tokens</p>
                <p className="text-slate-200 font-semibold mt-0.5 font-mono">{displayRun.total_tokens || 0} tokens</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Cost (USD)</p>
                <p className="text-emerald-400 font-semibold mt-0.5 font-mono">${displayRun.total_cost_usd || '0.00'}</p>
              </div>
              <div>
                <p className="text-slate-500 font-medium">Started At</p>
                <p className="text-slate-200 font-semibold mt-0.5">{displayRun.started_at || 'Just now'}</p>
              </div>
            </div>
          </div>

          {/* STEP BY STEP BREAKDOWN & AUDIT TRAIL */}
          <div className="space-y-6">
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              Reasoning Steps & Tool Calls ({displaySteps.length})
            </h2>

            <div className="space-y-4">
              {displaySteps.map((step: any, idx: number) => (
                <div key={idx} className="bg-[#121824] border border-white/5 rounded-xl p-5 relative overflow-hidden transition-all hover:border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-teal-400 flex items-center justify-center font-mono text-xs font-bold border border-teal-500/20">
                        {step.step_number || idx + 1}
                      </span>
                      <span className="text-xs font-semibold tracking-wide text-white uppercase flex items-center gap-1.5">
                        {step.phase === 'TOOL_CALL' && <Wrench className="w-3.5 h-3.5 text-purple-400" />}
                        {step.phase === 'THOUGHT' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                        {step.phase === 'FINAL_ANSWER' && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        {step.phase || 'STEP'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                      <span>{step.latency_ms || 350}ms</span>
                      <span>•</span>
                      <span>${step.cost_usd || '0.0004'}</span>
                    </div>
                  </div>

                  {/* THOUGHT CONTENT */}
                  {step.model_output && (
                    <div className="bg-[#0b0f17] border border-slate-800/80 rounded-lg p-3.5 mb-3 text-xs text-slate-300 leading-relaxed font-sans">
                      {typeof step.model_output === 'string' 
                        ? step.model_output 
                        : (step.model_output.text || JSON.stringify(step.model_output))}
                    </div>
                  )}

                  {/* TOOL CALL DETAILS */}
                  {step.tool_name && (
                    <div className="space-y-2 mt-3">
                      <div className="bg-slate-900/90 border border-purple-500/20 rounded-lg p-3 text-xs font-mono">
                        <div className="text-purple-400 font-semibold mb-1 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" /> Tool Executed: <span className="text-white">{step.tool_name}</span>
                        </div>
                        {step.tool_input && (
                          <div className="text-slate-400 mt-1">
                            <span className="text-slate-500">Input: </span> 
                            {JSON.stringify(step.tool_input)}
                          </div>
                        )}
                        {step.tool_output && (
                          <div className="text-emerald-400/90 mt-1.5 pt-1.5 border-t border-slate-800">
                            <span className="text-slate-500">Output: </span> 
                            {JSON.stringify(step.tool_output)}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </PageWrapper>
      </main>
    </div>
  );
}
