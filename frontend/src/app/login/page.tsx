'use client';

import { motion } from 'framer-motion';
import { BrainCircuit, ArrowRight } from 'lucide-react';
import { loginAction } from '@/app/actions';
import { useState } from 'react';

import Link from 'next/link';

export default function LoginPage() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 md:p-12 rounded-2xl bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            className="w-16 h-16 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(20,184,166,0.3)]"
          >
            <BrainCircuit className="w-8 h-8 text-black" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold tracking-tight text-white mb-2"
          >
            Welcome to AgentOS
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-400 text-center"
          >
            Sign in to manage your autonomous AI agents.
          </motion.p>
        </div>

        <motion.form 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          action={async (formData) => {
            setIsPending(true);
            setError(null);
            try {
              const res = await loginAction(formData);
              if (res?.success) {
                window.location.href = '/';
              } else if (res?.error) {
                setError(res.error);
                setIsPending(false);
              }
            } catch (err) {
              console.error(err);
              setError('An unexpected error occurred.');
              setIsPending(false);
            }
          }}
          className="space-y-6"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <input 
                id="email"
                name="email"
                type="email" 
                required
                placeholder="you@company.com"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <input 
                id="password"
                name="password"
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isPending}
            className="w-full bg-white text-black font-semibold rounded-xl px-5 py-3.5 flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isPending ? 'Authenticating...' : 'Continue'}
            {!isPending && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </motion.form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-6 flex flex-col items-center gap-4"
        >
          <Link href="/register" className="text-sm text-slate-400 hover:text-white transition-colors">
            Don't have an account? Sign up
          </Link>
          <p className="text-xs text-slate-500">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
