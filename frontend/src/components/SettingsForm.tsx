'use client';

import { useState } from 'react';
import { Save, User, Key, CheckCircle, AlertCircle } from 'lucide-react';
import { updateSettingsAction } from '@/app/actions';

interface SettingsFormProps {
  displayName: string;
  userEmail: string;
  geminiApiKey?: string;
  openaiApiKey?: string;
}

export default function SettingsForm({
  displayName,
  userEmail,
  geminiApiKey = '',
  openaiApiKey = '',
}: SettingsFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateSettingsAction(formData);
      if (res?.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      } else if (res?.error) {
        setError(res.error);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to save settings.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-16">
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm px-4 py-3 rounded-xl">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Your settings and API keys have been saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* PROFILE PREFERENCES */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <User className="w-5 h-5 text-purple-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Profile Preferences</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
            <input
              type="text"
              name="name"
              defaultValue={displayName}
              placeholder="Your Name"
              className="w-full max-w-md bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-teal-500 transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
            <input
              type="email"
              defaultValue={userEmail}
              disabled
              className="w-full max-w-md bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-500 cursor-not-allowed focus:outline-none transition-colors text-sm"
            />
          </div>
        </div>
      </div>

      {/* API KEYS SECTION */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Key className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Your Custom API Keys</h2>
            <p className="text-xs text-slate-400">Configure your personal API keys so agent runs use your own quota.</p>
          </div>
        </div>

        <div className="space-y-5 pt-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Google Gemini API Key</label>
            <input
              type="password"
              name="gemini_api_key"
              defaultValue={geminiApiKey}
              placeholder="AIzaSy..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Used for agents using Gemini models.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">OpenAI API Key</label>
            <input
              type="password"
              name="openai_api_key"
              defaultValue={openaiApiKey}
              placeholder="sk-..."
              className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">Used for agents using OpenAI (gpt-4o) models.</p>
          </div>
        </div>
      </div>

      {/* SAVE BUTTON WITH PROPER SPACING */}
      <div className="flex justify-end pt-4 pb-8">
        <button
          type="submit"
          disabled={isPending}
          className="primary-button group px-6 py-3 text-sm font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
          {isPending ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
