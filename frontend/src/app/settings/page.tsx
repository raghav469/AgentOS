import { CreditCard, Sparkles } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import PageWrapper from '@/components/PageWrapper';
import SettingsForm from '@/components/SettingsForm';
import { getUserProfile } from '@/lib/user';

export default async function SettingsPage() {
  const userProfile = await getUserProfile();

  const userEmail = userProfile?.email || 'admin@agentos.com';
  const username = userEmail.split('@')[0];
  const displayName = userProfile?.name || (username.charAt(0).toUpperCase() + username.slice(1));

  return (
    <div className="app-container">
      <Sidebar userEmail={userEmail} />

      <main className="main-content">
        <PageWrapper>
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Settings</h1>
              <p className="text-xs text-slate-400 mt-1">Manage your account preferences and custom LLM API keys.</p>
            </div>
          </header>

          <section className="max-w-3xl space-y-6">
            
            {/* PLAN & BILLING SECTION */}
            <div className="glass-card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/20 rounded-full blur-[50px] -mr-10 -mt-10" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 rounded-lg bg-teal-500/20">
                  <CreditCard className="w-5 h-5 text-teal-400" />
                </div>
                <h2 className="text-lg font-semibold text-white">Current Plan</h2>
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-800/30 p-5 rounded-xl border border-white/5">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-white">
                      Free Unlimited Tier
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-400 text-xs font-semibold flex items-center gap-1 border border-teal-500/30">
                      <Sparkles className="w-3 h-3" /> Active
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    You have free, unrestricted access to create and run all autonomous AI agents.
                  </p>
                </div>
              </div>
            </div>

            {/* INTERACTIVE SETTINGS & API KEYS FORM */}
            <SettingsForm
              displayName={displayName}
              userEmail={userEmail}
              geminiApiKey={userProfile?.gemini_api_key}
              openaiApiKey={userProfile?.openai_api_key}
            />

          </section>
        </PageWrapper>
      </main>
    </div>
  );
}
