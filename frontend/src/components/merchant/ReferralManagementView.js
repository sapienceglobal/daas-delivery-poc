import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Share2, Users, Gift, Ticket, DollarSign, ShieldAlert, 
  Settings, Search, CheckCircle2, Clock, XCircle, AlertTriangle, 
  Save, X, RefreshCw, Ban, ShieldCheck, Sparkles
} from 'lucide-react';
import StatCard from './StatCard';
import { referralAPI } from '@/lib/api';
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

export default function ReferralManagementView({ restaurant }) {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);

  // Settings modal
  const [showSettings, setShowSettings] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    enabled: true,
    refereeDiscountValue: 25,
    refereeMinOrder: 30,
    referrerRewardValue: 25,
    couponValidityDays: 30,
    applyWindowDays: 7,
    maxRewardsPerReferrer: 20,
    maxAppliesPerIpPerDay: 3,
    requireReferrerOrder: false,
    title: 'Refer a friend',
    description: 'Invite your friends to {restaurant}. They get ${refereeDiscount} off their first order, and you get ${referrerReward} in loyalty points once they order!',
    termsAndConditions: 'Your friend must be a new customer and enter your code within {applyWindowDays} days of signing up. The ${refereeDiscount} coupon applies to a first order of ${refereeMinOrder} or more and is valid for {couponValidityDays} days. You receive ${referrerReward} in loyalty points after your friend\'s order is delivered. Orders that are cancelled or refunded do not qualify. Self-referrals and duplicate accounts are not eligible. The restaurant may modify or end this offer at any time.'
  });

  useEffect(() => {
    setMounted(true);
    loadInitialData();
  }, []);

  useEffect(() => {
    loadReferralList();
  }, [pagination.page, statusFilter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [statsRes, settingsRes] = await Promise.all([
        referralAPI.getAdminStats(),
        referralAPI.getAdminSettings()
      ]);
      setStats(statsRes?.data || null);
      if (settingsRes?.data) {
        setSettingsForm(prev => ({ ...prev, ...settingsRes.data }));
      }
    } catch (err) {
      console.error('Failed to load referral dashboard data', err);
      showToast('Failed to load referral data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadReferralList = async () => {
    try {
      setTableLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(searchQuery ? { search: searchQuery } : {})
      }).toString();

      const res = await referralAPI.listReferrals(params);
      setReferrals(res?.data || []);
      if (res?.pagination) {
        setPagination(prev => ({ ...prev, ...res.pagination }));
      }
    } catch (err) {
      console.error('Failed to load referral records', err);
      showToast('Failed to fetch referral list', 'error');
    } finally {
      setTableLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadReferralList();
  };

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShowSettings(false);
    }, 200);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await referralAPI.updateAdminSettings(settingsForm);
      if (res?.data) {
        setSettingsForm(prev => ({ ...prev, ...res.data }));
      }
      showToast('Referral program settings updated successfully!', 'success');
      handleCloseModal();
      loadInitialData();
    } catch (err) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCancelReferral = async (id) => {
    if (!window.confirm('Cancel this unused referral coupon? The friend will not be able to redeem it.')) return;
    try {
      await referralAPI.cancelReferral(id);
      showToast('Referral coupon cancelled', 'success');
      loadReferralList();
      loadInitialData();
    } catch (err) {
      showToast(err.message || 'Failed to cancel referral', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'coupon_issued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">
            <Clock className="w-3 h-3" /> Coupon Issued
          </span>
        );
      case 'redeemed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">
            <Clock className="w-3 h-3" /> Ordered
          </span>
        );
      case 'rewarded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
            <CheckCircle2 className="w-3 h-3" /> Delivered & Rewarded
          </span>
        );
      case 'revoked':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]">
            <XCircle className="w-3 h-3" /> Revoked
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f3f4f6] text-[#4b5563] border border-[#e5e7eb]">
            Expired
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f3f4f6] text-[#4b5563] border border-[#e5e7eb]">
            {status}
          </span>
        );
    }
  };

  if (loading) return <PageLoader text="Loading Referral System..." />;

  return (
    <div className="space-y-6 pb-10">
      
      {/* Title Area */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fee2e2] flex items-center justify-center text-[#8b0000] border border-[#fca5a5]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[28px] font-bold text-[#111827]">Referral Program Management</h1>
              <p className="text-sm text-[#6b7280] mt-1">
                Configure welcome offers, referrer rewards, fraud guards &amp; track customer redemptions in real time.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#e5e7eb] text-xs">
            <span className="font-bold text-[#6b7280]">Status:</span>
            <span className={`font-bold ${settingsForm.enabled ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
              {settingsForm.enabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 bg-[#8b0000] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#7f0000] transition-colors shadow-sm"
          >
            <Settings className="w-4 h-4" /> Program Settings
          </button>
        </div>
      </div>

      {/* 6 Stat Cards Grid with Explicit Colors */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Referrals"
          value={stats?.totalReferrals || 0}
          icon={Users}
          iconBg="bg-[#eff6ff]"
          iconColor="text-[#2563eb]"
        />
        <StatCard
          title="Coupons Issued"
          value={stats?.couponIssued || 0}
          icon={Ticket}
          iconBg="bg-[#fffbeb]"
          iconColor="text-[#d97706]"
        />
        <StatCard
          title="Converted Orders"
          value={stats?.rewarded || 0}
          icon={CheckCircle2}
          iconBg="bg-[#ecfdf5]"
          iconColor="text-[#059669]"
        />
        <StatCard
          title="Discount Given"
          value={`$${(stats?.discountGiven || 0).toFixed(0)}`}
          icon={DollarSign}
          iconBg="bg-[#f3e8ff]"
          iconColor="text-[#9333ea]"
        />
        <StatCard
          title="Loyalty Points"
          value={stats?.pointsAwarded || 0}
          icon={Gift}
          iconBg="bg-[#fdf2f8]"
          iconColor="text-[#db2777]"
        />
        <StatCard
          title="Fraud Flags"
          value={stats?.flagged || 0}
          icon={ShieldAlert}
          iconBg="bg-[#fef2f2]"
          iconColor="text-[#dc2626]"
        />
      </div>

      {/* Main Ledger & Search Filter */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#f3f4f6] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#f9fafb]/50">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#111827]">Referral Records &amp; Benefit Log</h2>
            <span className="text-xs bg-[#f3f4f6] text-[#4b5563] px-2.5 py-0.5 rounded-full font-semibold border border-[#e5e7eb]">
              {pagination.total} records
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="text-xs border border-[#e5e7eb] rounded-lg px-3 py-2 bg-white text-[#1f2937] font-medium focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
            >
              <option value="">All Statuses</option>
              <option value="coupon_issued">Coupon Issued</option>
              <option value="redeemed">Order Placed</option>
              <option value="rewarded">Delivered & Rewarded</option>
              <option value="revoked">Revoked</option>
            </select>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search name, code, coupon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs border border-[#e5e7eb] rounded-lg pl-8 pr-3 py-2 bg-white text-[#1f2937] placeholder:text-[#9ca3af] focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] w-56"
              />
              <Search className="w-3.5 h-3.5 text-[#9ca3af] absolute left-2.5 top-2.5" />
            </form>

            <button
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                loadReferralList();
                loadInitialData();
              }}
              className="p-2 rounded-lg border border-[#e5e7eb] text-[#6b7280] hover:text-[#111827] hover:bg-[#f9fafb] transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f9fafb] text-[#6b7280] font-bold border-b border-[#e5e7eb] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3">Date &amp; Code</th>
                <th className="px-4 py-3">Referrer (Owner)</th>
                <th className="px-4 py-3">Invited Friend</th>
                <th className="px-4 py-3">Coupon Details</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Benefit Given</th>
                <th className="px-4 py-3">Order Info</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6] text-[#374151]">
              {tableLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6b7280]">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#8b0000]" />
                      Loading records...
                    </div>
                  </td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6b7280]">
                    No referral records found matching your filters.
                  </td>
                </tr>
              ) : (
                referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f9fafb] transition-colors">
                    <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                      <div className="font-bold text-[#111827]">{r.code}</div>
                      <div className="text-[11px] text-[#6b7280]">{new Date(r.createdAt).toLocaleDateString()}</div>
                      {r.flagged && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-[#b91c1c] font-bold mt-0.5 bg-[#fef2f2] px-1.5 py-0.5 rounded border border-[#fecaca]">
                          <AlertTriangle className="w-2.5 h-2.5" /> {r.flagReason || 'Flagged'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#111827]">{r.referrer?.name || 'N/A'}</div>
                      <div className="text-[11px] text-[#6b7280]">{r.referrer?.email || r.referrer?.phone}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-[#111827]">{r.referee?.name || 'New Customer'}</div>
                      <div className="text-[11px] text-[#6b7280]">{r.referee?.email || r.referee?.phone}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-[#111827] bg-[#f3f4f6] border border-[#e5e7eb] px-2 py-0.5 rounded text-[11px]">
                        {r.coupon?.code}
                      </span>
                      <div className="text-[11px] text-[#6b7280] mt-0.5">
                        ${r.coupon?.discount} OFF (min ${r.coupon?.minOrder})
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-[#111827]">
                        Friend: <span className="text-[#16a34a] font-bold">${r.discountGiven || r.coupon?.discount || 0}</span>
                      </div>
                      <div className="text-[11px] text-[#6b7280]">
                        Referrer: {r.rewardPoints ? `${r.rewardPoints} pts` : `$${r.rewardValue} pending`}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {r.order ? (
                        <div>
                          <div className="font-bold text-[#111827]">#{r.order.orderNumber}</div>
                          <div className="text-[11px] text-[#6b7280]">${r.order.total?.toFixed(2)}</div>
                        </div>
                      ) : (
                        <span className="text-[#9ca3af] text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {r.status === 'coupon_issued' ? (
                        <button
                          onClick={() => handleCancelReferral(r.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#dc2626] hover:text-[#991b1b] hover:bg-[#fee2e2] px-2.5 py-1 rounded transition-colors border border-[#fecaca]"
                          title="Cancel unused coupon"
                        >
                          <Ban className="w-3 h-3" /> Cancel
                        </button>
                      ) : (
                        <span className="text-[#d1d5db] text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-[#f3f4f6] flex items-center justify-between text-xs text-[#6b7280] bg-[#f9fafb]/50">
            <div>
              Page <strong className="text-[#111827]">{pagination.page}</strong> of <strong className="text-[#111827]">{pagination.totalPages}</strong>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-[#374151] font-semibold hover:bg-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 rounded-lg border border-[#e5e7eb] text-[#374151] font-semibold hover:bg-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Program Settings Modal via Portal at document.body with z-[99999] */}
      {showSettings && mounted && createPortal(
        <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm duration-200 ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`}>
          <div className={`bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#e5e7eb] overflow-hidden flex flex-col duration-200 ${isClosing ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95'}`}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#f3f4f6] flex items-center justify-between bg-[#f9fafb]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#fee2e2] flex items-center justify-center text-[#8b0000]">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#111827] text-base">Referral Program Configuration</h3>
                  <p className="text-xs text-[#6b7280]">Adjust discount values, minimum orders &amp; anti-fraud rules</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-[#e5e7eb] rounded-full transition-colors text-[#6b7280] hover:text-[#111827]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form id="referralSettingsForm" onSubmit={handleSaveSettings} className="p-6 space-y-5 overflow-y-auto max-h-[72vh] text-xs">
              
              {/* Program Enabled Card with Toggle */}
              <div className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
                <div>
                  <div className="font-bold text-[#111827] text-sm">Enable Referral Program</div>
                  <div className="text-xs text-[#6b7280] mt-0.5">Allow customers to share referral codes and claim welcome savings</div>
                </div>
                <Toggle
                  checked={settingsForm.enabled}
                  onChange={(val) => setSettingsForm(prev => ({ ...prev, enabled: val }))}
                  label="Enable Referral Program"
                />
              </div>

              {/* Discount and Reward Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#111827] text-xs mb-1.5">Friend's Discount ($ OFF)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={settingsForm.refereeDiscountValue}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, refereeDiscountValue: Number(e.target.value) }))}
                      className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white font-semibold focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9ca3af] pointer-events-none">$</span>
                  </div>
                  <span className="text-[11px] text-[#6b7280] block mt-1">Coupon value given to referee</span>
                </div>

                <div>
                  <label className="block font-bold text-[#111827] text-xs mb-1.5">Min Order Required ($)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={settingsForm.refereeMinOrder}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, refereeMinOrder: Number(e.target.value) }))}
                      className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white font-semibold focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9ca3af] pointer-events-none">$</span>
                  </div>
                  <span className="text-[11px] text-[#6b7280] block mt-1">Min cart subtotal for coupon</span>
                </div>

                <div>
                  <label className="block font-bold text-[#111827] text-xs mb-1.5">Referrer Reward ($)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={settingsForm.referrerRewardValue}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, referrerRewardValue: Number(e.target.value) }))}
                      className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white font-semibold focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#9ca3af] pointer-events-none">$</span>
                  </div>
                  <span className="text-[11px] text-[#6b7280] block mt-1">Loyalty points given on delivery</span>
                </div>
              </div>

              {/* Expiry & Eligibility Rules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#111827] text-xs mb-1.5">Coupon Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settingsForm.couponValidityDays}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, couponValidityDays: Number(e.target.value) }))}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white font-semibold focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                    required
                  />
                  <span className="text-[11px] text-[#6b7280] block mt-1">Days before friend's coupon expires</span>
                </div>

                <div>
                  <label className="block font-bold text-[#111827] text-xs mb-1.5">Code Apply Window (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={settingsForm.applyWindowDays}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, applyWindowDays: Number(e.target.value) }))}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white font-semibold focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                    required
                  />
                  <span className="text-[11px] text-[#6b7280] block mt-1">Allowed days after account signup</span>
                </div>

                <div>
                  <label className="block font-bold text-[#111827] text-xs mb-1.5">Max Rewards / Referrer</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={settingsForm.maxRewardsPerReferrer}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, maxRewardsPerReferrer: Number(e.target.value) }))}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white font-semibold focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                    required
                  />
                  <span className="text-[11px] text-[#6b7280] block mt-1">0 = unlimited rewards per user</span>
                </div>
              </div>

              {/* Anti-Farming & Eligibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#111827] text-xs mb-1.5">Max Applies / IP / Day</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settingsForm.maxAppliesPerIpPerDay}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, maxAppliesPerIpPerDay: Number(e.target.value) }))}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white font-semibold focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000]"
                    required
                  />
                  <span className="text-[11px] text-[#6b7280] block mt-1">Prevents device/network farm abuse</span>
                </div>

                <div className="flex items-center gap-2.5 pt-4">
                  <input
                    type="checkbox"
                    id="requireReferrerOrder"
                    checked={settingsForm.requireReferrerOrder}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, requireReferrerOrder: e.target.checked }))}
                    className="w-4 h-4 text-[#8b0000] rounded border-[#d1d5db] focus:ring-[#8b0000]"
                  />
                  <label htmlFor="requireReferrerOrder" className="font-bold text-[#111827] cursor-pointer">
                    Require referrer to have at least 1 delivered order
                  </label>
                </div>
              </div>

              {/* Public Text Templates */}
              <div>
                <label className="block font-bold text-[#111827] text-xs mb-1.5">Customer Description Template</label>
                <textarea
                  rows={2}
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white font-medium focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] leading-relaxed resize-none"
                  maxLength={300}
                />
                <span className="text-[11px] text-[#6b7280] block mt-1">Placeholders: &#123;restaurant&#125;, &#123;refereeDiscount&#125;, &#123;referrerReward&#125;</span>
              </div>

              <div>
                <label className="block font-bold text-[#111827] text-xs mb-1.5">Terms &amp; Conditions</label>
                <textarea
                  rows={3}
                  value={settingsForm.termsAndConditions}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                  className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#1f2937] bg-white font-medium focus:outline-none focus:border-[#8b0000] focus:ring-1 focus:ring-[#8b0000] leading-relaxed resize-none"
                  maxLength={2000}
                />
              </div>

            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#f3f4f6] flex items-center justify-end gap-3 bg-[#f9fafb] rounded-b-2xl">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-bold text-[#4b5563] hover:text-[#111827] hover:bg-[#e5e7eb] rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="referralSettingsForm"
                disabled={savingSettings}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#8b0000] rounded-lg hover:bg-[#7f0000] transition-colors shadow-sm disabled:opacity-50"
              >
                {savingSettings ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
