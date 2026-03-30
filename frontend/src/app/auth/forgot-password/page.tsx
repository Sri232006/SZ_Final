'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset link sent! Check your email.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <Link href="/auth/login" className="flex items-center gap-1 text-sm text-white/30 hover:text-white/60 transition-colors mb-8"><ChevronLeft className="w-4 h-4" /> Back to Login</Link>
        <Image src="/images/southzone_logo_final.jpg" alt="SouthZone" width={140} height={42} className="h-8 w-auto rounded mb-8" />
        <h1 className="text-3xl font-bold text-white">Forgot Password</h1>
        <p className="mt-2 text-sm text-white/40">Enter your email and we&apos;ll send you a reset link</p>

        {sent ? (
          <div className="mt-8 p-6 rounded-2xl glass-strong text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4"><Mail className="w-7 h-7 text-emerald-400" /></div>
            <h2 className="text-lg font-bold text-white">Check your email</h2>
            <p className="mt-2 text-sm text-white/40">We&apos;ve sent a password reset link to <strong className="text-white/60">{email}</strong></p>
            <Link href="/auth/login" className="mt-6 inline-flex items-center gap-2 text-sm text-accent hover:underline">Back to Login <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                  className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all glow-red-hover disabled:opacity-50">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Send Reset Link <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
