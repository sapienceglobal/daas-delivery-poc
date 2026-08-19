'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Send, Clock, Users, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { marketingAPI } from '@/lib/api';
import { showToast, ConfirmModal } from '@/components/ui';

export default function MarketingView({ restaurantId }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    imageUrl: '',
    audience: 'all_customers',
  });

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
      setFormData({ title: '', message: '', imageUrl: '', audience: 'all_customers' });
      fetchCampaigns();
    } catch (err) {
      console.error('Failed to broadcast:', err);
      showToast('error', err.message || 'Failed to broadcast campaign');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-[24px] font-bold text-[#1f2937] flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-[#7a0b10]" />
          Push Notification Campaigns
        </h2>
        <p className="text-[#6b7280] mt-1">Broadcast marketing messages to your customers' mobile devices.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-[#f3f4f6] p-6 h-fit">
          <h3 className="text-[18px] font-bold text-[#1f2937] mb-4">Compose Message</h3>
          <form onSubmit={handleBroadcastRequest} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Campaign Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Weekend Special!"
                className="w-full h-11 px-4 rounded-xl border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#7a0b10]/20 focus:border-[#7a0b10] text-[#1f2937] bg-white placeholder-[#9ca3af]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Message *</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Type your promotional message here..."
                rows={4}
                className="w-full p-4 rounded-xl border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#7a0b10]/20 focus:border-[#7a0b10] text-[#1f2937] bg-white placeholder-[#9ca3af] resize-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Image URL (Optional)</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full h-11 px-4 rounded-xl border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#7a0b10]/20 focus:border-[#7a0b10] text-[#1f2937] bg-white placeholder-[#9ca3af]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1">Target Audience</label>
              <select
                name="audience"
                value={formData.audience}
                onChange={handleChange}
                className="w-full h-11 px-4 rounded-xl border border-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-[#7a0b10]/20 focus:border-[#7a0b10] text-[#1f2937] bg-white"
              >
                <option value="all_customers">All App Users</option>
                <option value="inactive_30_days">Inactive Users (30+ Days)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full h-12 mt-4 bg-[#7a0b10] hover:bg-[#6a090e] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            >
              {sending ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Broadcasting...</>
              ) : (
                <><Send className="w-5 h-5" /> Send Broadcast</>
              )}
            </button>
          </form>
        </div>

        {/* Campaign History */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-[#f3f4f6] p-6">
          <h3 className="text-[18px] font-bold text-[#1f2937] mb-4">Past Campaigns</h3>
          
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-[#7a0b10]" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 bg-[#f9fafb] rounded-xl border border-dashed border-[#e5e7eb]">
              <Megaphone className="w-12 h-12 text-[#d1d5db] mx-auto mb-3" />
              <h3 className="text-[#1f2937] font-bold">No campaigns yet</h3>
              <p className="text-[#6b7280] text-sm mt-1">Your sent marketing campaigns will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign._id} className="border border-[#f3f4f6] rounded-xl p-4 hover:border-[#e5e7eb] transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-bold text-[#1f2937] text-[16px]">{campaign.title}</h4>
                      <p className="text-[#4b5563] text-sm">{campaign.message}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[12px] font-bold flex items-center gap-1.5 ${
                      campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
                      campaign.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {campaign.status === 'sent' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {campaign.status === 'failed' && <XCircle className="w-3.5 h-3.5" />}
                      {campaign.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-4 text-[13px] text-[#6b7280]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {new Date(campaign.createdAt).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      Audience: {campaign.audience.replace('_', ' ')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Send className="w-4 h-4" />
                      Sent: {campaign.successCount}
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
