'use client';

import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, Truck, ShieldCheck, RefreshCcw, CreditCard,
  ChevronRight, ChevronLeft as ChevronLeftIcon, Star, Sparkles,
} from 'lucide-react';
import { configAPI, productAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Icon map for perks section (stored as strings in config)
const iconMap: Record<string, React.ElementType> = { Truck, ShieldCheck, RefreshCcw, CreditCard };

// Default hero slides using all hero images
const defaultSlides = [
  { image: '/images/hero1.jpg', title: 'REDEFINE\nFASHION', subtitle: 'New Collection 2026', cta: 'SHOP NOW', ctaLink: '/shop' },
  { image: '/images/hero2.jpg', title: 'BOLD.\nFEARLESS.\nYOU.', subtitle: 'Streetwear Essentials', cta: 'SHOP NOW', ctaLink: '/shop' },
  { image: '/images/hero3.jpg', title: 'ELEVATE\nYOUR STYLE', subtitle: 'Premium Quality', cta: 'SHOP NOW', ctaLink: '/shop' },
  { image: '/images/hero4.jpg', title: 'STREET\nCULTURE', subtitle: 'Urban Collection', cta: 'SHOP NOW', ctaLink: '/shop' },
  { image: '/images/hero5.jpg', title: 'DEFINE\nYOURSELF', subtitle: 'Exclusive Drops', cta: 'SHOP NOW', ctaLink: '/shop' },
  { image: '/images/hero6.jpg', title: 'THE NEW\nWAVE', subtitle: 'Limited Edition', cta: 'SHOP NOW', ctaLink: '/shop' },
];

/* ─── Hero Carousel ────────────────────────────────────── */
function HeroSection({ config }: { config: any }) {
  const slides = config?.slides?.length > 0 ? config.slides : defaultSlides;
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback((index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }, [current]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-play every 5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(goNext, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [goNext]);

  // Pause on hover
  const pauseAutoPlay = () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  const resumeAutoPlay = () => { intervalRef.current = setInterval(goNext, 5000); };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <section className="relative h-screen overflow-hidden bg-black flex items-center justify-center p-4 sm:p-8" onMouseEnter={pauseAutoPlay} onMouseLeave={resumeAutoPlay}>
      {/* Background blurred slides */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={current}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={slides[current].image}
            alt="background blur"
            fill
            className="object-cover object-center blur-2xl opacity-40 scale-110"
            priority={current === 0}
            quality={10}
          />
          <div className="absolute inset-0 bg-black/60" />
        </motion.div>
      </AnimatePresence>

      {/* Content overlay — exact match to reference */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-w-4xl pt-12 lg:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center w-full"
          >
            {/* Centered Image Card */}
            <div className="relative w-64 h-[24rem] sm:w-[22rem] sm:h-[30rem] lg:w-[24rem] lg:h-[34rem] mb-8 overflow-hidden shadow-2xl">
              <Image
                src={slides[current].image}
                alt={slides[current].title}
                fill
                className="object-cover object-center"
                priority={current === 0}
                quality={90}
              />
            </div>
            
            {/* Title below image in reference style (serif, tracking wide) */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-medium tracking-[0.2em] sm:tracking-[0.3em] whitespace-pre-line uppercase text-white mb-6 text-center">
              {slides[current].title.replace(/\n/g, ' ')}
            </h1>
            
            {/* CTA Button */}
            <Link
              href={slides[current].ctaLink || '/shop'}
              className="mt-2 bg-white text-black px-10 py-3 text-xs sm:text-sm font-bold tracking-[0.1em] sm:tracking-[0.2em] uppercase hover:bg-gray-200 transition-colors"
            >
              {slides[current].cta}
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Dot indicators */}
        <div className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {slides.map((_: any, i: number) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`transition-all duration-300 rounded-full ${
                i === current
                  ? 'w-2 h-2 bg-white scale-110'
                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Arrow navigation (kept minimal for functionality, can be hidden if strictly following ref) */}
      <button
        onClick={goPrev}
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full text-white/30 hover:text-white transition-colors"
        aria-label="Previous slide"
      >
        <ChevronLeftIcon className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>
      <button
        onClick={goNext}
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full text-white/30 hover:text-white transition-colors"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
      </button>
    </section>
  );
}

/* ─── Categories ───────────────────────────────────────── */
function CategoriesSection({ sectionConfig, categories }: { sectionConfig: any; categories: any[] }) {
  const cats = categories.length > 0 ? categories : [
    { id: '1', name: 'Hoodies', image: '/images/hoodie.jpg', slug: 'hoodies' },
    { id: '2', name: 'Shirts', image: '/images/shirt.jpg', slug: 'shirts' },
    { id: '3', name: 'Pants', image: '/images/pants.jpg', slug: 'pants' },
    { id: '4', name: 'Traditional', image: '/images/dhoti.jpg', slug: 'traditional' },
  ];
  const gradients = ['from-red-500/20', 'from-orange-500/20', 'from-blue-500/20', 'from-yellow-500/20'];

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="text-center mb-16">
        <span className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">Browse</span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold gradient-text">{sectionConfig?.title || 'Shop by Category'}</h2>
        <p className="mt-3 text-white/40 max-w-md mx-auto">{sectionConfig?.subtitle || 'Explore our curated collections crafted for the modern youth'}</p>
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cats.slice(0, 4).map((cat: any, i: number) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
            <Link href={`/shop?category=${cat.id}`} className="group block relative aspect-[3/4] rounded-2xl overflow-hidden glass glass-hover">
              <Image src={cat.image || `/images/hoodie.jpg`} alt={cat.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className={`absolute inset-0 bg-gradient-to-t ${gradients[i % gradients.length]} via-transparent to-black/60 group-hover:to-black/70 transition-all duration-500`} />
              <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white">{cat.name}</h3>
                <span className="mt-1 flex items-center gap-1 text-xs text-white/60 group-hover:text-accent transition-colors">Shop Now <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /></span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Featured Products ────────────────────────────────── */
function FeaturedSection({ sectionConfig, products }: { sectionConfig: any; products: any[] }) {
  return (
    <section className="relative py-24 bg-surface">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      <div className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="flex items-end justify-between mb-12">
          <div>
            <span className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">Curated</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold gradient-text">{sectionConfig?.title || 'Featured Drops'}</h2>
          </div>
          <Link href="/shop" className="hidden sm:flex items-center gap-1 text-sm text-white/50 hover:text-accent transition-colors">View All <ArrowRight className="w-4 h-4" /></Link>
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {products.slice(0, sectionConfig?.config?.limit || 6).map((product: any, i: number) => {
            const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
            const imgSrc = primaryImage?.url || primaryImage?.imageUrl || '/images/hero2.jpg';
            const discountPrice = product.discountPrice || product.salePrice;
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}>
                <Link href={`/shop/${product.id}`} className="group block rounded-2xl overflow-hidden glass glass-hover transition-all duration-300">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image src={imgSrc} alt={product.name} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    {product.isFeatured && <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white backdrop-blur-sm">Featured</span>}
                    {discountPrice && <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-white glow-red">Sale</span>}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold">Quick View</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-white/80 group-hover:text-white transition-colors line-clamp-1">{product.name}</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-bold text-white">₹{(discountPrice || product.price)?.toLocaleString()}</span>
                      {discountPrice && <span className="text-xs text-white/30 line-through">₹{product.price?.toLocaleString()}</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={`w-3 h-3 ${j < Math.floor(product.avgRating || 4) ? 'fill-accent text-accent' : 'text-white/10'}`} />
                      ))}
                      <span className="ml-1 text-[10px] text-white/30">{product.avgRating || '4.0'}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link href="/shop" className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-accent transition-colors">View All Products <ArrowRight className="w-4 h-4" /></Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Offer Banners ────────────────────────────────────── */
function OffersSection({ sectionConfig }: { sectionConfig: any }) {
  const banners = sectionConfig?.config?.banners || [
    { image: '/images/pongal-offer.jpg', title: 'Pongal Special', subtitle: 'Up to 40% off on traditional wear', link: '/shop?sale=true' },
    { image: '/images/summer-offer.jpg', title: 'Summer Sale', subtitle: 'Fresh styles at unbeatable prices', link: '/shop?sale=true' },
  ];
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="text-center mb-12">
        <span className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">Limited Time</span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold gradient-text">{sectionConfig?.title || 'Special Offers'}</h2>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((offer: any, i: number) => (
          <motion.div key={offer.title} initial={{ opacity: 0, x: i === 0 ? -30 : 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.15 }}>
            <Link href={offer.link || '/shop'} className="group block relative rounded-2xl overflow-hidden h-64 sm:h-80 glass glass-hover">
              <Image src={offer.image} alt={offer.title} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
              <div className="relative z-10 flex flex-col justify-center h-full p-6 sm:p-10">
                <h3 className="text-2xl sm:text-3xl font-bold text-white">{offer.title}</h3>
                <p className="mt-2 text-sm text-white/60">{offer.subtitle}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-accent font-semibold group-hover:gap-2 transition-all">Shop Now <ArrowRight className="w-4 h-4" /></span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Lookbook ─────────────────────────────────────────── */
function LookbookSection({ sectionConfig }: { sectionConfig: any }) {
  const images = sectionConfig?.config?.images || ['/images/hero4.jpg', '/images/hero5.jpg', '/images/hero6.jpg'];
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-100px' }} transition={{ duration: 0.6 }} className="text-center mb-16">
        <span className="text-accent text-xs font-semibold tracking-[0.2em] uppercase">Lookbook</span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-bold gradient-text">{sectionConfig?.title || 'Style Inspiration'}</h2>
        <p className="mt-3 text-white/40 max-w-md mx-auto">{sectionConfig?.subtitle || 'Get inspired by our latest campaign looks'}</p>
      </motion.div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {images.map((img: string, i: number) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: i * 0.1 }} className="relative rounded-2xl overflow-hidden group aspect-[4/5] sm:aspect-[3/4]">
            <Image src={img} alt={`Lookbook ${i + 1}`} fill className="object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-500 flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-6 py-2 rounded-full glass text-sm text-white font-medium">View Look</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Perks ────────────────────────────────────────────── */
function PerksSection({ sectionConfig }: { sectionConfig: any }) {
  const perks = sectionConfig?.config?.items || [
    { icon: 'Truck', label: 'Free Shipping', desc: 'On orders above ₹999' },
    { icon: 'ShieldCheck', label: 'Secure Payment', desc: '100% secure checkout' },
    { icon: 'RefreshCcw', label: 'Easy Returns', desc: '7-day return policy' },
    { icon: 'CreditCard', label: 'COD Available', desc: 'Cash on delivery' },
  ];
  return (
    <section className="py-20 bg-surface border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {perks.map((perk: any, i: number) => {
            const Icon = iconMap[perk.icon] || Truck;
            return (
              <motion.div key={perk.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }} className="text-center p-6 rounded-2xl glass glass-hover group">
                <div className="w-12 h-12 mx-auto rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors group-hover:glow-red">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">{perk.label}</h3>
                <p className="mt-1 text-xs text-white/40">{perk.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Section Renderer ─────────────────────────────────── */
const sectionComponents: Record<string, React.ComponentType<any>> = {
  hero: HeroSection,
  categories: CategoriesSection,
  featured: FeaturedSection,
  offers: OffersSection,
  lookbook: LookbookSection,
  perks: PerksSection,
};

/* ─── Page ─────────────────────────────────────────────── */
export default function Home() {
  const [sections, setSections] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [configRes, productsRes, categoriesRes] = await Promise.allSettled([
          configAPI.getLanding(),
          productAPI.getFeatured(),
          configAPI.getCategories(),
        ]);
        if (configRes.status === 'fulfilled') {
          const raw = configRes.value.data?.data?.sections;
          setSections(Array.isArray(raw) ? raw : []);
        }
        if (productsRes.status === 'fulfilled') {
          setProducts(productsRes.value.data?.data || []);
        }
        if (categoriesRes.status === 'fulfilled') {
          setCategories(categoriesRes.value.data?.data || []);
        }
      } catch { /* ignore — fallback defaults will render */ }
      setLoaded(true);
    }
    fetchData();
  }, []);

  // Sort visible sections by order
  const visibleSections = useMemo(() => {
    if (sections.length === 0) {
      // Default order if no config
      return [
        { key: 'hero', order: 1, visible: true, config: {} },
        { key: 'categories', order: 2, visible: true },
        { key: 'featured', order: 3, visible: true },
        { key: 'offers', order: 4, visible: true },
        { key: 'lookbook', order: 5, visible: true },
        { key: 'perks', order: 6, visible: true },
      ];
    }
    return [...sections].filter((s) => s.visible).sort((a, b) => a.order - b.order);
  }, [sections]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {visibleSections.map((section) => {
        const Component = sectionComponents[section.key];
        if (!Component) return null;

        const props: any = { sectionConfig: section };
        if (section.key === 'hero') props.config = section.config;
        if (section.key === 'categories') props.categories = categories;
        if (section.key === 'featured') props.products = products;

        return <Component key={section.key} {...props} />;
      })}
    </>
  );
}
