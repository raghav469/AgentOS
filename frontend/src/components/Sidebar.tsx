'use client';

import { Bot, Activity, BrainCircuit, History, Settings, CheckSquare, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions';

export default function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const defaultEmail = 'admin@agentos.com';
  const email = userEmail || defaultEmail;
  const username = email.split('@')[0];
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  return (
    <aside className="sidebar flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden font-bold text-teal-400">
            {displayName.charAt(0)}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">{displayName}</h2>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
        </div>

        <nav className="space-y-1">
          <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>
            <Bot className="w-4 h-4" />
            Agents
          </Link>
          <Link href="/runs" className={`nav-item ${pathname === '/runs' ? 'active' : ''}`}>
            <Activity className="w-4 h-4" />
            Live Runs
          </Link>
          <Link href="/tasks" className={`nav-item ${pathname === '/tasks' ? 'active' : ''}`}>
            <CheckSquare className="w-4 h-4" />
            Tasks
          </Link>
          <Link href="/runs?filter=completed" className={`nav-item ${pathname === '/history' ? 'active' : ''}`}>
            <History className="w-4 h-4" />
            History
          </Link>
          <Link href="/settings" className={`nav-item ${pathname === '/settings' ? 'active' : ''}`}>
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        </nav>
      </div>
      
      <div className="mt-auto pt-6 border-t border-white/5 space-y-6">
        <form action={logoutAction}>
          <button type="submit" className="flex items-center gap-3 text-slate-400 hover:text-white text-sm font-medium px-2 py-1.5 transition-colors cursor-pointer w-full text-left">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>

        <div className="px-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded bg-teal-500/20 flex items-center justify-center font-bold text-xs text-teal-400">
              A
            </div>
            <span className="font-bold text-sm tracking-wider text-white">AGENTOS</span>
          </div>
          <p className="text-[11px] text-slate-500">AI Agent Orchestration Platform</p>
          <p className="text-[10px] text-slate-600 font-mono mt-0.5">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
