'use client';

import { useState, useEffect } from 'react';
import {
  Megaphone, Send, Clock, Users, CheckCircle2, XCircle,
  Loader2, Upload, Link as LinkIcon, Type, AlignLeft, Target, Trash2, Calendar
} from 'lucide-react';
import { marketingAPI, api } from '@/lib/api';
import { showToast, ConfirmModal } from '@/components/ui';

const PhonePreview = ({ title, message, imageUrl }) => {
  return (
    <div className="relative mx-auto w-[280px] h-[550px] bg-black rounded-2xl shadow-2xl overflow-hidden flex flex-col items-center shrink-0 border-[6px] border-black">
      {/* Notch */}
      <div className="absolute top-0 w-32 h-6 bg-black rounded-b-xl z-20"></div>

      {/* Wallpaper/Background */}
      <div className="absolute inset-0 bg-gray-50">
        {/* Abstract shapes for wallpaper effect using primary/secondary colors */}
        <div className="absolute top-[-10%] left-[-20%] w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-[32px] opacity-70 animate-pulse"></div>
        <div className="absolute top-[20%] right-[-10%] w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-[32px] opacity-70 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-20%] left-[10%] w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-[32px] opacity-70 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Time bar */}
      <div className="mt-6 text-[#1f2937] font-semibold text-xs z-10 flex w-full px-6 justify-between items-center">
        <span>9:41</span>
        <div className="flex gap-1 items-center">
          <div className="w-3 h-2 bg-[#1f2937] rounded-sm opacity-80"></div>
          <div className="w-3 h-3 bg-[#1f2937] rounded-full opacity-80"></div>
        </div>
      </div>

      <div className="w-full flex-1 flex flex-col px-4 pt-10 relative z-10">
        <h3 className="text-4xl font-light text-[#1f2937] opacity-80 mb-6 text-center">9:41</h3>

        {/* Notification Card */}
        <div className="w-full bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-[#e5e7eb] overflow-hidden transition-all duration-300">
          <div className="px-3 py-2 flex items-center justify-between border-b border-[#e5e7eb]/50">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-[#7a0b10] rounded flex items-center justify-center shadow-sm">
                <span className="text-xs text-white font-bold leading-none">L</span>
              </div>
              <span className="text-xs font-semibold text-[#1f2937] tracking-wide">LASSI LOUNGE</span>
            </div>
            <span className="text-xs text-[#9ca3af] font-medium">now</span>
          </div>

          {imageUrl && (
            <div className="w-full h-32 bg-gray-50 overflow-hidden">
              <img src={imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
            </div>
          )}

          <div className="p-3">
            <h4 className="text-sm font-bold text-[#1f2937] mb-1 leading-tight">
              {title || 'Campaign Title'}
            </h4>
            <p className="text-xs text-[#6b7280] leading-snug line-clamp-3">
              {message || 'Your promotional message will appear here...'}
            </p>
          </div>
        </div>
      </div>

      {/* Home Indicator */}
      <div className="absolute bottom-2 w-24 h-1 bg-[#1f2937] opacity-30 rounded-full z-20"></div>
    </div>
  );
};

export default function MarketingView({ restaurantId }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
  }, [restaurantId]);

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
    } catch (err) {
      console.error('Failed to broadcast:', err);
      showToast('error', err.message || 'Failed to broadcast campaign');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12">
      <div className="bg-[#f9fafb] -mx-4 sm:-mx-8 px-4 sm:px-8 py-8 border-b border-[#e5e7eb]">
        <h2 className="text-3xl font-bold text-[#1f2937] flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center border border-[#e5e7eb]">
            <Megaphone className="w-6 h-6 text-[#7a0b10]" />
          </div>
          Push Notification Campaigns
        </h2>
        <p className="text-[#6b7280] mt-2 text-lg max-w-2xl">Create and broadcast beautiful marketing messages directly to your customers' mobile devices to drive engagement and sales.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">

        {/* Left: Compose Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-[#e5e7eb] p-6 lg:p-8 h-fit">
          <h3 className="text-xl font-bold text-[#1f2937] mb-6 flex items-center gap-2">
            Compose Message
          </h3>
          <form onSubmit={handleBroadcastRequest} className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-[#1f2937] mb-1">Campaign Title *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Type className="h-5 w-5 text-[#9ca3af]" />
                </div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g. Weekend Special!"
                  className="w-full h-12 pl-10 pr-4 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#1f2937] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  required
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-bold text-[#1f2937] mb-1">Message *</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <AlignLeft className="h-5 w-5 text-[#9ca3af]" />
                </div>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your promotional message here..."
                  rows={4}
                  className="w-full pl-10 pr-4 pt-3 pb-3 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#1f2937] outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                  required
                />
              </div>
            </div>

            {/* Image Upload Dropzone */}
            <div>
              <label className="block text-sm font-bold text-[#1f2937] mb-1">Hero Image (Optional)</label>

              {!formData.imageUrl ? (
                <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#e5e7eb] rounded-xl hover:bg-gray-50 transition-all cursor-pointer group bg-white">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploadingImage ? (
                      <Loader2 className="w-8 h-8 text-[#7a0b10] animate-spin mb-2" />
                    ) : (
                      <Upload className="w-8 h-8 text-[#9ca3af] group-hover:text-[#7a0b10] transition-colors mb-2" />
                    )}
                    <p className="text-sm text-[#6b7280] font-medium">
                      {isUploadingImage ? 'Uploading...' : 'Click to upload image'}
                    </p>
                    <p className="text-xs text-[#9ca3af] mt-1">PNG, JPG up to 5MB</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                </label>
              ) : (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-[#e5e7eb] group">
                  <img src={formData.imageUrl} alt="Uploaded" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                      className="bg-[#dc2626] hover:bg-opacity-90 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action URL */}
            <div>
              <label className="block text-sm font-bold text-[#1f2937] mb-1">Action URL / Deep Link (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-[#9ca3af]" />
                </div>
                <input
                  type="text"
                  name="actionUrl"
                  value={formData.actionUrl}
                  onChange={handleChange}
                  placeholder="/category/specials or https://..."
                  className="w-full h-12 pl-10 pr-4 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#1f2937] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Target Audience */}
            <div>
              <label className="block text-sm font-bold text-[#1f2937] mb-1">Target Audience</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Target className="h-5 w-5 text-[#9ca3af]" />
                </div>
                <select
                  name="audience"
                  value={formData.audience}
                  onChange={handleChange}
                  className="w-full h-12 pl-10 pr-10 bg-white border border-[#e5e7eb] rounded-lg text-sm text-[#1f2937] outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="all_customers">All App Users</option>
                  <option value="inactive_30_days">Inactive Users (30+ Days)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#9ca3af]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full h-12 mt-4 bg-[#7a0b10] text-white rounded-lg font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-md"
            >
              {sending ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Broadcasting...</>
              ) : (
                <><Send className="w-5 h-5" /> Send Broadcast Now</>
              )}
            </button>
          </form>
        </div>

        {/* Middle: Live Preview (3 cols) */}
        <div className="lg:col-span-3 hidden xl:flex flex-col items-center">
          <h3 className="text-xl font-bold text-[#1f2937] mb-6 flex items-center gap-2 w-full pl-4">
            Live Preview
          </h3>
          <div className="sticky top-24">
            <PhonePreview title={formData.title} message={formData.message} imageUrl={formData.imageUrl} />
          </div>
        </div>

        {/* Right: Campaign History (4 cols) */}
        <div className="lg:col-span-7 xl:col-span-4">
          <h3 className="text-xl font-bold text-[#1f2937] mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#9ca3af]" />
            Recent Broadcasts
          </h3>

          {loading ? (
            <div className="flex items-center justify-center h-40 bg-white rounded-2xl border border-[#e5e7eb]">
              <Loader2 className="w-8 h-8 animate-spin text-[#7a0b10]" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#e5e7eb]">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Megaphone className="w-10 h-10 text-[#9ca3af]" />
              </div>
              <h3 className="text-lg font-bold text-[#1f2937]">No campaigns yet</h3>
              <p className="text-[#6b7280] text-sm mt-1 max-w-[200px] mx-auto">Your sent marketing campaigns will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign._id} className="bg-white border border-[#e5e7eb] rounded-xl p-5 hover:shadow-md transition-all group relative overflow-hidden">
                  {/* Status Indicator Line */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${campaign.status === 'sent' ? 'bg-[#16a34a]' :
                      campaign.status === 'failed' ? 'bg-[#dc2626]' :
                        'bg-[#ca8a04]'
                    }`}></div>

                  <div className="flex justify-between items-start mb-3 pl-2">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide border ${campaign.status === 'sent' ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' :
                        campaign.status === 'failed' ? 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]' :
                          'bg-[#fefce8] text-[#ca8a04] border-[#fef08a]'
                      }`}>
                      {campaign.status === 'sent' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {campaign.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                      {campaign.status.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9ca3af]">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex gap-4 pl-2">
                    {campaign.imageUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-50 border border-[#e5e7eb]">
                        <img src={campaign.imageUrl} alt="Campaign" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <h4 className="font-bold text-[#1f2937] text-base truncate">{campaign.title}</h4>
                      <p className="text-[#6b7280] text-sm line-clamp-2 leading-relaxed">{campaign.message}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#e5e7eb] flex items-center justify-between text-sm font-medium text-[#6b7280] pl-2">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-md">
                      <Users className="w-4 h-4 text-[#9ca3af]" />
                      {campaign.audience === 'all_customers' ? 'All Users' : campaign.audience.replace('_', ' ')}
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-md">
                      <Send className="w-4 h-4 text-[#9ca3af]" />
                      Sent: <span className="text-[#1f2937] font-bold">{campaign.successCount || 0}</span>
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
        message="Are you sure you want to broadcast this message to all selected users? This cannot be undone and will be sent immediately."
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
