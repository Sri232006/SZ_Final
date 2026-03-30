'use client';

import { useState, useEffect } from 'react';
import { X, Upload, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    color: '',
    size: 'M',
    material: '',
    stock: '',
    discount: '0',
    categoryId: ''
  });
  
  const [images, setImages] = useState<File[]>([]);

  useEffect(() => {
    if (isOpen) {
      adminAPI.getCategories().then((res) => setCategories(res.data?.data || [])).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const form = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        form.append(key, val as string);
      });
      images.forEach((img) => form.append('images', img));

      await adminAPI.createProduct(form as any);
      toast.success('Product created successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-surface border border-white/10 rounded-2xl shadow-2xl z-10">
        <div className="sticky top-0 bg-surface/80 backdrop-blur-xl border-b border-white/5 p-6 flex items-center justify-between z-20">
          <h2 className="text-xl font-bold text-white">Add New Product</h2>
          <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-white/50">Product Name</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-white/50">Brand</label>
              <input value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} required className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 outline-none" />
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-white/50">Description</label>
              <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows={3} className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 outline-none resize-none" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-white/50">Category</label>
              <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} required className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 outline-none [&>option]:bg-background">
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-white/50">Price (₹)</label>
              <input type="number" min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} required className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-white/50">Stock Quantity</label>
              <input type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} required className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-white/50">Discount (%)</label>
              <input type="number" min="0" max="100" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-white/50">Color (Comma separated eg: Red, Blue)</label>
              <input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} required className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 outline-none" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase text-white/50">Size</label>
              <select value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} required className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 outline-none [&>option]:bg-background">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2 sm:col-span-2">
              <label className="text-xs font-semibold uppercase text-white/50">Material (Optional)</label>
              <input value={formData.material} onChange={(e) => setFormData({ ...formData, material: e.target.value })} className="w-full py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:border-accent/50 outline-none" />
            </div>

            <div className="space-y-4 sm:col-span-2 p-6 rounded-xl border border-white/10 bg-white/5 border-dashed text-center">
              <Upload className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-sm text-white/60 mb-4">Upload Product Images (Max 5)</p>
              <input type="file" multiple accept="image/*" onChange={handleImageChange} className="text-sm text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 transition-all cursor-pointer" />
              {images.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-emerald-400 mb-3">{images.length} files selected</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {images.map((file, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent hover:bg-accent-hover text-white font-bold transition-all glow-red-hover disabled:opacity-50">
              {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {saving ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
