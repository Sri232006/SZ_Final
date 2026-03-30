'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, RefreshCcw, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-24 lg:pt-28 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="relative h-[40vh] min-h-[400px] w-full rounded-3xl overflow-hidden mb-16 lg:mb-24">
          <Image src="/images/hero4.jpg" alt="About SouthZone" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Born in the Streets.<br />Crafted for the Bold.
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/70 max-w-2xl text-lg">
              SouthZone isn&apos;t just a brand. It&apos;s a movement. Creating premium streetwear for the fearless youth since 2024.
            </motion.p>
          </div>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center mb-24">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-bold gradient-text mb-6">Our Story</h2>
            <div className="space-y-4 text-white/60 leading-relaxed">
              <p>
                What started as a small underground project has evolved into a leading voice in independent streetwear. 
                We observed a gap in the market: garments were either excessively expensive or woefully low-quality. 
                SouthZone was built to bridge that gap.
              </p>
              <p>
                We source the highest quality cotton blends, partner with ethical manufacturers, and obsess over every stitch. 
                Our designs are inspired by the raw energy of urban culture, cyber-aesthetics, and modern minimalism.
              </p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative aspect-square rounded-3xl overflow-hidden glass p-2">
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <Image src="/images/hero1.jpg" alt="SouthZone Fashion" fill className="object-cover" />
            </div>
          </motion.div>
        </div>

        {/* Values Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">Why SouthZone?</h2>
          <p className="text-white/50 max-w-2xl mx-auto">We don&apos;t compromise on quality, and neither should you.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, title: 'Premium Quality', desc: 'Heavyweight fabrics that last longer and drape perfectly.' },
            { icon: Sparkles, title: 'Exclusive Drops', desc: 'Limited edition collections that you won&apos;t see on everyone else.' },
            { icon: Truck, title: 'Fast Shipping', desc: 'Express delivery nationwide. Because waiting sucks.' },
            { icon: RefreshCcw, title: 'Easy Returns', desc: 'If it doesn&apos;t fit right, we&apos;ve got your back with hassle-free returns.' },
          ].map((val, i) => (
            <motion.div key={val.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-8 rounded-2xl glass-strong text-center hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 mx-auto bg-accent/10 rounded-xl flex items-center justify-center mb-6 text-accent">
                <val.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{val.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{val.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
