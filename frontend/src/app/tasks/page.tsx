import { CheckSquare, Play } from 'lucide-react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';

export const dynamic = 'force-dynamic';



async function getTasks() {
  try {
    const apiUrl = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://agentos-yxmp.onrender.com').replace(/\/$/, '');
    const token = (await cookies()).get('agentos_auth')?.value;
    
    const res = await fetch(`${apiUrl}/api/tasks`, { 
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

import { getUserProfile } from '@/lib/user';

export default async function TasksPage() {
  const tasks = await getTasks();
  const user = await getUserProfile();
  const userEmail = user?.email;

  return (
    <div className="app-container">
      <Sidebar userEmail={userEmail} />

      <main className="main-content">
        <PageWrapper>
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Your Tasks</h1>
            <Link href="/runs/new" className="primary-button">
              <Play className="w-4 h-4 fill-black" />
              New Run
            </Link>
          </header>

          <section>
            <div className="grid grid-cols-1 gap-4">
              {tasks.length === 0 && (
                <div className="glass-card text-center text-slate-500 py-12">
                  No pending tasks found.
                </div>
              )}
              {tasks.map((task: any) => (
                <div key={task.id} className="glass-card flex justify-between items-center transition-all hover:border-teal-500/30 hover:shadow-[0_0_20px_rgba(20,184,166,0.1)]">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#2d2d2d] rounded-lg">
                      <CheckSquare className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                      {task.description && (
                        <p className="text-xs text-slate-400">{task.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                    <span className="status-badge pending">
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </PageWrapper>
      </main>
    </div>
  );
}
