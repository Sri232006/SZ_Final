'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, X, Star, ChevronDown } from 'lucide-react';
import { productAPI, configAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

const sortOptions = ['Newest', 'Price: Low to High', 'Price: High to Low', 'Rating'];

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes] = await Promise.allSettled([
          productAPI.getAll(),
          configAPI.getCategories(),
        ]);
        if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data?.data?.products || []);
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data?.data || []);
      } catch { /* fallback */ }
      setLoading(false);
    }
    fetchData();
  }, []);

  const filtered = products
    .filter((p) => activeCategory === 'All' || p.categoryId?.toString() === activeCategory)
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const priceA = a.discountPrice || a.salePrice || a.price;
      const priceB = b.discountPrice || b.salePrice || b.price;
      if (sortBy === 'Price: Low to High') return priceA - priceB;
      if (sortBy === 'Price: High to Low') return priceB - priceA;
      if (sortBy === 'Rating') return (b.avgRating || 0) - (a.avgRating || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen pt-24 lg:pt-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text">Shop</h1>
          <p className="mt-2 text-white/40">Discover your next favorite piece</p>
        </motion.div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products..."
              className="w-full rounded-xl bg-white/5 border border-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50 transition-colors" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"><X className="w-4 h-4" /></button>}
          </div>
          <div className="relative">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none w-full sm:w-48 rounded-xl bg-white/5 border border-white/10 py-3 px-4 pr-10 text-sm text-white/70 outline-none focus:border-accent/50 transition-colors cursor-pointer">
              {sortOptions.map((opt) => <option key={opt} value={opt} className="bg-surface text-white">{opt}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          </div>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setActiveCategory('All')}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === 'All' ? 'bg-accent text-white glow-red' : 'glass text-white/50 hover:text-white hover:bg-white/5'}`}>
            All
          </button>
          {categories.map((cat: any) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id.toString())}
              className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.id.toString() ? 'bg-accent text-white glow-red' : 'glass text-white/50 hover:text-white hover:bg-white/5'}`}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <p className="text-sm text-white/30 mb-6">{filtered.length} products</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filtered.map((product, i) => {
                const img = product.images?.find((im: any) => im.isPrimary) || product.images?.[0];
                const imgSrc = img?.url || img?.imageUrl || '/images/hero2.jpg';
                const dp = product.discountPrice || product.salePrice;
                return (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                    <Link href={`/shop/${product.id}`} className="group block rounded-2xl overflow-hidden glass glass-hover">
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <Image src={imgSrc} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                        {dp && <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-white">Sale</span>}
                      </div>
                      <div className="p-3 sm:p-4">
                        <h3 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors line-clamp-1">{product.name}</h3>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-sm font-bold text-white">₹{(dp || product.price)?.toLocaleString()}</span>
                          {dp && <span className="text-xs text-white/30 line-through">₹{product.price?.toLocaleString()}</span>}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} className={`w-2.5 h-2.5 ${j < Math.floor(product.avgRating || 4) ? 'fill-accent text-accent' : 'text-white/10'}`} />
                          ))}
                          <span className="ml-1 text-[10px] text-white/30">{product.avgRating || '4.0'}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <p className="text-white/30 text-lg">No products found</p>
                <button onClick={() => { setSearchQuery(''); setActiveCategory('All'); }} className="mt-4 text-accent text-sm hover:underline">Clear filters</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
