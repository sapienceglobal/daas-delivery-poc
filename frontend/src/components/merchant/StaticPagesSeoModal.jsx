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
      style={{ colorScheme: 'light' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#e5e7eb] overflow-hidden flex flex-col max-h-[90vh] text-[#111827] animate-in zoom-in-95 duration-200"
        style={{ colorScheme: 'light', color: '#111827', backgroundColor: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb] bg-white">
          <div className="flex items-center gap-3">
            <div className="bg-[#eff6ff] p-2.5 rounded-2xl text-[#2563eb] border border-[#dbeafe]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#111827] tracking-tight">Static Pages SEO Editor</h2>
              <p className="text-xs text-[#6b7280] font-medium mt-0.5">Edit titles, descriptions & Google search appearance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#9ca3af] hover:text-[#111827] rounded-full hover:bg-[#f3f4f6] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-white custom-scrollbar text-[#111827]">
          {/* Page Selector */}
          <div>
            <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">
              Select Page To Edit
            </label>
            <select
              value={selectedPath}
              onChange={(e) => setSelectedPath(e.target.value)}
              style={{ colorScheme: 'light', color: '#111827', backgroundColor: '#ffffff' }}
              className="w-full rounded-xl bg-white border border-[#d1d5db] text-sm font-semibold text-[#111827] px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all cursor-pointer"
            >
              {STATIC_PAGE_OPTIONS.map((opt) => (
                <option key={opt.path} value={opt.path} style={{ color: '#111827', backgroundColor: '#ffffff' }} className="bg-white text-[#111827] py-2">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#9ca3af]">
              <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
              <p className="text-sm font-medium text-[#6b7280]">Loading page SEO settings...</p>
            </div>
          ) : (
            <>
              {/* Meta Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider">
                    Meta Title (Max 70 Chars)
                  </label>
                  <span
                    className={`text-xs font-bold ${
                      formData.title.length > 70
                        ? 'text-[#dc2626]'
                        : formData.title.length > 60
                        ? 'text-[#d97706]'
                        : 'text-[#6b7280]'
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
                  style={{ colorScheme: 'light', color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full rounded-xl bg-white border border-[#d1d5db] text-sm font-medium text-[#111827] px-4 py-3 placeholder:text-[#9ca3af] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                />
                <p className="text-[11px] text-[#6b7280] mt-1 font-medium">
                  Leave blank to use default system metadata.
                </p>
              </div>

              {/* Meta Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider">
                    Meta Description (Max 160 Chars)
                  </label>
                  <span
                    className={`text-xs font-bold ${
                      formData.description.length > 160
                        ? 'text-[#dc2626]'
                        : formData.description.length > 140
                        ? 'text-[#d97706]'
                        : 'text-[#6b7280]'
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
                  style={{ colorScheme: 'light', color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full rounded-xl bg-white border border-[#d1d5db] text-sm font-normal text-[#111827] px-4 py-3 placeholder:text-[#9ca3af] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all resize-none"
                />
              </div>

              {/* OG Image URL */}
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-1.5">
                  Custom OG Image URL (Optional)
                </label>
                <input
                  value={formData.ogImage}
                  onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                  placeholder="https://www.lassiloungeny.com/assets/images/branded/lassi-lounge/og-image.png"
                  style={{ colorScheme: 'light', color: '#111827', backgroundColor: '#ffffff' }}
                  className="w-full rounded-xl bg-white border border-[#d1d5db] text-sm font-medium text-[#111827] px-4 py-3 placeholder:text-[#9ca3af] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
                />
                <p className="text-[11px] text-[#6b7280] mt-1 font-medium">
                  Displayed as a preview card when shared on WhatsApp, Facebook, X/Twitter, and LinkedIn.
                </p>
              </div>

              {/* Google Live SERP Preview */}
              <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e5e7eb] space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4b5563] uppercase tracking-wider">
                  <Search className="w-3.5 h-3.5 text-[#2563eb]" />
                  <span>Google Search Live Preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#8B0000] flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                    LL
                  </div>
                  <a
                    href={selectedPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#202124] leading-tight truncate hover:underline"
                    title="Open live page in new tab"
                  >
                    <span className="font-semibold text-[#111827]">Lassi Lounge NY</span>
                    <span className="text-[#5f6368] ml-1">
                      · https://www.lassiloungeny.com{selectedPath === '/' ? '' : selectedPath}
                    </span>
                  </a>
                </div>
                <a
                  href={selectedPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[17px] font-medium text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1 pt-0.5 block"
                  title="Open live page in new tab"
                >
                  {formData.title ? `${formData.title} | Lassi Lounge NY` : 'Page Title | Lassi Lounge NY'}
                </a>
                <p className="text-[13px] text-[#4d5156] leading-relaxed line-clamp-2">
                  {formData.description || 'Page description will appear here on Google search results.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#e5e7eb] bg-[#f9fafb] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            style={{ color: '#374151', backgroundColor: '#ffffff' }}
            className="px-5 py-2.5 rounded-xl border border-[#d1d5db] text-sm font-bold text-[#374151] bg-white hover:bg-[#f3f4f6] shadow-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || isLoading}
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-[#8B0000] hover:bg-[#700000] text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
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
