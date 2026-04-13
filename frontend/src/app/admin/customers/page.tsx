'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Shield, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminCustomers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await adminAPI.getUsers();
        const payload = data.data;
        setUsers(payload?.users || (Array.isArray(payload) ? payload : []));
      } catch { 
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, []);

  const handlePromote = async (id: string) => {
    if (!confirm('Promote this user to admin?')) return;
    try {
      await adminAPI.promoteUser(id);
      setUsers(users.map((u) => u.id.toString() === id ? { ...u, role: 'admin' } : u));
      toast.success('User promoted to admin');
    } catch { toast.error('Failed to promote'); }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await adminAPI.deactivateUser(id);
      setUsers(users.map((u) => u.id.toString() === id ? { ...u, isActive: false } : u));
      toast.success('User deactivated');
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-8">Customers</h1>
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..."
          className="w-full sm:w-80 rounded-xl bg-white/5 border border-white/10 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50 transition-colors" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl glass-strong overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-white/30 border-b border-white/5">
              <th className="text-left p-4 font-medium">Customer</th>
              <th className="text-left p-4 font-medium hidden md:table-cell">Email</th>
              <th className="text-left p-4 font-medium hidden sm:table-cell">Role</th>
              <th className="text-left p-4 font-medium hidden lg:table-cell">Joined</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent text-xs font-bold shrink-0">{user.name?.charAt(0)?.toUpperCase() || '?'}</div>
                      <div><p className="text-white/80">{user.name}</p>{user.isActive === false && <span className="text-[14px] font-medium text-red-400">Deactivated</span>}</div>
                    </div>
                  </td>
                  <td className="p-4 text-white/40 hidden md:table-cell">{user.email}</td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className={`px-3 py-1.5 rounded-full text-[14px] font-bold capitalize ${user.role === 'admin' ? 'bg-accent/10 text-accent' : 'bg-white/5 text-white/40'}`}>{user.role}</span>
                  </td>
                  <td className="p-4 text-white/30 hidden lg:table-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.role !== 'admin' && <button onClick={() => handlePromote(user.id.toString())} className="p-2 rounded-lg glass text-white/30 hover:text-accent transition-colors" title="Promote"><Shield className="w-3.5 h-3.5" /></button>}
                      {user.isActive !== false && <button onClick={() => handleDeactivate(user.id.toString())} className="p-2 rounded-lg glass text-white/30 hover:text-red-400 transition-colors" title="Deactivate"><UserX className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-8 text-center text-white/20"><Users className="w-8 h-8 mx-auto mb-2" /><p>No customers found</p></div>}
        </div>
      )}
    </div>
  );
}
