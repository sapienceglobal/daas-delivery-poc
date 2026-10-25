'use client';

import { useState, useEffect } from 'react';
import { X, Globe, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { Button, showToast } from '@/components/ui';

export default function EditDomainModal({ isOpen, restaurant, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tenantId: '',
    customDomain: '',
    subdomain: ''
  });

  useEffect(() => {
    if (restaurant) {
      setFormData({
        tenantId: restaurant.tenantId || restaurant.slug || '',
        customDomain: restaurant.customDomain || '',
        subdomain: restaurant.subdomain || ''
      });
    }
  }, [restaurant]);

  if (!isOpen || !restaurant) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminAPI.updateRestaurantDomain(restaurant._id, {
        tenantId: formData.tenantId.trim(),
        customDomain: formData.customDomain.trim() || null,
        subdomain: formData.subdomain.trim() || null
      });
      showToast(`Domain & routing updated for ${restaurant.name}!`, 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to update domain settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-800 bg-[#0b0f19] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Domain & Routing Setup</h2>
              <p className="text-xs text-slate-400">Brand: <span className="text-white font-semibold">{restaurant.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Tenant Database Tag</label>
            <input
              type="text"
              required
              value={formData.tenantId}
              onChange={(e) => setFormData(prev => ({ ...prev, tenantId: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
              placeholder="e.g. burger-bistro"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-cyan-400 focus:border-cyan-500/70 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">MongoDB Database Context: <code className="text-cyan-300">daas_poc_{formData.tenantId || '...'}</code></p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Custom Domain (CNAME / Production Host)</label>
            <input
              type="text"
              value={formData.customDomain}
              onChange={(e) => setFormData(prev => ({ ...prev, customDomain: e.target.value.toLowerCase().trim() }))}
              placeholder="e.g. burgerbistrony.com"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/70 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">Traffic hitting this domain will automatically render this brand's website with zero proxy overhead.</p>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Platform Subdomain</label>
            <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm">
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

          {/* DNS Note */}
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-cyan-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-400 leading-relaxed">
              <strong className="text-white">Production DNS:</strong> Point the client's custom domain CNAME record to your Next.js server. The platform router will automatically bind the tenant's brand tokens and database context.
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} size="sm" className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
              <Sparkles className="h-4 w-4" /> Save Domain Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
