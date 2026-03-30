'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Message sent successfully! We will get back to you soon.');
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen pt-24 lg:pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">Get in Touch</h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg hover:text-white transition-colors">
            Have a question about your order, sizing, or our upcoming drops? We&apos;re here to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          {/* Contact Form */}
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <form onSubmit={handleSubmit} className="p-8 rounded-3xl glass-strong space-y-6">
              <div>
                <label className="text-sm font-medium text-white/50 mb-2 block">Name</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/50 mb-2 block">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/50 mb-2 block">Message</label>
                <textarea rows={5} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all resize-none" />
              </div>
              <button type="submit" className="w-full py-4 rounded-xl bg-accent hover:bg-accent-hover text-white font-semibold transition-all glow-red-hover flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Send Message
              </button>
            </form>
          </motion.div>

          {/* Contact Info */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-8 lg:mt-8">
            <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>
            {[
              { icon: Mail, title: 'Email', value: 'support@southzone.com', desc: 'Expect a reply within 24 hours.' },
              { icon: Phone, title: 'Phone', value: '+91 98765 43210', desc: 'Mon - Fri, 9am - 6pm IST' },
              { icon: MapPin, title: 'HQ Studio', value: '123 Fashion District', desc: 'Bengaluru, India 560001' },
            ].map((info) => (
              <div key={info.title} className="flex gap-4 p-6 rounded-2xl glass hover:bg-white/5 transition-colors">
                <div className="w-12 h-12 shrink-0 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                  <info.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-wide">{info.title}</h3>
                  <p className="text-white/80 font-medium my-1">{info.value}</p>
                  <p className="text-sm text-white/40 leading-relaxed">{info.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
