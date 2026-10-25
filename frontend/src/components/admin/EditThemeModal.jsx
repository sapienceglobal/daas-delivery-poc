'use client';

import { useState, useEffect } from 'react';
import { X, Palette, Check, Sparkles, Type } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { Button, showToast } from '@/components/ui';

const TEMPLATE_OPTIONS = [
  {
    id: 'lassi_classic',
    title: 'Classic QSR / Fast Food',
    description: 'Energetic, punchy layout optimized for high-volume quick service (Lassi Lounge style)',
    badge: 'Active & Tested',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    defaultPrimary: '#FDB714',
    defaultSecondary: '#430805'
  },
  {
    id: 'template_bistro',
    title: 'Luxury Bistro & Fine Dining',
    description: 'Elegant serif typography, mood lighting, story-driven menus and wine pairings',
    badge: 'Slot Ready',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    defaultPrimary: '#C5A880',
    defaultSecondary: '#1A1A1A'
  },
  {
    id: 'template_cafe',
    title: 'Artisan Cafe & Bakery',
    description: 'Warm, pastel-friendly aesthetic, breakfast combi-deals and artisan drink showcases',
    badge: 'Slot Ready',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    defaultPrimary: '#D97706',
    defaultSecondary: '#451A03'
  },
  {
    id: 'template_dark_kitchen',
    title: 'Ghost / Cloud Kitchen',
    description: 'Ultra-fast conversion, single-screen ordering, delivery and pickup ETA focused',
    badge: 'Slot Ready',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    defaultPrimary: '#10B981',
    defaultSecondary: '#064E3B'
  }
];

const FONT_OPTIONS = [
  { label: 'Inter (Modern Sans-Serif)', value: 'Inter' },
  { label: 'Poppins (Friendly & Rounded)', value: 'Poppins' },
  { label: 'Outfit (High-End Tech & Luxury)', value: 'Outfit' },
  { label: 'Playfair Display (Bistro / Elegant Serif)', value: 'Playfair Display' },
  { label: 'Roboto (Clean & Standard)', value: 'Roboto' }
];

export default function EditThemeModal({ isOpen, restaurant, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    templateId: 'lassi_classic',
    primaryColor: '#FDB714',
    secondaryColor: '#430805',
    accentColor: '#7A0B10',
    fontFamily: 'Inter',
    heroTitle: '',
    heroSubtitle: '',
    logoUrl: '',
    bannerUrl: ''
  });

  useEffect(() => {
    if (restaurant) {
      const cfg = restaurant.themeConfig || {};
      setFormData({
        templateId: cfg.templateId || 'lassi_classic',
        primaryColor: cfg.primaryColor || '#FDB714',
        secondaryColor: cfg.secondaryColor || '#430805',
        accentColor: cfg.accentColor || '#7A0B10',
        fontFamily: cfg.fontFamily || 'Inter',
        heroTitle: cfg.heroTitle || '',
        heroSubtitle: cfg.heroSubtitle || '',
        logoUrl: cfg.logoUrl || '',
        bannerUrl: cfg.bannerUrl || ''
      });
    }
  }, [restaurant]);

  if (!isOpen || !restaurant) return null;

  const handleSelectTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      templateId: template.id
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminAPI.updateRestaurantTheme(restaurant._id, {
        themeConfig: formData
      });
      showToast(`Theme & Template updated for ${restaurant.name}!`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update theme', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Customize Theme & Template</h2>
              <p className="text-xs text-slate-400">Brand: <span className="text-white font-semibold">{restaurant.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Template Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2.5 uppercase tracking-wider">Design Template</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATE_OPTIONS.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`cursor-pointer rounded-2xl border p-4 transition-all relative ${
                    formData.templateId === tpl.id
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-sm font-bold text-white">{tpl.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tpl.badgeColor}`}>
                      {tpl.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>
                  {formData.templateId === tpl.id && (
                    <div className="absolute bottom-2.5 right-2.5 h-5 w-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Color Scheme */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Brand Palette Tokens</h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="h-8 w-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-full text-xs font-mono rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="h-8 w-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-full text-xs font-mono rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="h-8 w-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                    className="w-full text-xs font-mono rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography & Copy */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Type className="h-3.5 w-3.5 text-cyan-400" /> Typography & Banner
            </h4>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Primary Font Family</label>
              <select
                value={formData.fontFamily}
                onChange={(e) => setFormData(prev => ({ ...prev, fontFamily: e.target.value }))}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/70 focus:outline-none"
              >
                {FONT_OPTIONS.map(font => (
                  <option key={font.value} value={font.value}>{font.label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Hero Heading Text</label>
                <input
                  type="text"
                  value={formData.heroTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, heroTitle: e.target.value }))}
                  placeholder={`Welcome to ${restaurant.name}`}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/70 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Hero Subtitle Text</label>
                <input
                  type="text"
                  value={formData.heroSubtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                  placeholder="Order delicious meals online"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/70 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} size="sm" className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
              <Sparkles className="h-4 w-4" /> Save Theme Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
