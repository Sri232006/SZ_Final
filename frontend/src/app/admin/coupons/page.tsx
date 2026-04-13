'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, PlusCircle, Trash2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discountType: 'percentage', discountValue: '', minPurchase: '', maxDiscount: '', usageLimit: '', expiryDate: '' });

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function fetchCoupons() {
    try {
      const { data } = await adminAPI.getCoupons();
      const payload = data.data;
      setCoupons(payload?.coupons || (Array.isArray(payload) ? payload : []));
    } catch { 
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.createCoupon({
        ...form,
        discountValue: parseFloat(form.discountValue),
        minPurchase: form.minPurchase ? parseFloat(form.minPurchase) : undefined,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
      });
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({ code: '', discountType: 'percentage', discountValue: '', minPurchase: '', maxDiscount: '', usageLimit: '', expiryDate: '' });
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await adminAPI.deleteCoupon(id);
      setCoupons(coupons.filter((c) => c.id.toString() !== id));
      toast.success('Coupon deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Coupons</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-all glow-red-hover">
          <PlusCircle className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {showForm && (
        <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleCreate} className="p-6 rounded-2xl glass-strong mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required placeholder="Code (e.g. SUMMER20)" className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50 uppercase" />
          <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 outline-none cursor-pointer">
            <option value="percentage" className="bg-surface text-white">Percentage (%)</option>
            <option value="fixed" className="bg-surface text-white">Fixed (₹)</option>
          </select>
          <input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} required placeholder="Discount Value" className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50" />
          <input type="number" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })} placeholder="Min Purchase (₹)" className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50" />
          <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="Max Discount (₹)" className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 outline-none focus:border-accent/50" />
          <input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 outline-none focus:border-accent/50" />
          <div className="sm:col-span-2 lg:col-span-3 flex gap-2">
            <button type="submit" className="px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg glass text-sm text-white/60">Cancel</button>
          </div>
        </motion.form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl glass-strong overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-white/30 border-b border-white/5">
              <th className="text-left p-4 font-medium">Code</th>
              <th className="text-left p-4 font-medium hidden sm:table-cell">Discount</th>
              <th className="text-left p-4 font-medium hidden md:table-cell">Min Purchase</th>
              <th className="text-left p-4 font-medium hidden lg:table-cell">Expiry</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {coupons.map((coupon) => {
                const expired = coupon.expiryDate && new Date(coupon.expiryDate) < new Date();
                return (
                  <tr key={coupon.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-white font-mono text-xs font-bold">{coupon.code}</td>
                    <td className="p-4 text-white/60 hidden sm:table-cell">{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</td>
                    <td className="p-4 text-white/40 hidden md:table-cell">{coupon.minPurchase ? `₹${coupon.minPurchase}` : '—'}</td>
                    <td className="p-4 text-white/40 hidden lg:table-cell">{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : '—'}</td>
                    <td className="p-4"><span className={`px-3 py-1.5 rounded-full text-[14px] font-bold capitalize ${expired ? 'bg-red-500/10 text-red-400' : coupon.isActive !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{expired ? 'Expired' : coupon.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDelete(coupon.id.toString())} className="p-2 rounded-lg glass text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {coupons.length === 0 && <div className="p-8 text-center text-white/20"><Ticket className="w-8 h-8 mx-auto mb-2" /><p>No coupons yet</p></div>}
        </div>
      )}
    </div>
  );
}
