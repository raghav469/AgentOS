'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Activity, X } from 'lucide-react';
import Link from 'next/link';

export default function NewRunPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    agent_id: '',
    input_task: ''
  });

  useEffect(() => {
    fetch(`/api/agents`)
      .then(res => res.json())
      .then(data => {
        setAgents(data);
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, agent_id: data[0].id }));
        }
      })
      .catch(err => console.error(err));
  }, []);

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        router.push('/runs');
        router.refresh();
      } else {
        const errorData = await res.json();
        if (res.status === 403) {
          setError(errorData.error || 'Pro subscription required to run agents. Please upgrade in Settings.');
        } else {
          setError(errorData.error || 'Failed to start run.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to start run.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-8 md:p-12 lg:p-24 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Play className="w-8 h-8 text-blue-400" />
            Start New Run
          </h1>
          <p className="text-slate-400">Assign a task to one of your autonomous agents.</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
          <X className="w-4 h-4" />
          Cancel
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            {error.includes('Settings') && (
              <Link href="/settings" className="underline font-semibold hover:text-white">
                Go to Settings &rarr;
              </Link>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Select Agent</label>
            <select 
              required
              value={formData.agent_id}
              onChange={e => setFormData(prev => ({ ...prev, agent_id: e.target.value }))}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {agents.length === 0 && <option value="">No agents available</option>}
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.model})
                </option>
              ))}
            </select>
            {agents.length === 0 && (
              <p className="text-xs text-slate-400 mt-2">
                You need an agent to start a run. <Link href="/agents/new" className="text-blue-400 hover:underline">Create an agent here</Link>.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Input Task</label>
            <textarea 
              required
              rows={5}
              value={formData.input_task}
              onChange={e => setFormData(prev => ({ ...prev, input_task: e.target.value }))}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="E.g. Analyze the current user tasks and create a summary..."
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button 
            type="submit"
            disabled={isSubmitting || agents.length === 0}
            className="glass-button px-6 py-2.5 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Activity className="w-4 h-4" />
            {isSubmitting ? 'Starting...' : 'Start Run'}
          </button>
        </div>
      </form>
    </main>
  );
}
