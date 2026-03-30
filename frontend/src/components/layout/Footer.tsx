import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-surface mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <Image 
                src="/images/southzone_logo_final.jpg" 
                alt="SouthZone" 
                width={140} 
                height={42} 
                className="h-8 w-auto rounded"
              />
            </Link>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              SouthZone delivers premium streetwear crafted for the bold. 
              Elevate your daily hustle with high-quality fits designed to stand out.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 glass rounded-full text-white/50 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 glass rounded-full text-white/50 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 glass rounded-full text-white/50 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-5 w-5" />
              </a>
            </div>
            {/* Added contact links back for good measure */}
            <div className="mt-6 flex flex-col gap-3 text-sm text-white/40">
              <a href="mailto:hello@southzone.in" className="flex items-center gap-2 hover:text-white/70 transition-colors">
                <Mail className="w-4 h-4" /> hello@southzone.in
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-2 hover:text-white/70 transition-colors">
                <Phone className="w-4 h-4" /> +91 98765 43210
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Chennai, India
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-6">Shop</h3>
            <ul className="space-y-4">
              <li><Link href="/shop?category=hoodies" className="text-sm text-white/50 hover:text-accent transition-colors">Hoodies</Link></li>
              <li><Link href="/shop?category=shirts" className="text-sm text-white/50 hover:text-accent transition-colors">Shirts</Link></li>
              <li><Link href="/shop?category=pants" className="text-sm text-white/50 hover:text-accent transition-colors">Pants</Link></li>
              <li><Link href="/shop?category=traditional" className="text-sm text-white/50 hover:text-accent transition-colors">Traditional</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-6">Support</h3>
            <ul className="space-y-4">
              <li><Link href="/track" className="text-sm text-white/50 hover:text-accent transition-colors">Track Order</Link></li>
              <li><Link href="/returns" className="text-sm text-white/50 hover:text-accent transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/faq" className="text-sm text-white/50 hover:text-accent transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="text-sm text-white/50 hover:text-accent transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link href="/about" className="text-sm text-white/50 hover:text-accent transition-colors">About Us</Link></li>
              <li><Link href="/terms" className="text-sm text-white/50 hover:text-accent transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="text-sm text-white/50 hover:text-accent transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40">
            &copy; {new Date().getFullYear()} SouthZone. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Designed for the Streets</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            <span>Always Bold</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
