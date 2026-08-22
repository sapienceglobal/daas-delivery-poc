import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Crown, ArrowUpRight, ArrowDownRight, Gift, Activity, TrendingUp, Clock, FileText, Star, Settings, X, Save } from 'lucide-react';
import StatCard from './StatCard';
import { loyaltyAPI, restaurantAPI } from '@/lib/api';
import { showToast, PageLoader } from '@/components/ui';

function Toggle({ checked, onChange, size = 'md', disabled = false, label }) {
  const dims = size === 'sm'
    ? { trackW: 36, trackH: 20, knob: 16, on: 18 }
    : { trackW: 44, trackH: 24, knob: 20, on: 22 };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b0000] focus-visible:ring-offset-2 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      style={{ width: dims.trackW, height: dims.trackH, backgroundColor: checked ? '#16a34a' : '#d1d5db' }}
    >
      <span
        className="pointer-events-none inline-block rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out"
        style={{ width: dims.knob, height: dims.knob, transform: `translateX(${checked ? dims.on : 2}px)` }}
      />
    </div>
  );
}

export default function LoyaltyRewardsView({ restaurant }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [showSettings, setShowSettings] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    enabled: restaurant?.loyaltySettings?.enabled ?? true,
    pointsPerDollar: restaurant?.loyaltySettings?.pointsPerDollar ?? 1,
    centsPerPoint: restaurant?.loyaltySettings?.centsPerPoint ?? 1,
    minimumOrderMultiplier: restaurant?.loyaltySettings?.minimumOrderMultiplier ?? 3,
    termsAndConditions: restaurant?.loyaltySettings?.termsAndConditions ?? 'Earn 1 point for every $1 spent. 100 points = $1 off your next order.'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // setLoading(true);
      const res = await loyaltyAPI.getStats();
      setStats(res?.data);
    } catch (err) {
      console.error('Failed to load loyalty stats', err);
      showToast('Failed to load loyalty data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await restaurantAPI.update(restaurant._id, { loyaltySettings: form });
      showToast('Loyalty settings updated successfully', 'success');
      handleCloseModal();
    } catch (err) {
      console.error(err);
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShowSettings(false);
    }, 200);
  };

  if (loading || !stats) {
    return <PageLoader text="Loading Loyalty Rewards..." />;
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Title Area */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827]">Loyalty & Rewards</h1>
          <p className="text-sm text-[#6b7280] mt-1">Track customer engagement, points issued, and rewards redeemed.</p>
        </div>
        <div>
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-1.5 bg-[#8b0000] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#7f0000] transition-colors shadow-sm">
            <Settings className="w-4 h-4" /> Manage Program
          </button>
        </div>
      </div>

      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Members" 
          value={stats.totalMembers.toLocaleString()} 
          icon={Crown} 
          iconColor="text-[#ea580c]" 
          iconBg="bg-[#ffedd5]" 
          footer={
            <p className="text-xs font-bold text-[#16a34a] flex items-center gap-1">Active Program</p>
          }
        />
        <StatCard 
          title="Points Issued" 
          value={stats.pointsIssued.toLocaleString()} 
          icon={ArrowUpRight} 
          iconColor="text-[#16a34a]" 
          iconBg="bg-[#dcfce7]" 
          footer={
            <p className="text-xs font-bold text-[#16a34a] flex items-center gap-1">Lifetime</p>
          }
        />
        <StatCard 
          title="Points Redeemed" 
          value={stats.pointsRedeemed.toLocaleString()} 
          icon={ArrowDownRight} 
          iconColor="text-[#dc2626]" 
          iconBg="bg-[#fee2e2]" 
          footer={
            <p className="text-xs font-bold text-[#111827] flex items-center gap-1">{stats.redemptionRate}% Redemption Rate</p>
          }
        />
        <StatCard 
          title="Outstanding Points" 
          value={stats.outstandingPoints.toLocaleString()} 
          icon={Gift} 
          iconColor="text-[#9333ea]" 
          iconBg="bg-[#f3e8ff]" 
          footer={
            <p className="text-xs font-bold text-[#dc2626] flex items-center gap-1">Current Liability</p>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Col: Main Table */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#8b0000]" /> Recent Activity
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
              <input type="text" placeholder="Search by customer..." className="bg-white border border-[#e5e7eb] rounded-lg !pl-10 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#8b0000] w-64" />
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm flex flex-col overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Description</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider text-right">Points</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f9fafb]">
                  {stats.recentTransactions?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-10 text-center text-[12px] font-bold text-[#9ca3af]">No recent loyalty activity found.</td>
                    </tr>
                  ) : (
                    stats.recentTransactions?.map((txn, idx) => (
                      <tr key={txn._id || idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                           <p className="text-xs font-bold text-[#111827]">{new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</p>
                           <p className="text-xs text-[#6b7280]">{new Date(txn.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-5 py-3">
                           <p className="text-xs font-bold text-[#111827]">{txn.userId?.name || 'Unknown User'}</p>
                           <p className="text-xs text-[#6b7280]">{txn.userId?.email || ''}</p>
                        </td>
                        <td className="px-5 py-3">
                          {txn.type === 'earned' || txn.type === 'bonus' ? (
                            <span className="text-xs font-bold px-2 py-1 rounded bg-[#dcfce7] text-[#16a34a] uppercase flex items-center gap-1 w-max">
                              <ArrowUpRight className="w-3 h-3" /> {txn.type}
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-1 rounded bg-[#fee2e2] text-[#dc2626] uppercase flex items-center gap-1 w-max">
                              <ArrowDownRight className="w-3 h-3" /> {txn.type}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs text-[#374151] max-w-[200px] truncate">{txn.description}</p>
                          {txn.reward?.couponId && (
                            <p className="text-xs font-bold text-[#8b0000] mt-0.5">Coupon Generated: {txn.reward.couponId.code}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-[12px] font-black ${txn.points > 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                            {txn.points > 0 ? '+' : ''}{txn.points}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-[12px] font-bold text-[#374151]">{txn.balanceAfter}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Program Details */}
        <div className="xl:col-span-1 space-y-6 pt-9">
          
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Gift className="w-24 h-24" />
            </div>
            
            <h3 className="text-[14px] font-bold text-[#111827] mb-4 relative z-10">Current Program Rules</h3>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111827]">Order Purchases</h4>
                  <p className="text-xs text-[#6b7280]">Earn {restaurant?.loyaltySettings?.pointsPerDollar || 1} point per $1 spent on all delivered orders.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111827]">Daily Login</h4>
                  <p className="text-xs text-[#6b7280]">Earn 5 points once per day just for opening the app.</p>
                </div>
              </div>

            </div>
            
            <div className="mt-6 pt-5 border-t border-gray-100 relative z-10">
              <h3 className="text-[14px] font-bold text-[#111827] mb-3">Redemption Rules</h3>
              <div className="flex items-center justify-between p-3 bg-[#fff1f2] rounded-lg border border-[#fecdd3] mb-2">
                 <span className="text-xs font-bold text-[#9f1239] flex items-center gap-1.5"><Gift className="w-4 h-4" /> Exchange Rate</span>
                 <span className="text-[12px] font-black text-[#9f1239]">
                   100 Points = ${ (((restaurant?.loyaltySettings?.centsPerPoint || 1) * 100) / 100).toFixed(2) }
                 </span>
              </div>
              <p className="text-xs text-[#6b7280] text-center mt-3">
                {restaurant?.loyaltySettings?.termsAndConditions || 'Earn 1 point for every $1 spent.'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {showSettings && createPortal(
        <div className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 duration-200 ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`}>
          <div className={`bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col duration-200 ${isClosing ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95'}`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#f3f4f6] flex items-center justify-between bg-[#f9fafb]/50">
              <h2 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#8b0000]" />
                Loyalty Program Settings
              </h2>
              <button onClick={handleCloseModal} className="p-2 hover:bg-[#e5e7eb] rounded-full transition-colors ll-focus-ring">
                <X className="w-5 h-5 text-[#6b7280]" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
               {/* Toggle Enable */}
               <div className="flex items-center justify-between">
                 <div>
                   <label className="text-sm font-bold text-[#111827] block">Enable Loyalty Program</label>
                   <p className="text-xs text-[#6b7280] mt-0.5">Allow customers to earn and redeem points.</p>
                 </div>
                 <Toggle 
                   checked={form.enabled} 
                   onChange={(val) => setForm({ ...form, enabled: val })} 
                   label="Enable Loyalty Program"
                 />
               </div>
               
               {/* Rates Grid */}
               <div className="grid grid-cols-2 gap-5">
                 <div>
                   <label className="text-sm font-bold text-[#111827] block mb-1.5">Points Earn Rate</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={form.pointsPerDollar} 
                        onChange={e => setForm({...form, pointsPerDollar: e.target.value === '' ? '' : Number(e.target.value)})} 
                        className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] text-[#1f2937] bg-white" 
                        min="0" step="0.1"
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-wider font-bold text-[#9ca3af] pointer-events-none bg-white/80 px-1">pts / $1</span>
                    </div>
                 </div>
                 <div>
                   <label className="text-sm font-bold text-[#111827] block mb-1.5">Redemption Value</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={form.centsPerPoint} 
                        onChange={e => setForm({...form, centsPerPoint: e.target.value === '' ? '' : Number(e.target.value)})} 
                        className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] text-[#1f2937] bg-white" 
                        min="0" step="0.1"
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-wider font-bold text-[#9ca3af] pointer-events-none bg-white/80 px-1">cents / pt</span>
                    </div>
                 </div>
                </div>

               <div className="grid grid-cols-2 gap-5">
                 <div>
                   <label className="text-sm font-bold text-[#111827] block mb-1.5">Minimum Order Multiplier</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={form.minimumOrderMultiplier} 
                        onChange={e => setForm({...form, minimumOrderMultiplier: e.target.value === '' ? '' : Number(e.target.value)})} 
                        className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] text-[#1f2937] bg-white" 
                        min="1" step="0.5"
                      />
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-wider font-bold text-[#9ca3af] pointer-events-none bg-white/80 px-1">X Coupon Value</span>
                    </div>
                   <p className="text-xs text-[#6b7280] mt-1.5">E.g., if set to 3, a $5 coupon requires a $15 minimum order.</p>
                 </div>
               </div>

               {/* Mathematical Calculation Insight */}
               <div className="bg-[#eff6ff] border border-[#dbeafe] rounded-xl p-4 flex gap-3 items-start">
                 <div className="bg-[#dbeafe] p-1.5 rounded-full shrink-0">
                   <Activity className="w-4 h-4 text-[#2563eb]" />
                 </div>
                 <p className="text-[13px] text-[#1e40af] leading-relaxed font-medium">
                   <strong className="text-[#1e3a8a] font-bold block mb-0.5">Program Preview</strong> 
                   A customer spending <strong className="text-[#1e3a8a]"> $500</strong> will earn <strong className="text-[#1e3a8a]">{500 * form.pointsPerDollar} points</strong>. 
                   When redeeming, {500 * form.pointsPerDollar} points will translate to <strong className="text-[#1e3a8a]">${((500 * form.pointsPerDollar * form.centsPerPoint) / 100).toFixed(2)}</strong> off their order.
                   They will need to place a minimum order of <strong className="text-[#1e3a8a]">${(((500 * form.pointsPerDollar * form.centsPerPoint) / 100) * form.minimumOrderMultiplier).toFixed(2)}</strong> to use this coupon.
                 </p>
               </div>

               {/* Terms & Conditions */}
               <div>
                 <label className="text-sm font-bold text-[#111827] block mb-1.5">Terms and Conditions</label>
                 <textarea 
                   rows={3}
                   value={form.termsAndConditions} 
                   onChange={e => setForm({...form, termsAndConditions: e.target.value})} 
                   className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] text-[#1f2937] bg-white resize-none leading-relaxed" 
                 />
                 <p className="text-xs text-[#6b7280] mt-1.5">These rules will be displayed to customers in the mobile app and website.</p>
               </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#f3f4f6] flex items-center justify-end gap-3 bg-[#f9fafb]/50 rounded-b-2xl">
              <button onClick={handleCloseModal} className="px-4 py-2 text-sm font-bold text-[#4b5563] hover:text-[#111827] hover:bg-[#e5e7eb] rounded-lg transition-colors">Cancel</button>
              <button 
                onClick={handleSaveSettings} 
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#8b0000] rounded-lg hover:bg-[#7f0000] transition-colors shadow-sm disabled:opacity-50"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

    </div>
  );
}

// inline fallback for missing icon
function SettingsIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
