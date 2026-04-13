'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, ChevronLeft, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/settings', label: 'Account Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      router.push('/auth/login');
    }
  }, [token, user, router]);

  if (!token || user?.role !== 'admin') return null;

  return (
    <div className="min-h-screen flex pt-20">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-white/5 p-4 hidden lg:block">
        <div className="sticky top-24">
          <Link href="/" className="flex items-center gap-2 text-xs text-white/30 hover:text-white/60 mb-6 transition-colors">
            <ChevronLeft className="w-3 h-3" /> Back to Store
          </Link>
          <h2 className="text-lg font-bold text-white mb-6">Admin Panel</h2>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'bg-accent/10 text-accent' : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                  <item.icon className="w-4 h-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 ${active ? 'text-accent' : 'text-white/30'}`}>
                <item.icon className="w-4 h-4" />
                <span className="text-[9px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-8 pb-24 lg:pb-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
