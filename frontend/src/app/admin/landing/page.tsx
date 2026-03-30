'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, GripVertical, Save, RotateCcw, Sparkles, ArrowUp, ArrowDown, Pencil, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';

/* eslint-disable @typescript-eslint/no-explicit-any */

const sectionLabels: Record<string, string> = {
  hero: '🖼️ Hero Carousel',
  categories: '🗂️ Categories',
  featured: '⭐ Featured Products',
  offers: '🏷️ Special Offers',
  lookbook: '📸 Style Lookbook',
  perks: '✅ Perks / Trust Signals',
};

const sectionDescriptions: Record<string, string> = {
  hero: 'Full-width hero banner with parallax and call-to-action',
  categories: 'Product category cards with images',
  featured: 'Featured product listings from your catalog',
  offers: 'Promotional offer banners',
  lookbook: 'Campaign lookbook image gallery',
  perks: 'Why choose us — shipping, returns, payments',
};

export default function AdminLandingPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data } = await adminAPI.getLandingConfig();
        setSections(data.data?.sections || []);
      } catch { /* ignore */ }
      setLoading(false);
    }
    fetchConfig();
  }, []);

  const toggleVisibility = (key: string) => {
    setSections(sections.map((s) => s.key === key ? { ...s, visible: !s.visible } : s));
    setHasChanges(true);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    // Recalculate order
    newSections.forEach((s, i) => { s.order = i + 1; });
    setSections(newSections);
    setHasChanges(true);
  };

  const moveDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    newSections.forEach((s, i) => { s.order = i + 1; });
    setSections(newSections);
    setHasChanges(true);
  };

  const updateTitle = (key: string, title: string) => {
    setSections(sections.map((s) => s.key === key ? { ...s, title } : s));
    setHasChanges(true);
  };

  const updateSubtitle = (key: string, subtitle: string) => {
    setSections(sections.map((s) => s.key === key ? { ...s, subtitle } : s));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminAPI.updateLandingConfig(sections);
      toast.success('Landing page config saved!');
      setHasChanges(false);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getLandingConfig();
      setSections(data.data?.sections || []);
      setHasChanges(false);
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-accent" /> Landing Page</h1>
          <p className="text-sm text-white/30 mt-1">Customize what your customers see on the home page</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleReset} disabled={!hasChanges} className="px-4 py-2.5 rounded-xl glass text-sm text-white/50 hover:text-white disabled:opacity-30 flex items-center gap-2 transition-colors"><RotateCcw className="w-4 h-4" /> Reset</button>
          <button onClick={handleSave} disabled={saving || !hasChanges}
            className="px-5 py-2.5 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2 transition-all glow-red-hover"><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</button>
        </div>
      </div>

      {hasChanges && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium text-center">
          You have unsaved changes
        </motion.div>
      )}

      <div className="space-y-3">
        {sortedSections.map((section, index) => (
          <motion.div key={section.key}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
            className={`p-5 rounded-2xl glass-strong transition-all ${!section.visible ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-4">
              {/* Drag handle + Ordering */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <GripVertical className="w-4 h-4 text-white/10" />
                <button onClick={() => moveUp(index)} disabled={index === 0} className="p-1 text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors"><ArrowUp className="w-3 h-3" /></button>
                <span className="text-[10px] text-white/20 font-bold">{section.order}</span>
                <button onClick={() => moveDown(index)} disabled={index === sortedSections.length - 1} className="p-1 text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors"><ArrowDown className="w-3 h-3" /></button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-base">{sectionLabels[section.key] || section.key}</span>
                  <button onClick={() => toggleVisibility(section.key)}
                    className={`p-1.5 rounded-lg transition-colors ${section.visible ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-red-400 hover:bg-red-400/10'}`}>
                    {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-white/30">{sectionDescriptions[section.key]}</p>

                {/* Editable title */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Section Title</label>
                    {editingTitle === `${section.key}-title` ? (
                      <div className="flex gap-2">
                        <input value={section.title || ''} onChange={(e) => updateTitle(section.key, e.target.value)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-accent/50" autoFocus />
                        <button onClick={() => setEditingTitle(null)} className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20"><Check className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingTitle(`${section.key}-title`)}
                        className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                        {section.title || '(no title)'} <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {section.key !== 'hero' && section.key !== 'perks' && (
                    <div>
                      <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1">Subtitle</label>
                      {editingTitle === `${section.key}-sub` ? (
                        <div className="flex gap-2">
                          <input value={section.subtitle || ''} onChange={(e) => updateSubtitle(section.key, e.target.value)}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-accent/50" autoFocus />
                          <button onClick={() => setEditingTitle(null)} className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20"><Check className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <button onClick={() => setEditingTitle(`${section.key}-sub`)}
                          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors truncate">
                          {section.subtitle || '(no subtitle)'} <Pencil className="w-3 h-3 shrink-0" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Visibility badge */}
              <div className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold ${section.visible ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {section.visible ? 'Visible' : 'Hidden'}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-5 rounded-2xl glass">
        <h3 className="text-sm font-medium text-white/50 mb-3">💡 Tips</h3>
        <ul className="text-xs text-white/30 space-y-1.5">
          <li>• Use ↑↓ arrows to reorder sections on the landing page</li>
          <li>• Click the eye icon to show/hide sections</li>
          <li>• Click on titles to customize section headings</li>
          <li>• Changes reflect instantly on the live store after saving</li>
        </ul>
      </div>
    </div>
  );
}
