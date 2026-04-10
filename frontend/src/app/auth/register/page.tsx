'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Phone as PhoneIcon, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth, user } = useAuthStore();
  const router = useRouter();

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  // Check password strength
  useEffect(() => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let score = 0;
    if (hasMinLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;
    
    setPasswordStrength({
      score,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
    });
  }, [password]);

  const getStrengthText = () => {
    if (passwordStrength.score === 0) return 'Enter password';
    if (passwordStrength.score <= 2) return 'Weak';
    if (passwordStrength.score <= 3) return 'Medium';
    if (passwordStrength.score <= 4) return 'Strong';
    return 'Very Strong';
  };

  const getStrengthColor = () => {
    if (passwordStrength.score === 0) return 'bg-white/20';
    if (passwordStrength.score <= 2) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-yellow-500';
    if (passwordStrength.score <= 4) return 'bg-green-500';
    return 'bg-emerald-500';
  };

  const getStrengthWidth = () => {
    if (passwordStrength.score === 0) return '0%';
    return `${(passwordStrength.score / 5) * 100}%`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password strength
    if (passwordStrength.score < 3) {
      toast.error('Please use a stronger password (at least 8 characters with uppercase, lowercase, number)');
      return;
    }
    
    if (password !== confirmPass) { 
      toast.error('Passwords do not match'); 
      return; 
    }
    
    if (!phone) { 
      toast.error('Phone number is required'); 
      return; 
    }
    
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name, email, password, phone });
      setAuth(data.data.user, data.token);
      toast.success('Account created!');
      router.push('/');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block lg:w-1/2 relative">
        <Image src="/images/hero6.jpg" alt="Fashion" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black" />
        <div className="absolute bottom-16 left-16 right-16">
          <Image src="/images/southzone_logo_final.jpg" alt="Southzone" width={200} height={60} className="h-12 w-auto rounded mb-4" />
          <p className="text-white/50 text-sm max-w-sm">Join the Southzone community. Exclusive drops, early access, and more.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 lg:p-16 bg-background">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Image src="/images/southzone_logo_final.jpg" alt="SouthZone" width={140} height={42} className="h-8 w-auto rounded" /></div>
          <h1 className="text-3xl font-bold text-white">Create account</h1>
          <p className="mt-2 text-sm text-white/40">Join Southzone for the best streetwear experience</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe" className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 transition-all" />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 transition-all" />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Phone Number <span className="text-accent">*</span></label>
              <div className="relative">
                <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="9876543210" className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 transition-all" />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full py-3.5 pl-11 pr-12 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 transition-all" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/40">Password strength:</span>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 2 ? 'text-red-400' :
                      passwordStrength.score <= 3 ? 'text-yellow-400' :
                      passwordStrength.score <= 4 ? 'text-green-400' : 'text-emerald-400'
                    }`}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${getStrengthColor()}`}
                      style={{ width: getStrengthWidth() }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      {passwordStrength.hasMinLength ? 
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : 
                        <XCircle className="w-3.5 h-3.5 text-white/20" />
                      }
                      <span className={passwordStrength.hasMinLength ? 'text-green-400' : 'text-white/30'}>8+ characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordStrength.hasUpperCase ? 
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : 
                        <XCircle className="w-3.5 h-3.5 text-white/20" />
                      }
                      <span className={passwordStrength.hasUpperCase ? 'text-green-400' : 'text-white/30'}>Uppercase</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordStrength.hasLowerCase ? 
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : 
                        <XCircle className="w-3.5 h-3.5 text-white/20" />
                      }
                      <span className={passwordStrength.hasLowerCase ? 'text-green-400' : 'text-white/30'}>Lowercase</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {passwordStrength.hasNumber ? 
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : 
                        <XCircle className="w-3.5 h-3.5 text-white/20" />
                      }
                      <span className={passwordStrength.hasNumber ? 'text-green-400' : 'text-white/30'}>Number</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      {passwordStrength.hasSpecialChar ? 
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : 
                        <XCircle className="w-3.5 h-3.5 text-white/20" />
                      }
                      <span className={passwordStrength.hasSpecialChar ? 'text-green-400' : 'text-white/30'}>Special character (!@#$%^&*)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} required placeholder="••••••••" className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 transition-all" />
              </div>
              {confirmPass && password !== confirmPass && (
                <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
              )}
            </div>
            
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all glow-red-hover disabled:opacity-50 mt-6">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          
          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-white/20">or</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>
          
          <button className="mt-6 w-full flex items-center justify-center gap-3 py-3.5 rounded-xl glass glass-hover text-sm text-white/70 hover:text-white transition-colors">
            <Image src="/images/google.png" alt="Google" width={18} height={18} className="w-auto h-auto" /> Continue with Google
          </button>
          
          <p className="mt-8 text-center text-sm text-white/30">
            Already have an account? <Link href="/auth/login" className="text-accent hover:underline font-medium">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}