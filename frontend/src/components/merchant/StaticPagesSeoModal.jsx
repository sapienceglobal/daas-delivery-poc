'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Globe, Search, Loader2 } from 'lucide-react';
import { seoAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

const STATIC_PAGE_OPTIONS = [
  { path: '/', label: 'Home Page (/)' },
  { path: '/menu', label: 'Menu Listing (/menu)' },
  { path: '/about-us', label: 'About Us (/about-us)' },
  { path: '/contact-us', label: 'Contact Us (/contact-us)' },
  { path: '/catering', label: 'Catering Services (/catering)' },
];

export default function StaticPagesSeoModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [selectedPath, setSelectedPath] = useState('/');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ogImage: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load SEO data for selected path
  useEffect(() => {
    if (!isOpen) return;

    async function loadPageSeo() {
      setIsLoading(true);
      try {
        const res = await seoAPI.getPage(selectedPath);
        if (res?.data) {
          setFormData({
            title: res.data.title || '',
            description: res.data.description || '',
            ogImage: res.data.ogImage || '',
          });
        } else {
          setFormData({ title: '', description: '', ogImage: '' });
        }
      } catch {
        setFormData({ title: '', description: '', ogImage: '' });
      } finally {
        setIsLoading(false);
      }
    }

    loadPageSeo();
  }, [selectedPath, isOpen]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await seoAPI.updatePage({
        path: selectedPath,
        title: formData.title.trim().slice(0, 70),
        description: formData.description.trim().slice(0, 160),
        ogImage: formData.ogImage.trim(),
      });
      showToast('Static page SEO updated & live revalidation triggered!', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update page SEO', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-admin-surface rounded-2xl shadow-2xl border border-admin-border overflow-hidden flex flex-col max-h-[90vh] text-admin-text animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-admin-border bg-admin-card/40">
          <div className="flex items-center gap-3.5">
            <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-400 border border-blue-500/20">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-admin-text font-outfit tracking-tight">Static Pages SEO Editor</h2>
              <p className="text-xs text-admin-text-secondary font-medium mt-0.5">Edit titles, descriptions & Google search appearance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-admin-text-secondary hover:text-admin-text rounded-xl hover:bg-admin-card transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-admin-surface custom-scrollbar text-admin-text">
          {/* Page Selector */}
          <div>
            <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-2 font-outfit">
              Select Page To Edit
            </label>
            <select
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              className="w-full rounded-xl bg-admin-card border border-admin-border text-sm font-semibold text-admin-text px-4 py-3 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand transition-all cursor-pointer"
            >
              {STATIC_PAGE_OPTIONS.map((opt) => (
                <option key={opt.path} value={opt.path} className="bg-admin-surface text-admin-text py-2">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-admin-text-secondary">
              <Loader2 className="w-6 h-6 animate-spin text-brand" />
              <p className="text-sm font-medium text-admin-text-secondary">Loading page SEO settings...</p>
            </div>
          ) : (
            <>
              {/* Meta Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider font-outfit">
                    Meta Title (Max 70 Chars)
                  </label>
                  <span
                    className={`text-xs font-bold ${
                      formData.title.length > 70
                        ? 'text-rose-500'
                        : formData.title.length > 60
                        ? 'text-amber-500'
                        : 'text-admin-text-secondary'
                    }`}
                  >
                    {formData.title.length} / 70
                  </span>
                </div>
                <input
                  maxLength={70}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Best Authentic Indian Restaurant & Delivery | NYC"
                  className="w-full rounded-xl bg-admin-card border border-admin-border text-sm font-medium text-admin-text px-4 py-3 placeholder:text-admin-text-secondary/50 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand transition-all"
                />
                <p className="text-[11px] text-admin-text-secondary mt-1 font-medium">
                  Leave blank to use default system metadata.
                </p>
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider font-outfit">
                    Meta Description (Max 160 Chars)
                  </label>
                  <span
                    className={`text-xs font-bold ${
                      formData.description.length > 160
                        ? 'text-rose-500'
                        : formData.description.length > 140
                        ? 'text-amber-500'
                        : 'text-admin-text-secondary'
                    }`}
                  >
                    {formData.description.length} / 160
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Experience authentic Indian cuisine at Lassi Lounge NY. Order online for fast delivery or reserve your table today."
                  className="w-full rounded-xl bg-admin-card border border-admin-border text-sm font-normal text-admin-text px-4 py-3 placeholder:text-admin-text-secondary/50 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand transition-all resize-none"
                />
              </div>

              {/* OG Image URL */}
              <div>
                <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5 font-outfit">
                  Custom OG Image URL (Optional)
                </label>
                <input
                  value={formData.ogImage}
                  onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                  placeholder="https://www.lassiloungeny.com/assets/images/branded/lassi-lounge/og-image.png"
                  className="w-full rounded-xl bg-admin-card border border-admin-border text-sm font-medium text-admin-text px-4 py-3 placeholder:text-admin-text-secondary/50 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand transition-all"
                />
                <p className="text-[11px] text-admin-text-secondary mt-1 font-medium">
                  Displayed as a preview card when shared on WhatsApp, Facebook, X/Twitter, and LinkedIn.
                </p>
              </div>

              {/* Google Live SERP Preview */}
              <div className="p-4 rounded-xl bg-admin-card border border-admin-border space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-admin-text-secondary uppercase tracking-wider font-outfit">
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google Search Live Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-brand flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                    LL
                  </div>
                  <a
                    href={selectedPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-admin-text leading-tight truncate hover:underline"
                    title="Open live page in new tab"
                  >
                    <span className="font-semibold text-admin-text">Lassi Lounge NY</span>
                    <span className="text-admin-text-secondary ml-1">
                      · https://www.lassiloungeny.com{selectedPath === '/' ? '' : selectedPath}
                    </span>
                  </a>
                </div>
                <a
                  href={selectedPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[17px] font-medium text-blue-400 hover:underline cursor-pointer leading-snug line-clamp-1 pt-0.5 block"
                  title="Open live page in new tab"
                >
                  {formData.title ? `${formData.title} | Lassi Lounge NY` : 'Page Title | Lassi Lounge NY'}
                </a>
                <p className="text-[13px] text-admin-text-secondary leading-relaxed line-clamp-2">
                  {formData.description || 'Page description will appear here on Google search results.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-admin-border bg-admin-card/40 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-admin-border text-sm font-bold text-admin-text-secondary bg-admin-card hover:bg-admin-surface-hover hover:text-admin-text shadow-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || isLoading}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-brand hover:opacity-90 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-brand/20 transition-all disabled:opacity-50 font-outfit"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Revalidate Live
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
