'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, Package } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { productAPI, adminAPI } from '@/lib/api';
import AddProductModal from './AddProductModal';

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data } = await productAPI.getAll();
      setProducts(data.data?.products || []);
    } catch { /* ignore */ }
    setLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await adminAPI.deleteProduct(id);
      setProducts(products.filter((p) => p.id.toString() !== id));
      toast.success('Product deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Products</h1>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-all glow-red-hover">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
          className="w-full sm:w-80 rounded-xl bg-white/5 border border-white/10 py-2.5 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50 transition-colors" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="rounded-2xl glass-strong overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-white/30 border-b border-white/5">
              <th className="text-left p-4 font-medium">Product</th>
              <th className="text-left p-4 font-medium hidden md:table-cell">Category</th>
              <th className="text-left p-4 font-medium">Price</th>
              <th className="text-left p-4 font-medium hidden sm:table-cell">Stock</th>
              <th className="text-left p-4 font-medium hidden lg:table-cell">Status</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((product) => {
                const img = product.images?.find((im: any) => im.isPrimary) || product.images?.[0];
                const imgSrc = img?.url || img?.imageUrl || '/images/hero2.jpg';
                return (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0"><Image src={imgSrc} alt="" fill className="object-cover" /></div>
                        <span className="text-white/80 truncate max-w-[200px]">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-white/40 hidden md:table-cell">{product.Category?.name || '—'}</td>
                    <td className="p-4 text-white">₹{product.price?.toLocaleString()}</td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className={`text-sm ${product.stock > 10 ? 'text-emerald-400' : product.stock > 0 ? 'text-yellow-400' : 'text-red-400'}`}>{product.stock}</span>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${product.isActive !== false ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {product.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 rounded-lg glass text-white/30 hover:text-white transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(product.id.toString())} className="p-2 rounded-lg glass text-white/30 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-8 text-center text-white/20"><Package className="w-8 h-8 mx-auto mb-2" /><p>No products found</p></div>}
        </div>
      )}

      <AddProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchProducts} 
      />
    </div>
  );
}
