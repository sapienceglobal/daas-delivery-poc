'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone, Send, Clock, Users, CheckCircle2, XCircle,
  Loader2, Upload, Link as LinkIcon, Type, AlignLeft, Target, Trash2, Calendar, Sparkles
} from 'lucide-react';
import { marketingAPI, api } from '@/lib/api';
import { showToast, ConfirmModal } from '@/components/ui';
import PageHeaderGradient from './common/PageHeaderGradient';

const PhonePreview = ({ title, message, imageUrl }) => {
  return (
    <div className="relative mx-auto w-[280px] h-[550px] bg-slate-950 rounded-[38px] shadow-2xl overflow-hidden flex flex-col items-center shrink-0 border-[6px] border-slate-900 ring-1 ring-white/10">
      {/* Notch / Dynamic Island */}
      <div className="absolute top-2 w-28 h-5 bg-black rounded-full z-20 flex items-center justify-end px-3">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-800/80"></div>
      </div>

      {/* Wallpaper/Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950">
        <div className="absolute top-[-10%] left-[-20%] w-64 h-64 bg-primary/20 rounded-full filter blur-[32px] opacity-70 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-indigo-500/20 rounded-full filter blur-[32px] opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Time bar */}
      <div className="mt-8 text-white/90 font-semibold text-xs z-10 flex w-full px-6 justify-between items-center font-outfit">
        <span>9:41</span>
        <div className="flex gap-1.5 items-center">
          <div className="w-3.5 h-2 border border-white/60 rounded-xs flex items-center px-0.5">
            <div className="w-full h-1 bg-white rounded-xs"></div>
          </div>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col px-3.5 pt-8 relative z-10">
        <h3 className="text-4xl font-extralight text-white/80 mb-6 text-center font-outfit tracking-tight">9:41</h3>

        {/* Notification Card */}
        <div className="w-full bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/15 overflow-hidden transition-all duration-300">
          <div className="px-3.5 py-2 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-[11px] text-white font-black leading-none font-outfit">L</span>
              </div>
              <span className="text-[11px] font-bold text-white tracking-wide font-outfit">LASSI LOUNGE</span>
            </div>
            <span className="text-[10px] text-white/60 font-medium">now</span>
          </div>

          {imageUrl && (
            <div className="w-full h-28 bg-slate-800 overflow-hidden">
              <img src={imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
            </div>
          )}

          <div className="p-3">
            <h4 className="text-xs font-bold text-white mb-1 leading-tight font-outfit">
              {title || 'Campaign Title'}
            </h4>
            <p className="text-[11px] text-white/70 leading-snug line-clamp-3">
              {message || 'Your promotional message will appear here in the live push banner...'}
            </p>
          </div>
        </div>
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-2 w-28 h-1 bg-white/40 rounded-full z-20"></div>
    </div>
  );
};

export default function MarketingView({ restaurantId }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [audienceStats, setAudienceStats] = useState({
    totalCustomers: 0,
    pushActiveUsers: 0,
    inactive30Days: 0,
    topicBroadcast: 'all_customers (100% of App Installs)'
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    imageUrl: '',
    actionUrl: '',
    audience: 'all_customers',
  });
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingImage(true);
      const uploadData = new FormData();
      uploadData.append('images', files[0]);

      const res = await api.upload('/api/upload/multiple', uploadData);

      const uploadedImages = res.data || [];
      if (uploadedImages.length > 0) {
        setFormData(prev => ({ ...prev, imageUrl: uploadedImages[0].url }));
        showToast('success', 'Image uploaded successfully!');
      }
    } catch (err) {
      console.error('Image upload error:', err);
      showToast('error', err.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchAudienceStats();
  }, [restaurantId]);

  const fetchAudienceStats = async () => {
    try {
      const res = await marketingAPI.getAudienceStats();
      if (res.data) {
        setAudienceStats(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch audience stats:', err);
    }
  };

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await marketingAPI.getCampaigns(restaurantId ? `restaurantId=${restaurantId}` : '');
      setCampaigns(res.data || []);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
      showToast('error', 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setActionPreset = (url) => {
    setFormData((prev) => ({ ...prev, actionUrl: url }));
  };

  const handleBroadcastRequest = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      return showToast('error', 'Title and message are required');
    }
    setIsConfirmModalOpen(true);
  };

  const executeBroadcast = async () => {
    setIsConfirmModalOpen(false);

    try {
      setSending(true);
      const res = await marketingAPI.broadcastCampaign({
        ...formData,
        restaurantId,
      });
      showToast('success', res.message || 'Campaign broadcasted successfully');
      setFormData({ title: '', message: '', imageUrl: '', actionUrl: '', audience: 'all_customers' });
      fetchCampaigns();
      fetchAudienceStats();
    } catch (err) {
      console.error('Failed to broadcast:', err);
      showToast('error', err.message || 'Failed to broadcast campaign');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      {/* Page Header */}
      <PageHeaderGradient
        title="Push Notification Campaigns"
        subtitle="Compose and broadcast rich push alerts directly to your customers' mobile screens to drive flash sales and engagement."
      />

      {/* Real-time Audience Reach Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        <div className="bg-white dark:bg-admin-card border border-slate-200 dark:border-admin-border rounded-2xl p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0 border border-primary/20 shadow-2xs">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-outfit mb-0.5">
              Total Customers
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">
              {audienceStats.totalCustomers || 0}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-admin-card border border-slate-200 dark:border-admin-border rounded-2xl p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-500/20 shadow-2xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-outfit mb-0.5">
              Push-Registered
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-outfit tracking-tight">
              {audienceStats.pushActiveUsers || 0}{' '}
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Accounts</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-admin-card border border-slate-200 dark:border-admin-border rounded-2xl p-4.5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-500/20 shadow-2xs">
            <Megaphone className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-outfit mb-0.5">
              Instant Reach
            </div>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400 font-outfit mt-0.5">
              100% of App Installs (FCM Topic)
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left: Compose Form (5 cols) */}
        <div className="lg:col-span-5 bg-admin-surface rounded-2xl shadow-sm border border-admin-border p-6 lg:p-7 h-fit">
          <h3 className="text-base font-bold text-admin-text mb-5 flex items-center gap-2 font-outfit">
            <Sparkles className="w-4 h-4 text-primary" /> Compose Message
          </h3>
          <form onSubmit={handleBroadcastRequest} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1.5 font-outfit">Campaign Title *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Type className="h-4 w-4 text-admin-muted" />
                </div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Weekend Delight 20% OFF!"
                  className="w-full h-11 pl-9 pr-3.5 bg-admin-surface border border-admin-border rounded-xl text-xs text-admin-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1.5 font-outfit">Message Content *</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <AlignLeft className="h-4 w-4 text-admin-muted" />
                </div>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your promotional message here..."
                  rows={4}
                  className="w-full pl-9 pr-3.5 pt-2.5 pb-2.5 bg-admin-surface border border-admin-border rounded-xl text-xs text-admin-text outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none transition-all font-medium leading-relaxed"
                  required
                />
              </div>
            </div>

            {/* Image Upload Dropzone */}
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1.5 font-outfit">Hero Banner Image (Optional)</label>

              {!formData.imageUrl ? (
                <label className="relative flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-admin-border rounded-xl hover:bg-admin-surface-2 transition-all cursor-pointer group bg-admin-surface">
                  <div className="flex flex-col items-center justify-center pt-3 pb-3">
                    {isUploadingImage ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin mb-1.5" />
                    ) : (
                      <Upload className="w-6 h-6 text-admin-muted group-hover:text-primary transition-colors mb-1.5" />
                    )}
                    <p className="text-xs text-admin-text font-bold font-outfit">
                      {isUploadingImage ? 'Uploading...' : 'Click to upload banner'}
                    </p>
                    <p className="text-[10px] text-admin-muted mt-0.5">PNG, JPG up to 5MB</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                </label>
              ) : (
                <div className="relative w-full h-28 rounded-xl overflow-hidden border border-admin-border group">
                  <img src={formData.imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      className="bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action URL */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-admin-text font-outfit">Action URL / App Target (Optional)</label>
                <div className="flex items-center gap-1 text-[11px] text-admin-muted font-outfit">
                  <span>Presets:</span>
                  <button
                    type="button"
                    onClick={() => setActionPreset('/offers')}
                    className="text-primary hover:underline font-bold bg-primary/10 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Offers
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionPreset('/menu')}
                    className="text-primary hover:underline font-bold bg-primary/10 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Menu
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionPreset('/orders')}
                    className="text-primary hover:underline font-bold bg-primary/10 px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Orders
                  </button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-4 w-4 text-admin-muted" />
                </div>
                <input
                  type="text"
                  name="actionUrl"
                  value={formData.actionUrl}
                  onChange={handleChange}
                  placeholder="/offers, /menu or https://..."
                  className="w-full h-11 pl-9 pr-3.5 bg-admin-surface border border-admin-border rounded-xl text-xs text-admin-text outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-medium"
                />
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1.5 font-outfit">Target Audience</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Target className="h-4 w-4 text-admin-muted" />
                </div>
                <select
                  name="audience"
                  value={formData.audience}
                  onChange={handleChange}
                  className="w-full h-11 pl-9 pr-9 bg-admin-surface border border-admin-border rounded-xl text-xs text-admin-text outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer font-medium"
                >
                  <option value="all_customers">All App Users (FCM Broadcast)</option>
                  <option value="inactive_30_days">Inactive Users (30+ Days)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-admin-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full h-11 mt-3 bg-gradient-to-r from-primary to-primary-hover text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/25 hover:shadow-lg hover:brightness-105 active:scale-[0.99] disabled:opacity-50 font-outfit cursor-pointer"
            >
              {sending ? (
                <><Loader2 className="w-4 h-4 animate-spin text-white" /> Broadcasting Notification...</>
              ) : (
                <><Send className="w-4 h-4 text-white" /> Send Broadcast Now</>
              )}
            </button>
          </form>
        </div>

        {/* Middle: Live Phone Preview (3 cols) */}
        <div className="lg:col-span-3 hidden xl:flex flex-col items-center">
          <h3 className="text-base font-bold text-admin-text mb-5 flex items-center gap-2 w-full pl-2 font-outfit">
            Live Push Preview
          </h3>
          <div className="sticky top-24">
            <PhonePreview title={formData.title} message={formData.message} imageUrl={formData.imageUrl} />
          </div>
        </div>

        {/* Right: Campaign History (4 cols) */}
        <div className="lg:col-span-7 xl:col-span-4">
          <h3 className="text-base font-bold text-admin-text mb-5 flex items-center gap-2 font-outfit">
            <Calendar className="w-4 h-4 text-admin-muted" />
            Recent Broadcasts
          </h3>

          {loading ? (
            <div className="flex items-center justify-center h-40 bg-admin-surface rounded-2xl border border-admin-border">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 bg-admin-surface rounded-2xl border border-dashed border-admin-border">
              <div className="w-16 h-16 bg-admin-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Megaphone className="w-8 h-8 text-admin-muted" />
              </div>
              <h3 className="text-sm font-bold text-admin-text font-outfit">No campaigns broadcast yet</h3>
              <p className="text-admin-muted text-xs mt-1 max-w-[220px] mx-auto">Your sent push marketing campaigns will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {campaigns.map((campaign) => (
                <div key={campaign._id} className="bg-admin-surface border border-admin-border rounded-2xl p-4.5 hover:shadow-md transition-all relative overflow-hidden group">
                  {/* Status Indicator Line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    campaign.status === 'sent' ? 'bg-emerald-500' :
                    campaign.status === 'failed' ? 'bg-rose-500' :
                    'bg-amber-500'
                  }`}></div>

                  <div className="flex justify-between items-start mb-2.5 pl-2">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider border font-outfit ${
                      campaign.status === 'sent' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      campaign.status === 'failed' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {campaign.status === 'sent' && <CheckCircle2 className="w-3 h-3" />}
                      {campaign.status === 'failed' && <XCircle className="w-3 h-3" />}
                      {campaign.status.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-admin-muted">
                      <Clock className="w-3 h-3" />
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-3 pl-2">
                    {campaign.imageUrl && (
                      <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-admin-surface-2 border border-admin-border">
                        <img src={campaign.imageUrl} alt="Campaign" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-1 flex-1 min-w-0">
                      <h4 className="font-bold text-admin-text text-sm truncate font-outfit">{campaign.title}</h4>
                      <p className="text-admin-muted text-xs line-clamp-2 leading-relaxed">{campaign.message}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-admin-border flex items-center justify-between text-xs font-medium text-admin-muted pl-2">
                    <div className="flex items-center gap-1 bg-admin-surface-2 px-2.5 py-1 rounded-lg text-[11px]">
                      <Users className="w-3 h-3 text-admin-muted" />
                      {campaign.audience === 'all_customers' ? 'All App Users' : campaign.audience.replace('_', ' ')}
                    </div>
                    <div className="flex items-center gap-1 bg-admin-surface-2 px-2.5 py-1 rounded-lg text-[11px]">
                      <Send className="w-3 h-3 text-admin-muted" />
                      Delivered: <span className="text-admin-text font-bold font-outfit">{campaign.successCount || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Broadcast Campaign"
        message="Are you sure you want to broadcast this message to all selected users? This will be delivered directly to their mobile devices immediately."
        confirmText="Yes, Send Now"
        cancelText="Cancel"
        onConfirm={executeBroadcast}
        onClose={() => setIsConfirmModalOpen(false)}
        isDestructive={false}
        icon="alert"
      />
    </div>
  );
}
