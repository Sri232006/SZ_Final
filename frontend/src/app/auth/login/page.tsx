'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/shop');
  }, [user, router]);

  // Load saved credentials on mount
  useEffect(() => {
    const savedIdentifier = localStorage.getItem('rememberedIdentifier');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedIdentifier && savedPassword) {
      setIdentifier(savedIdentifier);
      setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cleanId = identifier.trim().toLowerCase();
      const payload = cleanId.includes('@') ? { email: cleanId, password } : { phone: cleanId, password };
      const { data } = await authAPI.login(payload);
      setAuth(data.data.user, data.token);
      
      // Save credentials if Remember Me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedIdentifier', identifier);
        localStorage.setItem('rememberedPassword', password);
      } else {
        localStorage.removeItem('rememberedIdentifier');
        localStorage.removeItem('rememberedPassword');
      }
      
      toast.success('Welcome back!');
      router.push('/shop');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image src="/images/hero5.jpg" alt="Fashion" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black" />
        <div className="absolute bottom-16 left-16 right-16">
          <Image src="/images/southzone_logo_final.jpg" alt="SouthZone" width={200} height={60} className="h-12 w-auto rounded mb-4" />
          <p className="text-white/50 text-sm max-w-sm">Premium streetwear crafted for the bold. Join the SouthZone community.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-background">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Image src="/images/southzone_logo_final.jpg" alt="SouthZone" width={140} height={42} className="h-8 w-auto rounded" />
          </div>
          <h1 className="text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-white/40">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Email or Phone</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  type="text" 
                  value={identifier} 
                  onChange={(e) => setIdentifier(e.target.value)} 
                  required 
                  placeholder="you@example.com or 9876543210"
                  className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" 
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input 
                  type={showPass ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  placeholder="••••••••"
                  className="w-full py-3.5 pl-11 pr-12 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" 
                />
                <button 
                  type="button" 
                  onClick={() => setShowPass(!showPass)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-accent focus:ring-accent/20" 
                />
                <span className="text-xs text-white/40">Remember me</span>
              </label>
              <Link href="/auth/forgot-password" className="text-xs text-accent hover:underline">Forgot password?</Link>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all glow-red-hover disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-white/20">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          
          <button className="mt-6 w-full flex items-center justify-center gap-3 py-3.5 rounded-xl glass glass-hover text-sm text-white/70 hover:text-white transition-colors">
            <Image src="/images/google.png" alt="Google" width={18} height={18} className="w-auto h-auto" /> Continue with Google
          </button>
          
          <p className="mt-8 text-center text-sm text-white/30">
            Don&apos;t have an account? <Link href="/auth/register" className="text-accent hover:underline font-medium">Sign Up</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}