'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Save,
  Globe,
  Search,
  Loader2,
  Code2,
  Tag,
  CheckCircle2,
  Layers,
  Sparkles,
  AlertTriangle,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('pages'); // 'pages' | 'global'

  // Tab 1: Page SEO State
  const [selectedPath, setSelectedPath] = useState('/');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ogImage: '',
  });

  // Tab 2: Global Header & Footer Scripts & IDs State
  const [globalData, setGlobalData] = useState({
    gtmId: '',
    googleAdsId: '',
    metaPixelId: '',
    headerScripts: '',
    footerScripts: '',
    keepWhatsAppWithCustomChat: false,
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

  // Load SEO data for selected static page
  useEffect(() => {
    if (!isOpen || activeTab !== 'pages') return;

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
  }, [selectedPath, isOpen, activeTab]);

  // Load Global Scripts data when switching to 'global' tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'global') return;

    async function loadGlobalSeo() {
      setIsLoading(true);
      try {
        const res = await seoAPI.getGlobal();
        if (res?.data) {
          setGlobalData({
            gtmId: res.data.gtmId || '',
            googleAdsId: res.data.googleAdsId || '',
            metaPixelId: res.data.metaPixelId || '',
            headerScripts: res.data.headerScripts || '',
            footerScripts: res.data.footerScripts || '',
            keepWhatsAppWithCustomChat: Boolean(res.data.keepWhatsAppWithCustomChat),
          });
        }
      } catch {
        // Fallback default
      } finally {
        setIsLoading(false);
      }
    }

    loadGlobalSeo();
  }, [isOpen, activeTab]);

  const handleSavePage = async () => {
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

  const handleSaveGlobal = async () => {
    try {
      setIsSaving(true);
      await seoAPI.updateGlobal({
        gtmId: globalData.gtmId.trim(),
        googleAdsId: globalData.googleAdsId.trim(),
        metaPixelId: globalData.metaPixelId.trim(),
        headerScripts: globalData.headerScripts.trim(),
        footerScripts: globalData.footerScripts.trim(),
        keepWhatsAppWithCustomChat: Boolean(globalData.keepWhatsAppWithCustomChat),
      });
      showToast('Global scripts & tracking IDs saved & applied live!', 'success');
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update global scripts', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Format analysis helper for script text
  const analyzeScriptFormat = (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return { type: 'empty' };
    const hasHtmlTags = /<[a-z!][\s\S]*>/i.test(trimmed);
    if (!hasHtmlTags) {
      return {
        type: 'plain-text',
        message: 'Plain text detected. Scripts must be wrapped in <script>...</script> tags to run properly.',
      };
    }
    return { type: 'valid' };
  };

  const headerAnalysis = analyzeScriptFormat(globalData.headerScripts);
  const footerAnalysis = analyzeScriptFormat(globalData.footerScripts);

  // Helper to wrap current text in <script> tags
  const handleWrapInScript = (field) => {
    const current = (globalData[field] || '').trim();
    if (!current) return;
    setGlobalData((prev) => ({
      ...prev,
      [field]: `<script>\n${current}\n</script>`,
    }));
  };

  // Presets appenders
  const appendSnippet = (field, snippet) => {
    setGlobalData((prev) => {
      const current = (prev[field] || '').trim();
      const next = current ? `${current}\n\n${snippet}` : snippet;
      return { ...prev, [field]: next };
    });
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
        className="relative w-full max-w-3xl bg-admin-surface rounded-2xl shadow-2xl border border-admin-border overflow-hidden flex flex-col max-h-[92vh] text-admin-text animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-admin-border bg-admin-card/40">
          <div className="flex items-center gap-3.5">
            <div className="bg-brand/10 p-2.5 rounded-xl text-brand border border-brand/20">
              {activeTab === 'pages' ? (
                <Globe className="w-5 h-5 text-blue-400" />
              ) : (
                <Code2 className="w-5 h-5 text-emerald-400" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-black text-admin-text font-outfit tracking-tight">
                SEO & Script Manager
              </h2>
              <p className="text-xs text-admin-text-secondary font-medium mt-0.5">
                Manage search meta tags, Google Tag Manager, Google Ads, Meta Pixel & Head/Footer scripts
              </p>
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

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-admin-border bg-admin-card/20">
          <button
            type="button"
            onClick={() => setActiveTab('pages')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold uppercase tracking-wider font-outfit border-b-2 transition-all ${
              activeTab === 'pages'
                ? 'border-brand text-brand'
                : 'border-transparent text-admin-text-secondary hover:text-admin-text'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Static Page SEO</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('global')}
            className={`flex items-center gap-2 pb-3 px-3 text-xs font-bold uppercase tracking-wider font-outfit border-b-2 transition-all ${
              activeTab === 'global'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-admin-text-secondary hover:text-admin-text'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Global Scripts (&lt;head&gt; & &lt;body&gt;)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold lowercase">
              live
            </span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 bg-admin-surface custom-scrollbar text-admin-text">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-admin-text-secondary">
              <Loader2 className="w-7 h-7 animate-spin text-brand" />
              <p className="text-sm font-medium text-admin-text-secondary">
                Loading {activeTab === 'pages' ? 'page SEO settings' : 'global tracking scripts'}...
              </p>
            </div>
          ) : activeTab === 'pages' ? (
            <>
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
          ) : (
            <>
              {/* Tab 2: Global Header & Footer Scripts & Tracking IDs */}
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-admin-text-secondary leading-relaxed">
                  <p className="font-bold text-emerald-400 mb-0.5 font-outfit uppercase tracking-wider">
                    Site-Wide &lt;head&gt; & &lt;body&gt; Script Injection
                  </p>
                  Any ID or script added here applies automatically to the entire website. Safe multi-layer sandbox ensures external or syntax script errors never crash the customer website.
                </div>
              </div>

              {/* Quick Tracking IDs Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-admin-text uppercase tracking-wider font-outfit border-b border-admin-border pb-2">
                  <Tag className="w-4 h-4 text-brand" />
                  <span>Official Marketing & Analytics IDs (No Code Needed)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Google Tag Manager Container ID */}
                  <div>
                    <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5 font-outfit">
                      GTM Container ID
                    </label>
                    <input
                      value={globalData.gtmId}
                      onChange={(e) => setGlobalData({ ...globalData, gtmId: e.target.value })}
                      placeholder="e.g. GTM-WWK7W55Q"
                      className="w-full rounded-xl bg-admin-card border border-admin-border text-sm font-medium text-admin-text px-4 py-2.5 placeholder:text-admin-text-secondary/50 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                    <p className="text-[10px] text-admin-text-secondary mt-1">
                      Google Tag Manager container ID
                    </p>
                  </div>

                  {/* Google Ads / GA4 Measurement ID */}
                  <div>
                    <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5 font-outfit">
                      Google Ads / GA4 ID
                    </label>
                    <input
                      value={globalData.googleAdsId}
                      onChange={(e) => setGlobalData({ ...globalData, googleAdsId: e.target.value })}
                      placeholder="e.g. AW-16715555638"
                      className="w-full rounded-xl bg-admin-card border border-admin-border text-sm font-medium text-admin-text px-4 py-2.5 placeholder:text-admin-text-secondary/50 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                    <p className="text-[10px] text-admin-text-secondary mt-1">
                      AW-XXXXX or G-XXXXX (gtag.js)
                    </p>
                  </div>

                  {/* Meta Pixel ID */}
                  <div>
                    <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5 font-outfit">
                      Meta Pixel ID
                    </label>
                    <input
                      value={globalData.metaPixelId}
                      onChange={(e) => setGlobalData({ ...globalData, metaPixelId: e.target.value })}
                      placeholder="e.g. 123456789012345"
                      className="w-full rounded-xl bg-admin-card border border-admin-border text-sm font-medium text-admin-text px-4 py-2.5 placeholder:text-admin-text-secondary/50 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand transition-all"
                    />
                    <p className="text-[10px] text-admin-text-secondary mt-1">
                      Facebook / Instagram Pixel ID
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Header Scripts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-admin-text uppercase tracking-wider font-outfit">
                    <Code2 className="w-4 h-4 text-blue-400" />
                    <span>Header Scripts (&lt;head&gt;...&lt;/head&gt;)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {headerAnalysis.type === 'valid' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> HTML / Script Tag
                      </span>
                    )}
                    {headerAnalysis.type === 'plain-text' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:bg-amber-500/15 dark:text-amber-400 border border-rose-500/25 dark:border-amber-500/25">
                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-amber-400" /> Plain Text Detected
                      </span>
                    )}
                  </div>
                </div>

                {/* Preset Snippet Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-admin-text-secondary font-bold uppercase tracking-wider mr-1">
                    Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      appendSnippet(
                        'headerScripts',
                        `<meta name="google-site-verification" content="PASTE_YOUR_VERIFICATION_CODE_HERE" />`
                      )
                    }
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-admin-card border border-admin-border hover:bg-admin-card/80 text-admin-text flex items-center gap-1 transition-all"
                  >
                    <PlusCircle className="w-3 h-3 text-blue-400" /> + Google Verification
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      appendSnippet(
                        'headerScripts',
                        `<script type="text/javascript">\n  (function(c,l,a,r,i,t,y){\n    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};\n    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;\n    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);\n  })(window, document, "clarity", "script", "CLARITY_PROJECT_ID");\n</script>`
                      )
                    }
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-admin-card border border-admin-border hover:bg-admin-card/80 text-admin-text flex items-center gap-1 transition-all"
                  >
                    <PlusCircle className="w-3 h-3 text-cyan-400" /> + Microsoft Clarity
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      appendSnippet(
                        'headerScripts',
                        `<style>\n  /* Add custom CSS rules here */\n</style>`
                      )
                    }
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-admin-card border border-admin-border hover:bg-admin-card/80 text-admin-text flex items-center gap-1 transition-all"
                  >
                    <PlusCircle className="w-3 h-3 text-purple-400" /> + Custom CSS
                  </button>
                  {headerAnalysis.type === 'plain-text' && (
                    <button
                      type="button"
                      onClick={() => handleWrapInScript('headerScripts')}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 border border-rose-500/30 hover:bg-rose-500/25 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 dark:hover:bg-amber-500/30 transition-all ml-auto cursor-pointer"
                    >
                      Wrap in &lt;script&gt;
                    </button>
                  )}
                </div>

                <textarea
                  rows={4}
                  value={globalData.headerScripts}
                  onChange={(e) => setGlobalData({ ...globalData, headerScripts: e.target.value })}
                  placeholder={`<!-- Paste custom head tags or scripts here -->\n<meta name="google-site-verification" content="your_verification_code" />\n<script async src="https://cdn.example.com/analytics.js"></script>`}
                  className="w-full rounded-xl bg-admin-card border border-admin-border text-xs font-mono text-admin-text px-4 py-3 placeholder:text-admin-text-secondary/40 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand transition-all resize-y custom-scrollbar"
                />

                {headerAnalysis.type === 'plain-text' && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 dark:bg-amber-500/10 border border-rose-500/25 dark:border-amber-500/20 text-rose-700 dark:text-amber-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-amber-400 shrink-0" />
                      <span>{headerAnalysis.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWrapInScript('headerScripts')}
                      className="font-bold underline ml-2 text-rose-800 hover:text-rose-950 dark:text-amber-200 dark:hover:text-amber-100 shrink-0 cursor-pointer"
                    >
                      Wrap Now
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-admin-text-secondary">
                  Injected into the &lt;head&gt; of all pages. Ideal for Google verification meta tags, Microsoft Clarity, Hotjar, or custom fonts.
                </p>
              </div>

              {/* Custom Footer Scripts */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-admin-text uppercase tracking-wider font-outfit">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Footer Scripts (Before &lt;/body&gt;)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {footerAnalysis.type === 'valid' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> HTML / Script Tag
                      </span>
                    )}
                    {footerAnalysis.type === 'plain-text' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:bg-amber-500/15 dark:text-amber-400 border border-rose-500/25 dark:border-amber-500/25">
                        <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-amber-400" /> Plain Text Detected
                      </span>
                    )}
                  </div>
                </div>

                {/* Preset Snippet Buttons for Footer */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-admin-text-secondary font-bold uppercase tracking-wider mr-1">
                    Presets:
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      appendSnippet(
                        'footerScripts',
                        `<!-- Tawk.to Live Chat Script -->\n<script type="text/javascript">\n  var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();\n  (function(){\n    var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];\n    s1.async=true;\n    s1.src='https://embed.tawk.to/YOUR_PROPERTY_ID/DEFAULT';\n    s1.charset='UTF-8';\n    s1.setAttribute('crossorigin','*');\n    s0.parentNode.insertBefore(s1,s0);\n  })();\n</script>`
                      )
                    }
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-admin-card border border-admin-border hover:bg-admin-card/80 text-admin-text flex items-center gap-1 transition-all"
                  >
                    <PlusCircle className="w-3 h-3 text-emerald-400" /> + Tawk.to Live Chat
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      appendSnippet(
                        'footerScripts',
                        `<!-- Custom Floating Action Button Script -->\n<script>\n  console.log("Footer widget loaded successfully.");\n</script>`
                      )
                    }
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-admin-card border border-admin-border hover:bg-admin-card/80 text-admin-text flex items-center gap-1 transition-all"
                  >
                    <PlusCircle className="w-3 h-3 text-teal-400" /> + Custom Widget Script
                  </button>
                  {footerAnalysis.type === 'plain-text' && (
                    <button
                      type="button"
                      onClick={() => handleWrapInScript('footerScripts')}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 border border-rose-500/30 hover:bg-rose-500/25 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 dark:hover:bg-amber-500/30 transition-all ml-auto cursor-pointer"
                    >
                      Wrap in &lt;script&gt;
                    </button>
                  )}
                </div>

                <textarea
                  rows={4}
                  value={globalData.footerScripts}
                  onChange={(e) => setGlobalData({ ...globalData, footerScripts: e.target.value })}
                  placeholder={`<!-- Paste live chat or footer scripts here -->\n<script src="https://embed.tawk.to/your_chat_id/default" charset="UTF-8" crossorigin="*"></script>`}
                  className="w-full rounded-xl bg-admin-card border border-admin-border text-xs font-mono text-admin-text px-4 py-3 placeholder:text-admin-text-secondary/40 shadow-sm focus:outline-none focus:ring-1 focus:ring-brand/30 focus:border-brand transition-all resize-y custom-scrollbar"
                />

                {footerAnalysis.type === 'plain-text' && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 dark:bg-amber-500/10 border border-rose-500/25 dark:border-amber-500/20 text-rose-700 dark:text-amber-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-amber-400 shrink-0" />
                      <span>{footerAnalysis.message}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleWrapInScript('footerScripts')}
                      className="font-bold underline ml-2 text-rose-800 hover:text-rose-950 dark:text-amber-200 dark:hover:text-amber-100 shrink-0 cursor-pointer"
                    >
                      Wrap Now
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-admin-text-secondary">
                  Injected before the closing &lt;/body&gt; tag on all pages. Ideal for live chat widgets (Tawk.to, WhatsApp, Crisp) or floating widgets.
                </p>

                {/* WhatsApp Widget Conflict Management Toggle */}
                <div className="p-3.5 rounded-xl bg-admin-card border border-admin-border flex items-center justify-between gap-4 mt-2">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-admin-text font-outfit">
                        Keep WhatsApp button alongside Live Chat
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        globalData.keepWhatsAppWithCustomChat
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                          : 'bg-slate-500/15 text-slate-400 border border-slate-500/25'
                      }`}>
                        {globalData.keepWhatsAppWithCustomChat ? 'Both Visible (Stacked)' : 'Auto-Hide (Recommended)'}
                      </span>
                    </div>
                    <p className="text-[11px] text-admin-text-secondary mt-1 leading-snug">
                      {globalData.keepWhatsAppWithCustomChat
                        ? 'WhatsApp button will automatically shift upwards above the live chat bubble so both work cleanly without overlapping.'
                        : 'WhatsApp button will automatically hide when a third-party chat script (like Tawk.to) is active to keep the bottom-right corner clean.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setGlobalData({
                        ...globalData,
                        keepWhatsAppWithCustomChat: !globalData.keepWhatsAppWithCustomChat,
                      })
                    }
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      globalData.keepWhatsAppWithCustomChat ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                    role="switch"
                    aria-checked={globalData.keepWhatsAppWithCustomChat}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        globalData.keepWhatsAppWithCustomChat ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
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
            onClick={activeTab === 'pages' ? handleSavePage : handleSaveGlobal}
            className="px-6 py-2.5 rounded-xl bg-brand hover:opacity-90 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-brand/20 transition-all disabled:opacity-50 font-outfit"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {activeTab === 'pages' ? 'Save Page SEO & Revalidate' : 'Save & Apply Global Scripts'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
