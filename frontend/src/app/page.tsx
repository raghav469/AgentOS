import { Bot, Play, Activity, CheckSquare, History, ArrowUpRight, MoreVertical, Globe, Database, Cpu, Layers, HardDrive, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';
import { getUserProfile } from '@/lib/user';

export const dynamic = 'force-dynamic';

async function getAgents(token: string | undefined) {
  try {
    const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://agentos-yxmp.onrender.com').replace(/\/$/, '');
    const res = await fetch(`${apiUrl}/api/agents`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
}

async function getRuns(token: string | undefined) {
  try {
    const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://agentos-yxmp.onrender.com').replace(/\/$/, '');
    const res = await fetch(`${apiUrl}/api/runs`, { 
      cache: 'no-store',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return res.json();
  } catch (error) {
    return [];
  }
}

export default async function Home() {
  const token = (await cookies()).get('agentos_auth')?.value;
  const user = await getUserProfile();
  const userEmail = user?.email;

  const agents = await getAgents(token);
  const runs = await getRuns(token);

  // Mock data for initial empty state visual excellence
  const recentRuns = runs.length > 0 ? runs.slice(0, 5) : [
    { id: '1', agent_name: 'Bot-1', model: 'gemini', status: 'DONE', duration: '2m 14s', started_at: 'May 24, 2025 10:45 AM' },
    { id: '2', agent_name: 'Bot-1', model: 'gemini', status: 'DONE', duration: '1m 47s', started_at: 'May 24, 2025 09:32 AM' },
    { id: '3', agent_name: 'Bot-1', model: 'gemini', status: 'FAILED', duration: '0m 58s', started_at: 'May 23, 2025 08:15 PM' },
    { id: '4', agent_name: 'Bot-1', model: 'gemini', status: 'DONE', duration: '3m 21s', started_at: 'May 23, 2025 07:02 PM' },
    { id: '5', agent_name: 'Bot-1', model: 'gemini', status: 'DONE', duration: '2m 03s', started_at: 'May 23, 2025 05:44 PM' },
  ];

  return (
    <div className="app-container">
      <Sidebar userEmail={userEmail} />

      <main className="main-content bg-[#0b0f17]">
        <PageWrapper>
          
          {/* HEADER */}
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Your Agents</h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">Build, manage and monitor your AI agents</p>
            </div>
            <div className="flex gap-3">
              <Link href="/agents/new" className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors flex items-center gap-2">
                + New Agent
              </Link>
              <Link href="/runs/new" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                <Play className="w-3.5 h-3.5 fill-black text-black" />
                New Run
              </Link>
            </div>
          </header>

          {/* STAT CARDS (GRID OF 4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            
            {/* Card 1: Total Agents */}
            <div className="bg-[#121824] border border-white/5 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Agents</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{agents.length || 1}</h3>
                </div>
                <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-lg text-teal-400">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Active agents in your workspace</p>
              {/* Sparkline Wave */}
              <svg className="w-full h-8 text-teal-500/40 overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
                <path d="M0,20 Q20,5 40,15 T80,8 T100,12" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            {/* Card 2: Runs (This Week) */}
            <div className="bg-[#121824] border border-white/5 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Runs (This Week)</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{runs.length || 24}</h3>
                </div>
                <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium mb-2">▲ 18% <span className="text-slate-500">vs last week</span></p>
              {/* Sparkline Wave */}
              <svg className="w-full h-8 text-purple-500/40 overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
                <path d="M0,18 Q25,22 50,10 T80,15 T100,5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            {/* Card 3: Tasks Completed */}
            <div className="bg-[#121824] border border-white/5 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Tasks Completed</p>
                  <h3 className="text-2xl font-bold text-white mt-1">92</h3>
                </div>
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                  <CheckSquare className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium mb-2">▲ 22% <span className="text-slate-500">vs last week</span></p>
              {/* Sparkline Wave */}
              <svg className="w-full h-8 text-blue-500/40 overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
                <path d="M0,15 Q30,5 60,18 T100,8" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>

            {/* Card 4: Success Rate */}
            <div className="bg-[#121824] border border-white/5 rounded-xl p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Success Rate</p>
                  <h3 className="text-2xl font-bold text-white mt-1">95.8%</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                  <History className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium mb-2">▲ 4.3% <span className="text-slate-500">vs last week</span></p>
              {/* Sparkline Wave */}
              <svg className="w-full h-8 text-emerald-500/40 overflow-visible" viewBox="0 0 100 25" preserveAspectRatio="none">
                <path d="M0,22 Q20,12 40,18 T80,8 T100,4" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* MIDDLE SECTION (AGENTS & ACTIVITY CHART) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            
            {/* YOUR AGENTS LIST */}
            <div className="lg:col-span-6 bg-[#121824] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-sm font-semibold text-white">Your Agents</h2>
                  <Link href="/agents/new" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium">
                    View all &rarr;
                  </Link>
                </div>

                <div className="space-y-3 mb-4">
                  {agents.length === 0 ? (
                    <div className="bg-[#0b0f17] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20 text-teal-400">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">Bot-1</h4>
                          <p className="text-xs text-slate-500">gemini</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-medium">Idle</span>
                        <MoreVertical className="w-4 h-4 text-slate-500 cursor-pointer" />
                      </div>
                    </div>
                  ) : (
                    agents.map((agent: any) => (
                      <div key={agent.id} className="bg-[#0b0f17] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-teal-500/10 rounded-lg border border-teal-500/20 text-teal-400">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white">{agent.name}</h4>
                            <p className="text-xs text-slate-500">{agent.model}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-medium">Idle</span>
                          <MoreVertical className="w-4 h-4 text-slate-500 cursor-pointer" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Link href="/agents/new" className="w-full py-3 border border-dashed border-slate-700/80 hover:border-teal-500/50 rounded-xl text-xs font-medium text-slate-400 hover:text-teal-400 transition-all text-center flex items-center justify-center gap-2 bg-[#0b0f17]/40">
                + Create New Agent
              </Link>
            </div>

            {/* RUN ACTIVITY BAR CHART */}
            <div className="lg:col-span-6 bg-[#121824] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-sm font-semibold text-white">Run Activity</h2>
                <select className="bg-[#0b0f17] border border-slate-700 text-xs text-slate-300 rounded-lg px-2.5 py-1 focus:outline-none">
                  <option>This Week</option>
                  <option>Last Week</option>
                </select>
              </div>

              {/* Stacked Bar Chart Visual */}
              <div className="h-44 flex items-end justify-between gap-3 px-2 pt-4 border-b border-slate-800/60 pb-2">
                {/* Mon */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full max-w-[28px] bg-slate-800 rounded-t overflow-hidden flex flex-col justify-end h-24">
                    <div className="bg-purple-500 h-[15%]" />
                    <div className="bg-teal-500 h-[85%]" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Mon</span>
                </div>
                {/* Tue */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full max-w-[28px] bg-slate-800 rounded-t overflow-hidden flex flex-col justify-end h-36">
                    <div className="bg-purple-500 h-[10%]" />
                    <div className="bg-teal-500 h-[90%]" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Tue</span>
                </div>
                {/* Wed */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full max-w-[28px] bg-slate-800 rounded-t overflow-hidden flex flex-col justify-end h-40">
                    <div className="bg-purple-500 h-[8%]" />
                    <div className="bg-teal-500 h-[92%]" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Wed</span>
                </div>
                {/* Thu */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full max-w-[28px] bg-slate-800 rounded-t overflow-hidden flex flex-col justify-end h-32">
                    <div className="bg-purple-500 h-[12%]" />
                    <div className="bg-teal-500 h-[88%]" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Thu</span>
                </div>
                {/* Fri */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full max-w-[28px] bg-slate-800 rounded-t overflow-hidden flex flex-col justify-end h-44">
                    <div className="bg-purple-500 h-[15%]" />
                    <div className="bg-teal-500 h-[85%]" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Fri</span>
                </div>
                {/* Sat */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full max-w-[28px] bg-slate-800 rounded-t overflow-hidden flex flex-col justify-end h-20">
                    <div className="bg-purple-500 h-[10%]" />
                    <div className="bg-teal-500 h-[90%]" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Sat</span>
                </div>
                {/* Sun */}
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-full max-w-[28px] bg-slate-800 rounded-t overflow-hidden flex flex-col justify-end h-28">
                    <div className="bg-purple-500 h-[12%]" />
                    <div className="bg-teal-500 h-[88%]" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Sun</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                  <span>Successful</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span>Failed</span>
                </div>
              </div>
            </div>

          </div>

          {/* BOTTOM SECTION (RECENT RUNS & SYSTEM HEALTH) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* RECENT RUNS TABLE */}
            <div className="lg:col-span-8 bg-[#121824] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white mb-4">Recent Runs</h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] text-slate-500 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Agent</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold">Duration</th>
                        <th className="pb-3 font-semibold">Started At</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {recentRuns.map((run: any, idx: number) => (
                        <tr key={run.id || idx} className="hover:bg-slate-800/40 transition-colors cursor-pointer group">
                          <td className="py-3">
                            <Link href={`/runs/${run.id}`} className="flex items-center gap-3">
                              <div className="p-1.5 bg-teal-500/10 rounded text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                                <Bot className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-medium text-white group-hover:text-teal-300 transition-colors">{run.agent_name || 'Bot-1'}</p>
                                <p className="text-[10px] text-slate-500">{run.model || 'gemini'}</p>
                              </div>
                            </Link>
                          </td>
                          <td className="py-3">
                            <Link href={`/runs/${run.id}`}>
                              {run.status === 'FAILED' ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Failed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Success
                                </span>
                              )}
                            </Link>
                          </td>
                          <td className="py-3 text-slate-400 font-mono text-xs">{run.duration || '2m 14s'}</td>
                          <td className="py-3 text-slate-400 text-xs">{run.started_at || 'May 24, 2025 10:45 AM'}</td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2 text-slate-400">
                              <Link href={`/runs/${run.id}`} className="p-1 hover:text-white rounded bg-slate-800/50 border border-slate-700/50 hover:bg-teal-500/20 hover:text-teal-300">
                                <Play className="w-3 h-3 fill-current" />
                              </Link>
                              <Link href={`/runs/${run.id}`} className="p-1 hover:text-white">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
                <Link href="/runs" className="text-xs text-teal-400 hover:text-teal-300 font-medium inline-flex items-center gap-1">
                  View all runs &rarr;
                </Link>
              </div>
            </div>

            {/* SYSTEM HEALTH */}
            <div className="lg:col-span-4 bg-[#121824] border border-white/5 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white mb-4">System Health</h2>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b0f17] border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-200">API Service</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      Healthy <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b0f17] border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-200">Database</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      Healthy <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b0f17] border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <Layers className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-200">Vector Store</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      Healthy <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b0f17] border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-200">Worker Queue</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      Healthy <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b0f17] border border-white/5">
                    <div className="flex items-center gap-2.5">
                      <HardDrive className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-200">Storage</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      Healthy <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>All systems operational</span>
              </div>
            </div>

          </div>

        </PageWrapper>
      </main>
    </div>
  );
}
