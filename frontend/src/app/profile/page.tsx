'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Lock, ShoppingBag, Heart, LogOut, Shield, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { userAPI, addressAPI, authAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

const tabs = [
  { id: 'profile', label: 'Personal Info', icon: User, desc: 'Manage your personal details' },
  { id: 'addresses', label: 'Addresses', icon: MapPin, desc: 'Shipping & billing locations' },
  { id: 'security', label: 'Security', icon: Shield, desc: 'Password & account protection' },
];

export default function ProfilePage() {
  const { token, user, logout, setAuth } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password state
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');

  // Address state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({ name: '', phone: '', addressLine1: '', city: '', state: '', pincode: '', type: 'home' });

  useEffect(() => {
    if (!token) { router.push('/auth/login'); return; }
    async function load() {
      try {
        const [profileRes, addrRes] = await Promise.allSettled([
          userAPI.getProfile(),
          addressAPI.getAll(),
        ]);
        if (profileRes.status === 'fulfilled') {
          const u = profileRes.value.data?.data?.user || profileRes.value.data?.data || profileRes.value.data?.user;
          setName(u?.name || '');
          setEmail(u?.email || '');
          setPhone(u?.phone || '');
        } else if (user) {
          setName(user.name || '');
          setEmail(user.email || '');
          setPhone(user.phone || '');
        }
        if (addrRes.status === 'fulfilled') setAddresses(addrRes.value.data?.data || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [token, router, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile({ name, email, phone });
      setAuth(data.data?.user || data.data || data.user, token!);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmNewPass) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await authAPI.updatePassword({ currentPassword: currentPass, password: newPass, passwordConfirm: confirmNewPass });
      toast.success('Password updated securely!');
      setCurrentPass(''); setNewPass(''); setConfirmNewPass('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addressAPI.create(addrForm);
      const { data } = await addressAPI.getAll();
      setAddresses(data.data || []);
      setShowAddAddress(false);
      setAddrForm({ name: '', phone: '', addressLine1: '', city: '', state: '', pincode: '', type: 'home' });
      toast.success('Address added!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add address');
    } finally { setSaving(false); }
  };

  const deleteAddress = async (id: string) => {
    try {
      await addressAPI.delete(id);
      setAddresses(addresses.filter((a) => a.id.toString() !== id));
      toast.success('Address removed');
    } catch { toast.error('Failed to remove address'); }
  };

  const setDefaultAddress = async (id: string) => {
    try {
      await addressAPI.setDefault(id);
      const { data } = await addressAPI.getAll();
      setAddresses(data.data || []);
      toast.success('Default address updated');
    } catch { toast.error('Failed to set default'); }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (user?.role === 'admin') {
    router.replace('/admin/settings');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-24 lg:pt-32 pb-24">
      {/* Premium Header Banner */}
      <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-b from-accent/5 via-background to-background pointer-events-none" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-accent to-accent-hover p-[2px] shadow-[0_0_30px_rgba(255,51,102,0.3)]">
              <div className="w-full h-full rounded-2xl bg-surface flex items-center justify-center text-3xl font-bold text-white">
                {name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{name}</h1>
              <p className="text-white/50 mt-1 flex items-center gap-2">
                <Mail className="w-4 h-4" /> {email}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Sidebar Menu */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3 space-y-2">
            <div className="p-2 rounded-2xl glass-strong border border-white/5 flex flex-col gap-1">
              {tabs.map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-300 ${activeTab === tab.id ? 'bg-white/10 text-white shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                >
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-accent' : ''}`} /> 
                  <div>
                    <div className="text-sm font-semibold">{tab.label}</div>
                  </div>
                </button>
              ))}
              
              <div className="h-px bg-white/5 my-2 mx-2" />
              
              <Link href="/orders" className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-white/50 hover:text-white hover:bg-white/5 transition-all">
                <ShoppingBag className="w-5 h-5" /> <span className="text-sm font-semibold">Order History</span>
              </Link>
              <Link href="/wishlist" className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-white/50 hover:text-white hover:bg-white/5 transition-all">
                <Heart className="w-5 h-5" /> <span className="text-sm font-semibold">Saved Items</span>
              </Link>
              
              <div className="h-px bg-white/5 my-2 mx-2" />
              
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-red-400/70 hover:text-red-400 hover:bg-red-400/10 transition-all group">
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" /> <span className="text-sm font-semibold">Sign Out</span>
              </button>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-9">
            
            <AnimatePresence mode="wait">
              {/* Personal Info Tab */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="p-6 sm:p-8 rounded-2xl border border-white/5 bg-surface shadow-2xl">
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-white">Personal Information</h2>
                      <p className="text-sm text-white/40 mt-1">Update your personal details and contact info.</p>
                    </div>
                    
                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
                          </div>
                        </div>
                        <div className="space-y-2 sm:col-span-2 max-w-md">
                          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" required className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-white/5 flex justify-end">
                        <button type="submit" disabled={saving} className="px-8 py-3.5 rounded-xl bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all disabled:opacity-50 flex items-center gap-2">
                          {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* Addresses Tab */}
              {activeTab === 'addresses' && (
                <motion.div key="addresses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                    <div>
                      <h2 className="text-xl font-bold text-white">Saved Addresses</h2>
                      <p className="text-sm text-white/40 mt-1">Manage where we deliver your orders.</p>
                    </div>
                    {!showAddAddress && (
                      <button onClick={() => setShowAddAddress(true)} className="px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent-hover transition-all flex items-center justify-center gap-2 glow-red-hover">
                        <Plus className="w-4 h-4" /> Add Address
                      </button>
                    )}
                  </div>

                  {showAddAddress && (
                    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={handleAddAddress} className="p-6 rounded-2xl border border-white/5 bg-surface shadow-2xl overflow-hidden">
                      <h3 className="text-lg font-bold text-white mb-6">New Delivery Address</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <input value={addrForm.name} onChange={(e) => setAddrForm({ ...addrForm, name: e.target.value })} required placeholder="Full Name" className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                          <input value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} required placeholder="Phone Number" className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                        </div>
                        <input value={addrForm.addressLine1} onChange={(e) => setAddrForm({ ...addrForm, addressLine1: e.target.value })} required placeholder="Street Address / Building" className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} required placeholder="City" className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                          <input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} required placeholder="State" className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                          <input value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })} required placeholder="PIN Code" className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50" />
                        </div>
                      </div>
                      <div className="mt-6 flex gap-3">
                        <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold flex-1 sm:flex-none">Save Address</button>
                        <button type="button" onClick={() => setShowAddAddress(false)} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-colors flex-1 sm:flex-none">Cancel</button>
                      </div>
                    </motion.form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {addresses.map((addr: any) => (
                      <div key={addr.id} className={`p-6 rounded-2xl border transition-all duration-300 relative group ${addr.isDefault ? 'border-accent bg-surface shadow-[0_4px_20px_rgba(255,51,102,0.1)]' : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'}`}>
                        {addr.isDefault && (
                          <div className="absolute top-4 right-4"><CheckCircle2 className="w-5 h-5 text-accent" /></div>
                        )}
                        <span className="inline-block px-3 py-1 rounded-md text-[10px] font-bold tracking-wider bg-white/10 text-white/70 uppercase mb-4">
                          {addr.type || 'Home'}
                        </span>
                        <h3 className="text-base font-bold text-white mb-1">{addr.name || addr.fullName}</h3>
                        <div className="text-sm text-white/50 space-y-0.5 mb-6">
                          <p>{addr.street || addr.addressLine1}</p>
                          <p>{addr.city}, {addr.state} • {addr.pincode || addr.zipCode}</p>
                          <p className="pt-2 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {addr.phone}</p>
                        </div>
                        
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          {!addr.isDefault ? (
                            <button onClick={() => setDefaultAddress(addr.id.toString())} className="text-xs font-semibold text-white/50 hover:text-white transition-colors">Set as Default</button>
                          ) : <span className="text-xs font-semibold text-accent">Default Address</span>}
                          
                          <div className="flex gap-2">
                            <button className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => deleteAddress(addr.id.toString())} className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {addresses.length === 0 && !showAddAddress && (
                    <div className="text-center py-16 px-4 rounded-2xl border border-white/5 border-dashed">
                      <MapPin className="w-12 h-12 text-white/10 mx-auto mb-4" />
                      <p className="text-white/50 mb-4">You haven&apos;t saved any addresses yet.</p>
                      <button onClick={() => setShowAddAddress(true)} className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all inline-flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add your first address
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <div className="p-6 sm:p-8 rounded-2xl border border-white/5 bg-surface shadow-2xl">
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-white">Password & Security</h2>
                      <p className="text-sm text-white/40 mt-1">Ensure your account uses a strong password.</p>
                    </div>
                    
                    <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required placeholder="••••••••" className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
                        </div>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/50">New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required placeholder="••••••••" className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/50">Confirm New Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                          <input type="password" value={confirmNewPass} onChange={(e) => setConfirmNewPass(e.target.value)} required placeholder="••••••••" className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-all outline-none" />
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <button type="submit" disabled={saving} className="px-8 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-bold transition-all glow-red-hover disabled:opacity-50 flex items-center gap-2">
                          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
                          {saving ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </motion.div>
        </div>
      </div>
    </div>
  );
}
