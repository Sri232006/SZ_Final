'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, Lock, Shield, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { userAPI, authAPI } from '@/lib/api';

export default function AdminSettings() {
  const { token, user, setAuth } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await userAPI.getProfile();
        const u = data?.data?.user || data?.data || data?.user;
        setName(u?.name || '');
        setEmail(u?.email || '');
        setPhone(u?.phone || '');
      } catch {
        // fallback
        setName(user?.name || '');
        setEmail(user?.email || '');
        setPhone(user?.phone || '');
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await userAPI.updateProfile({ name, email, phone });
      setAuth(data.data?.user || data.data || data.user, token!);
      toast.success('Admin profile updated!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmNewPass) { toast.error('Passwords do not match'); return; }
    setSavingPass(true);
    try {
      await authAPI.updatePassword({ currentPassword: currentPass, password: newPass, passwordConfirm: confirmNewPass });
      toast.success('Admin password updated securely!');
      setCurrentPass(''); setNewPass(''); setConfirmNewPass('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSavingPass(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-8">Account Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Personal Info */}
        <div className="p-6 rounded-2xl glass-strong border border-white/5 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><User className="w-5 h-5 text-accent" /> Personal Information</h2>
            <p className="text-sm text-white/40 mt-1">Manage your admin details</p>
          </div>
          
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full py-3 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full py-3 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" required className="w-full py-3 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={savingProfile} className="w-full px-6 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {savingProfile ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Security Info */}
        <div className="p-6 rounded-2xl glass-strong border border-white/5 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Shield className="w-5 h-5 text-accent" /> Password & Security</h2>
            <p className="text-sm text-white/40 mt-1">Keep your admin account secure</p>
          </div>
          
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required placeholder="••••••••" className="w-full py-3 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required placeholder="••••••••" className="w-full py-3 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="password" value={confirmNewPass} onChange={(e) => setConfirmNewPass(e.target.value)} required placeholder="••••••••" className="w-full py-3 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={savingPass} className="w-full px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-all glow-red-hover disabled:opacity-50 flex items-center justify-center gap-2">
                {savingPass ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
