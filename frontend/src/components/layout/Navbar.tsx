'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ShoppingBag, Heart, User, Menu, X, ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { productAPI } from '@/lib/api';
import CartDrawer from './CartDrawer';

const navLinks = [
  { href: '/', label: 'Home' },
  {
    href: '/shop', label: 'Shop', children: [
      { href: '/shop?category=hoodies', label: 'Hoodies' },
      { href: '/shop?category=shirts', label: 'Shirts' },
      { href: '/shop?category=pants', label: 'Pants' },
      { href: '/shop?category=traditional', label: 'Traditional' },
    ],
  },
  { href: '/shop?new=true', label: 'New Arrivals' },
  { href: '/shop?sale=true', label: 'Sale' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user } = useAuthStore();
  
  const currentNavLinks = user?.role === 'admin' ? [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/products', label: 'Products' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/settings', label: 'Settings' }
  ] : navLinks;
  
  const cartItems = useCartStore((s) => s.items);
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await productAPI.search(searchQuery.trim());
        setSearchResults(data.data || []);
      } catch (error) {
        console.error('Search error', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 bg-background transition-all duration-500 ${
          scrolled ? 'shadow-lg shadow-black/20 border-b border-white/5' : ''
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between lg:h-20">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image
                src="/images/LOGO.png"
                alt="SouthZone"
                width={140}
                height={42}
                className="h-8 w-auto lg:h-10 rounded"
                priority
              />
            </Link>

            {/* Desktop Nav - Times New Roman font */}
            <nav className="hidden lg:flex items-center gap-1">
              {currentNavLinks.map((link) => (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => (link as any).children && setDropdownOpen(link.label)}
                  onMouseLeave={() => setDropdownOpen(null)}
                >
                  <Link
                    href={link.href}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
                  >
                    {link.label}
                    {(link as any).children && <ChevronDown className="w-3.5 h-3.5" />}
                  </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {(link as any).children && dropdownOpen === link.label && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-1 w-48 rounded-xl glass-strong p-2"
                      >
                        {(link as any).children.map((child: any) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 sm:p-2.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              <Link
                href="/wishlist"
                className="hidden sm:flex p-2.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5"
              >
                <Heart className="w-5 h-5" />
              </Link>

              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 sm:p-2.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5 cursor-pointer blur-0"
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {totalItemsCount > 0 && (
                    <motion.span
                      key={totalItemsCount}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-accent text-[10px] font-bold text-white flex items-center justify-center glow-red"
                    >
                      {totalItemsCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {user ? (
                <div className="relative">
                  <button onClick={() => setProfileOpen(!profileOpen)} className="p-2 sm:p-2.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5 flex items-center justify-center relative z-[60]">
                    <User className="w-5 h-5" />
                  </button>
                  <AnimatePresence>
                    {profileOpen && (
                      <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setProfileOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="absolute top-full right-0 mt-2 w-48 rounded-xl bg-surface border border-white/10 shadow-2xl p-2 z-[60] origin-top-right">
                          <div className="px-4 py-2 border-b border-white/5 mb-2">
                            <p className="text-xs text-white/40" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>Signed in as</p>
                            <p className="text-sm font-semibold text-white truncate" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>{user.name || user.email}</p>
                          </div>
                          {user.role === 'admin' ? (
                            <>
                              <Link href="/admin" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-accent hover:bg-white/5 rounded-lg transition-colors" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                                Admin Dashboard
                              </Link>
                              <Link href="/admin/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                                Account Settings
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link href="/profile" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                                My Profile
                              </Link>
                              <Link href="/orders" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                                My Orders
                              </Link>
                            </>
                          )}
                          <button onClick={() => { setProfileOpen(false); useAuthStore.getState().logout(); }} className="w-full mt-2 text-left px-4 py-2.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors font-medium" style={{ fontFamily: "'Times New Roman', Georgia, serif" }}>
                            Sign Out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/auth/login"
                  className="p-2 sm:p-2.5 text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-white/5 bg-background shadow-2xl"
            >
              <div className="mx-auto max-w-2xl px-4 py-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for hoodies, shirts, pants..."
                    autoFocus
                    className="w-full rounded-full bg-white/5 border border-white/10 py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                    style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
                  />
                  <button onClick={() => setSearchOpen(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Search Results */}
                {searchQuery.trim().length >= 2 && (
                  <div className="mt-4 border-t border-white/10 pt-4 flex flex-col gap-2 max-h-96 overflow-y-auto scrollbar-hide">
                    {isSearching ? (
                      <div className="text-white/50 text-sm text-center py-4">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((product) => {
                        const img = product.images?.find((im: any) => im.isPrimary) || product.images?.[0];
                        const imgSrc = img?.url || img?.imageUrl || '/images/hoodie.jpg';
                        const price = product.discountPrice || product.salePrice || product.price || 0;
                        return (
                          <Link 
                            key={product.id} 
                            href={`/shop/${product.id}`} 
                            onClick={() => setSearchOpen(false)} 
                            className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors"
                          >
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
                              <Image src={imgSrc} alt={product.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white line-clamp-1">{product.name}</p>
                              <p className="text-xs text-accent font-bold mt-1">₹{Number(price).toLocaleString()}</p>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <div className="text-white/50 text-sm text-center py-4">No products found</div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 z-50 h-full w-80 bg-surface border-r border-white/5 p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <Image
                  src="/images/southzone_logo_final.jpg"
                  alt="SouthZone"
                  width={120}
                  height={36}
                  className="h-8 w-auto rounded"
                />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1 flex-1 overflow-y-auto">
                {currentNavLinks.map((link) => (
                  <div key={link.label}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-base font-medium text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                      style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
                    >
                      {link.label}
                    </Link>
                    {(link as any).children && (
                      <div className="pl-6 border-l border-white/10 ml-6 pb-2">
                        {(link as any).children.map((child: any) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className="block px-4 py-2.5 text-sm text-white/50 hover:text-white transition-colors"
                            style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="pt-6 border-t border-white/5 flex flex-col gap-2 shrink-0">
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                  style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
                >
                  <Heart className="w-5 h-5" /> Wishlist
                </Link>
                <Link
                  href={user ? (user.role === 'admin' ? '/admin' : '/profile') : '/auth/login'}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                  style={{ fontFamily: "'Times New Roman', Georgia, serif" }}
                >
                  <User className="w-5 h-5" /> {user ? 'Profile' : 'Login'}
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}