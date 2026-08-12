import { Activity, Play, CheckCircle, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';

import { getUserProfile } from '@/lib/user';

export const dynamic = 'force-dynamic';

async function getRuns() {
  try {
    const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://agentos-yxmp.onrender.com').replace(/\/$/, '');
    const token = (await cookies()).get('agentos_auth')?.value;
    
    const res = await fetch(`${apiUrl}/api/runs`, { 
      cache: 'no-store',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function RunsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  let runs = await getRuns();
  const user = await getUserProfile();
  const userEmail = user?.email;
  
  const resolvedSearchParams = await searchParams;
  if (resolvedSearchParams?.filter === 'completed') {
    runs = runs.filter((run: any) => run.status === 'DONE' || run.status === 'FAILED');
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'DONE': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'FAILED': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'QUEUED': return <Clock className="w-5 h-5 text-amber-400" />;
      default: return <Activity className="w-5 h-5 text-blue-400 animate-pulse" />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar userEmail={userEmail} />

      <main className="main-content">
        <PageWrapper>
          <header className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  {resolvedSearchParams?.filter === 'completed' ? 'Run History' : 'Live Runs'}
                </h1>
                <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Execution Pipeline</p>
              </div>
            </div>
            <Link href="/runs/new" className="primary-button">
              <Play className="w-4 h-4 fill-black" />
              New Run
            </Link>
          </header>

          <section className="space-y-4">
            {runs.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Activity className="w-12 h-12 text-slate-500 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-medium text-slate-300 mb-2">No runs found</h3>
                <p className="text-slate-500 mb-6">Start a new run to see it appear here.</p>
                <Link href="/runs/new" className="primary-button">
                  <Play className="w-4 h-4 fill-black" />
                  Start First Run
                </Link>
              </div>
            ) : (
              runs.map((run: any) => (
                <Link key={run.id} href={`/runs/${run.id}`} className="block group">
                  <div className="glass-card p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between transition-all hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getStatusIcon(run.status)}
                      </div>
                      <div>
                        <h3 className="font-medium text-lg text-slate-200 group-hover:text-teal-300 transition-colors line-clamp-1">{run.input_task}</h3>
                        <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                          <span className="font-mono text-xs px-2 py-1 bg-slate-800 rounded text-teal-400 border border-teal-500/20">{run.id.split('-')[0]}</span>
                          <span>Agent: {run.agent_id ? run.agent_id.split('-')[0] : 'Bot-1'}</span>
                          <span>•</span>
                          <span>Tokens: {run.total_tokens || 0}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 min-w-max">
                      <div className="text-right">
                        <div className={`status-badge ${run.status === 'DONE' ? 'active' : run.status === 'QUEUED' ? 'idle' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                          {run.status}
                        </div>
                        {run.current_step > 0 && <div className="text-xs text-slate-500 mt-2">Step {run.current_step}</div>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </section>
        </PageWrapper>
      </main>
    </div>
  );
}
