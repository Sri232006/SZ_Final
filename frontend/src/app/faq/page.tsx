'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    category: 'Shipping & Delivery',
    items: [
      { q: 'How long does shipping take?', a: 'Standard shipping takes 3-5 business days. Express shipping is available for 1-2 business days delivery within major cities.' },
      { q: 'Do you ship internationally?', a: 'Currently, SouthZone only ships within India. We plan to expand globally by late 2026.' },
      { q: 'How can I track my order?', a: 'Once your order is dispatched, you will receive an email with a tracking ID. You can also track it directly on our Track Order page.' },
    ]
  },
  {
    category: 'Returns & Exchanges',
    items: [
      { q: 'What is your return policy?', a: 'We offer a 7-day hassle-free return policy. Items must be unworn, unwashed, and have original tags attached.' },
      { q: 'How do I start an exchange?', a: 'You can initiate an exchange from your Orders dashboard in your Profile. We will pick up the item and send the new one simultaneously.' },
    ]
  },
  {
    category: 'Products & Sizing',
    items: [
      { q: 'Are your clothes true to size?', a: 'Our garments generally feature an oversized/relaxed fit consistent with streetwear aesthetics. We recommend taking your normal size for a relaxed look, or sizing down for a fitted look.' },
      { q: 'How should I wash SouthZone hoodies?', a: 'Machine wash cold inside out with similar colors. Tumble dry on low or hang dry to preserve the premium fabric and prints.' },
    ]
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>('0-0');

  return (
    <div className="min-h-screen pt-24 lg:pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold gradient-text mb-6">Frequently Asked Questions</h1>
          <p className="text-white/60 text-lg">Everything you need to know about shopping with SouthZone.</p>
        </motion.div>

        <div className="space-y-12">
          {faqs.map((group, gIndex) => (
            <motion.div key={group.category} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gIndex * 0.1 }}>
              <h2 className="text-2xl font-bold text-white mb-6 pl-2 border-l-4 border-accent">{group.category}</h2>
              <div className="space-y-4">
                {group.items.map((faq, iIndex) => {
                  const id = `${gIndex}-${iIndex}`;
                  const isOpen = openIndex === id;
                  return (
                    <div key={id} className="glass rounded-2xl overflow-hidden transition-colors hover:bg-white/5">
                      <button 
                        onClick={() => setOpenIndex(isOpen ? null : id)}
                        className="w-full flex items-center justify-between p-6 text-left"
                      >
                        <span className="font-semibold text-white tracking-wide pr-8">{faq.q}</span>
                        <ChevronDown className={`w-5 h-5 text-white/40 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <p className="p-6 pt-0 text-white/50 leading-relaxed">{faq.a}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
