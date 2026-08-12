'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Save, X } from 'lucide-react';
import Link from 'next/link';

const AVAILABLE_TOOLS = ['web_search', 'code_exec', 'fake_send_email', 'list_tasks', 'create_task'];

export default function CreateAgentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    model: 'mock',
    system_prompt: 'You are a helpful assistant.',
    allowed_tools: [] as string[]
  });

  const handleToolToggle = (tool: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_tools: prev.allowed_tools.includes(tool)
        ? prev.allowed_tools.filter(t => t !== tool)
        : [...prev.allowed_tools, tool]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`/api/agents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        throw new Error('Failed to create agent');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen p-8 md:p-12 lg:p-24 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Bot className="w-8 h-8 text-blue-400" />
            Create New Agent
          </h1>
          <p className="text-slate-400">Configure a new autonomous agent for your workspace.</p>
        </div>
        <Link href="/" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
          <X className="w-4 h-4" />
          Cancel
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Agent Name</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="e.g. TaskManagerBot"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Model Provider</label>
            <select 
              value={formData.model}
              onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="gemini">Gemini (Free Tier)</option>
              <option value="mock">Mock LLM (Free/Test)</option>
              <option value="openai">OpenAI (Requires Key)</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">System Prompt</label>
            <textarea 
              required
              rows={4}
              value={formData.system_prompt}
              onChange={e => setFormData(prev => ({ ...prev, system_prompt: e.target.value }))}
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="Define the agent's behavior and constraints..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Allowed Tools</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_TOOLS.map(tool => (
                <label key={tool} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${formData.allowed_tools.includes(tool) ? 'bg-blue-500/20 border-blue-500/50' : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800/80'}`}>
                  <input 
                    type="checkbox"
                    checked={formData.allowed_tools.includes(tool)}
                    onChange={() => handleToolToggle(tool)}
                    className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-slate-900 bg-slate-800"
                  />
                  <span className="text-sm font-medium text-slate-200">{tool}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="glass-button px-6 py-2.5 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Create Agent'}
          </button>
        </div>
      </form>
    </main>
  );
}
