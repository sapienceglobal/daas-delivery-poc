'use client';

import { useState } from 'react';
import { X, Store, Palette, Globe, Shield, Sparkles, Check, Key } from 'lucide-react';
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

export default function CreateTenantModal({ isOpen, onClose, onSuccess }) {
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    tenantId: '',
    cuisine: '',
    address: '',
    phone: '',
    plan: 'growth',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    customDomain: '',
    subdomain: '',
    templateId: 'lassi_classic',
    primaryColor: '#FDB714',
    secondaryColor: '#430805',
    accentColor: '#7A0B10',
    fontFamily: 'Inter',
    heroTitle: '',
    heroSubtitle: ''
  });

  if (!isOpen) return null;

  const handleNameChange = (name) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') ? slug : prev.slug,
      tenantId: prev.tenantId === '' || prev.tenantId === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') ? slug : prev.tenantId,
      subdomain: prev.subdomain === '' ? slug : prev.subdomain,
      heroTitle: prev.heroTitle === '' ? `Welcome to ${name}` : prev.heroTitle
    }));
  };

  const handleSelectTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      templateId: template.id,
      primaryColor: template.defaultPrimary,
      secondaryColor: template.defaultSecondary
    }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, ownerPassword: pwd }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return showToast('Restaurant name is required', 'error');
    if (!formData.ownerEmail.trim()) return showToast('Owner email is required', 'error');
    if (!formData.ownerPassword.trim()) return showToast('Owner password is required', 'error');

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        tenantId: formData.tenantId.trim(),
        cuisine: formData.cuisine.trim() || 'General Dining',
        address: formData.address.trim() || 'Online Kitchen',
        phone: formData.phone.trim() || '000-000-0000',
        plan: formData.plan,
        ownerName: formData.ownerName.trim() || `${formData.name.trim()} Admin`,
        ownerEmail: formData.ownerEmail.trim(),
        ownerPassword: formData.ownerPassword.trim(),
        customDomain: formData.customDomain.trim() || null,
        subdomain: formData.subdomain.trim() || null,
        themeConfig: {
          templateId: formData.templateId,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          fontFamily: formData.fontFamily,
          heroTitle: formData.heroTitle || `Welcome to ${formData.name}`,
          heroSubtitle: formData.heroSubtitle || 'Order food online with fast pickup and delivery'
        }
      };

      await adminAPI.createRestaurantTenant(payload);
      showToast(`Restaurant '${formData.name}' created with tenant '${formData.tenantId}'!`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to onboard restaurant', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Onboard New Restaurant Tenant</h2>
              <p className="text-xs text-slate-400">Multi-tenant sharding, design template assignment & merchant setup</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/60">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeStep === 1 ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px]">1</span>
            Restaurant Info
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeStep === 2 ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px]">2</span>
            Template & Brand Tokens
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeStep === 3 ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="h-5 w-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px]">3</span>
            Owner & Domain
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Restaurant Brand Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Burger Bistro & Grills"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/70 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Tenant Database Identifier *</label>
                  <input
                    type="text"
                    required
                    value={formData.tenantId}
                    onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                    placeholder="e.g. burger-bistro"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm font-mono text-cyan-400 placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500">MongoDB Database: <code className="text-cyan-300 font-mono">daas_poc_{formData.tenantId || '...'}</code></p>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Cuisine / Category</label>
                  <input
                    type="text"
                    value={formData.cuisine}
                    onChange={(e) => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
                    placeholder="e.g. Gourmet Burgers, American, Fast Casual"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/70 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. (555) 234-5678"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/70 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">SaaS Tier Plan</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData(prev => ({ ...prev, plan: e.target.value }))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/70 focus:outline-none"
                  >
                    <option value="starter">Starter Plan (Online Web Ordering)</option>
                    <option value="growth">Growth Plan (Web + Custom APK + Loyalty)</option>
                    <option value="enterprise">Enterprise Plan (Dedicated Fleet + Multi-Branch)</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Physical Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. 145 Main Street, Brooklyn, NY"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/70 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2.5 uppercase tracking-wider">Select Design Template</label>
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
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-bold text-white">{tpl.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tpl.badgeColor}`}>
                          {tpl.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-3">{tpl.description}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>Palette:</span>
                        <span className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: tpl.defaultPrimary }} />
                        <span className="h-3.5 w-3.5 rounded-full border border-white/20" style={{ backgroundColor: tpl.defaultSecondary }} />
                      </div>
                      {formData.templateId === tpl.id && (
                        <div className="absolute bottom-2.5 right-2.5 h-5 w-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Brand Palette Tokens */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="h-3.5 w-3.5 text-amber-400" /> Brand Color Overrides
                </h4>
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

                <div className="space-y-1 pt-2">
                  <label className="text-xs font-semibold text-slate-300">Hero Heading Copy</label>
                  <input
                    type="text"
                    value={formData.heroTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, heroTitle: e.target.value }))}
                    placeholder="e.g. Handcrafted Burgers & Shakes"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/70 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-6">
              {/* Merchant Credentials */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-indigo-400" /> Merchant Owner Login
                  </h4>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Key className="h-3 w-3" /> Auto-generate Password
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Owner Contact Name</label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                      placeholder="e.g. John Doe"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/70 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Owner Login Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.ownerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                      placeholder="owner@burgerbistro.com"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-500/70 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Initial Password *</label>
                    <input
                      type="text"
                      required
                      value={formData.ownerPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerPassword: e.target.value }))}
                      placeholder="Enter strong password for merchant login"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm font-mono text-white placeholder:text-slate-500 focus:border-indigo-500/70 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Domain Settings */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-cyan-400" /> Custom Domain & CNAME
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Custom Domain (Optional)</label>
                    <input
                      type="text"
                      value={formData.customDomain}
                      onChange={(e) => setFormData(prev => ({ ...prev, customDomain: e.target.value.toLowerCase().trim() }))}
                      placeholder="e.g. burgerbistrony.com"
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Platform Subdomain</label>
                    <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-sm">
                      <input
                        type="text"
                        value={formData.subdomain}
                        onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value.toLowerCase().trim() }))}
                        placeholder="burgerbistro"
                        className="w-full bg-transparent text-white focus:outline-none"
                      />
                      <span className="text-xs text-slate-500 pl-1">.yourdomain.com</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {activeStep > 1 ? (
              <Button type="button" variant="secondary" size="sm" onClick={() => setActiveStep(prev => prev - 1)}>
                Back
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              {activeStep < 3 ? (
                <Button type="button" size="sm" onClick={() => setActiveStep(prev => prev + 1)}>
                  Next Step
                </Button>
              ) : (
                <Button type="submit" loading={loading} size="sm" className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                  <Sparkles className="h-4 w-4" /> Provision Restaurant
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
