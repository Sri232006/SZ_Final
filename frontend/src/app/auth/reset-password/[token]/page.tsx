'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await authAPI.resetPassword(token as string, { password, passwordConfirm });
      toast.success('Password reset successfully! You can now login.');
      router.push('/auth/login');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to reset password. Link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
        <Image src="/images/southzone_logo_final.jpg" alt="SouthZone" width={140} height={42} className="h-8 w-auto rounded mb-8" />
        <h1 className="text-3xl font-bold text-white">Reset Password</h1>
        <p className="mt-2 text-sm text-white/40">Enter your new secure password below.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="text-xs font-medium text-white/50 mb-1.5 block">New Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full py-3.5 pl-11 pr-12 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-white/50 mb-1.5 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} required placeholder="••••••••"
                className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
            </div>
          </div>
          
          <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all glow-red-hover disabled:opacity-50 mt-6">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-white/30">
          Remembered your password? <Link href="/auth/login" className="text-accent hover:underline font-medium">Log in</Link>
        </p>
      </motion.div>
    </div>
  );
}
