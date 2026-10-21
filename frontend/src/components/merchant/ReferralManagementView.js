import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Share2, Users, Gift, Ticket, DollarSign, ShieldAlert, 
  Settings, Search, CheckCircle2, Clock, XCircle, AlertTriangle, 
  Save, X, RefreshCw, Ban, ShieldCheck, Sparkles
} from 'lucide-react';
import StatCard from './StatCard';
import PageHeaderGradient from './common/PageHeaderGradient';
import TableScrollContainer from './common/TableScrollContainer';
import { referralAPI } from '@/lib/api';
import { showToast, PageLoader } from '@/components/ui';

function Toggle({ checked, onChange, size = 'md', disabled = false, label }) {
  const dims = size === 'sm'
    ? { trackW: 38, trackH: 22, knob: 16, on: 18 }
    : { trackW: 46, trackH: 26, knob: 20, on: 22 };

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
      className={`relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-admin-border-subtle'}`}
      style={{ width: dims.trackW, height: dims.trackH }}
    >
      <span
        className="pointer-events-none inline-block rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out"
        style={{ width: dims.knob, height: dims.knob, transform: `translateX(${checked ? dims.on : 3}px)` }}
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 font-outfit">
            <Clock className="w-3 h-3" /> Coupon Issued
          </span>
        );
      case 'redeemed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20 font-outfit">
            <Clock className="w-3 h-3" /> Ordered
          </span>
        );
      case 'rewarded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-outfit">
            <CheckCircle2 className="w-3 h-3" /> Delivered & Rewarded
          </span>
        );
      case 'revoked':
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 font-outfit">
            <XCircle className="w-3 h-3" /> Revoked
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-admin-surface-2 text-admin-muted border border-admin-border font-outfit">
            Expired
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-admin-surface-2 text-admin-muted border border-admin-border font-outfit">
            {status}
          </span>
        );
    }
  };

  if (loading) return <PageLoader text="Loading Referral System..." />;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Title Area */}
      <PageHeaderGradient
        title="Referral Program Management"
        subtitle="Configure welcome offers, referrer rewards, fraud guards & track customer redemptions in real time."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-admin-surface border border-admin-border text-xs font-outfit">
              <span className="font-bold text-admin-text-secondary">Status:</span>
              <span className={`font-black flex items-center gap-1.5 ${settingsForm.enabled ? 'text-emerald-500' : 'text-rose-500'}`}>
                <span className={`w-2 h-2 rounded-full ${settingsForm.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                {settingsForm.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-primary/25 hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer font-outfit"
            >
              <Settings className="w-4 h-4 text-white" /> Program Settings
            </button>
          </div>
        }
      />

      {/* 6 Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Referrals"
          value={stats?.totalReferrals || 0}
          icon={Users}
          iconBg="bg-blue-500/10 dark:bg-blue-500/20"
          iconColor="text-blue-500"
        />
        <StatCard
          title="Coupons Issued"
          value={stats?.couponIssued || 0}
          icon={Ticket}
          iconBg="bg-amber-500/10 dark:bg-amber-500/20"
          iconColor="text-amber-500"
        />
        <StatCard
          title="Converted Orders"
          value={stats?.rewarded || 0}
          icon={CheckCircle2}
          iconBg="bg-emerald-500/10 dark:bg-emerald-500/20"
          iconColor="text-emerald-500"
        />
        <StatCard
          title="Discount Given"
          value={`$${(stats?.discountGiven || 0).toFixed(0)}`}
          icon={DollarSign}
          iconBg="bg-purple-500/10 dark:bg-purple-500/20"
          iconColor="text-purple-500"
        />
        <StatCard
          title="Loyalty Points"
          value={stats?.pointsAwarded || 0}
          icon={Gift}
          iconBg="bg-pink-500/10 dark:bg-pink-500/20"
          iconColor="text-pink-500"
        />
        <StatCard
          title="Fraud Flags"
          value={stats?.flagged || 0}
          icon={ShieldAlert}
          iconBg="bg-rose-500/10 dark:bg-rose-500/20"
          iconColor="text-rose-500"
        />
      </div>

      {/* Main Ledger & Search Filter */}
      <div className="bg-admin-surface rounded-2xl border border-admin-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-admin-border flex flex-col md:flex-row md:items-center justify-between gap-3 bg-admin-surface-2/60">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-admin-text font-outfit">Referral Records & Benefit Log</h2>
            <span className="text-xs bg-admin-surface text-admin-muted px-2.5 py-0.5 rounded-full font-bold border border-admin-border font-outfit">
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
              className="text-xs border border-admin-border rounded-xl px-3 py-2 bg-admin-surface text-admin-text font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
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
                className="text-xs border border-admin-border rounded-xl pl-8 pr-3 py-2 bg-admin-surface text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-56 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-admin-muted absolute left-2.5 top-2.5 pointer-events-none" />
            </form>

            <button
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                loadReferralList();
                loadInitialData();
              }}
              className="p-2 rounded-xl border border-admin-border bg-admin-surface text-admin-muted hover:text-admin-text hover:bg-admin-surface-2 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <TableScrollContainer>
          <table className="w-full text-left text-xs">
            <thead className="bg-admin-surface-2/60 text-admin-muted font-bold border-b border-admin-border uppercase tracking-wider text-[11px] font-outfit">
              <tr>
                <th className="px-4 py-3.5">Date & Code</th>
                <th className="px-4 py-3.5">Referrer (Owner)</th>
                <th className="px-4 py-3.5">Invited Friend</th>
                <th className="px-4 py-3.5">Coupon Details</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Benefit Given</th>
                <th className="px-4 py-3.5">Order Info</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border dark:divide-white/[0.08] text-admin-text">
              {tableLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-admin-muted">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      Loading records...
                    </div>
                  </td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-admin-muted font-semibold">
                    No referral records found matching your filters.
                  </td>
                </tr>
              ) : (
                referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-admin-surface-2/50 transition-colors">
                    <td className="px-4 py-3.5 font-medium whitespace-nowrap">
                      <div className="font-bold text-admin-text font-outfit">{r.code}</div>
                      <div className="text-[11px] text-admin-muted mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</div>
                      {r.flagged && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-500 font-bold mt-1 bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/20 font-outfit">
                          <AlertTriangle className="w-2.5 h-2.5" /> {r.flagReason || 'Flagged'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-admin-text font-outfit">{r.referrer?.name || 'N/A'}</div>
                      <div className="text-[11px] text-admin-muted">{r.referrer?.email || r.referrer?.phone}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-admin-text font-outfit">{r.referee?.name || 'New Customer'}</div>
                      <div className="text-[11px] text-admin-muted">{r.referee?.email || r.referee?.phone}</div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-admin-text bg-admin-surface-2 border border-admin-border px-2 py-0.5 rounded text-[11px]">
                        {r.coupon?.code}
                      </span>
                      <div className="text-[11px] text-admin-muted mt-1">
                        ${r.coupon?.discount} OFF (min ${r.coupon?.minOrder})
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-admin-text font-outfit">
                        Friend: <span className="text-emerald-500 font-bold">${r.discountGiven || r.coupon?.discount || 0}</span>
                      </div>
                      <div className="text-[11px] text-admin-muted">
                        Referrer: {r.rewardPoints ? `${r.rewardPoints} pts` : `$${r.rewardValue} pending`}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {r.order ? (
                        <div>
                          <div className="font-bold text-admin-text font-outfit">#{r.order.orderNumber}</div>
                          <div className="text-[11px] text-admin-muted">${r.order.total?.toFixed(2)}</div>
                        </div>
                      ) : (
                        <span className="text-admin-muted text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {r.status === 'coupon_issued' ? (
                        <button
                          onClick={() => handleCancelReferral(r.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg transition-colors border border-rose-500/20 font-outfit"
                          title="Cancel unused coupon"
                        >
                          <Ban className="w-3 h-3" /> Cancel
                        </button>
                      ) : (
                        <span className="text-admin-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableScrollContainer>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-3.5 border-t border-admin-border flex items-center justify-between text-xs text-admin-muted bg-admin-surface-2/60">
            <div>
              Page <strong className="text-admin-text font-outfit">{pagination.page}</strong> of <strong className="text-admin-text font-outfit">{pagination.totalPages}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1.5 rounded-xl border border-admin-border bg-admin-surface text-admin-text font-bold hover:bg-admin-surface-2 disabled:opacity-40 transition-colors font-outfit"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1.5 rounded-xl border border-admin-border bg-admin-surface text-admin-text font-bold hover:bg-admin-surface-2 disabled:opacity-40 transition-colors font-outfit"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Program Settings Modal via Portal at document.body with z-[99999] */}
      {showSettings && mounted && createPortal(
        <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md duration-200 ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`}>
          <div className={`bg-admin-surface rounded-2xl max-w-2xl w-full shadow-2xl border border-admin-border overflow-hidden flex flex-col duration-200 ${isClosing ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95'}`}>
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between bg-admin-surface-2/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-admin-text text-base font-outfit">Referral Program Configuration</h3>
                  <p className="text-xs text-admin-muted">Adjust discount values, minimum orders & anti-fraud rules</p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 hover:bg-admin-surface-2 rounded-xl transition-colors text-admin-muted hover:text-admin-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form id="referralSettingsForm" onSubmit={handleSaveSettings} className="p-6 space-y-5 overflow-y-auto max-h-[72vh] text-xs">
              
              {/* Program Enabled Card with Toggle */}
              <div className="flex items-center justify-between p-4 bg-admin-surface-2/60 rounded-xl border border-admin-border">
                <div>
                  <div className="font-bold text-admin-text text-sm font-outfit">Enable Referral Program</div>
                  <div className="text-xs text-admin-muted mt-0.5">Allow customers to share referral codes and claim welcome savings</div>
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
                  <label className="block font-bold text-admin-text text-xs mb-1.5 font-outfit">Friend's Discount ($ OFF)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={settingsForm.refereeDiscountValue}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, refereeDiscountValue: Number(e.target.value) }))}
                      className="w-full border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text bg-admin-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-admin-muted pointer-events-none">$</span>
                  </div>
                  <span className="text-[11px] text-admin-muted block mt-1">Coupon value given to referee</span>
                </div>

                <div>
                  <label className="block font-bold text-admin-text text-xs mb-1.5 font-outfit">Min Order Required ($)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={settingsForm.refereeMinOrder}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, refereeMinOrder: Number(e.target.value) }))}
                      className="w-full border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text bg-admin-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-admin-muted pointer-events-none">$</span>
                  </div>
                  <span className="text-[11px] text-admin-muted block mt-1">Min cart subtotal for coupon</span>
                </div>

                <div>
                  <label className="block font-bold text-admin-text text-xs mb-1.5 font-outfit">Referrer Reward ($)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={settingsForm.referrerRewardValue}
                      onChange={(e) => setSettingsForm(prev => ({ ...prev, referrerRewardValue: Number(e.target.value) }))}
                      className="w-full border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text bg-admin-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-admin-muted pointer-events-none">$</span>
                  </div>
                  <span className="text-[11px] text-admin-muted block mt-1">Loyalty points given on delivery</span>
                </div>
              </div>

              {/* Expiry & Eligibility Rules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-admin-text text-xs mb-1.5 font-outfit">Coupon Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settingsForm.couponValidityDays}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, couponValidityDays: Number(e.target.value) }))}
                    className="w-full border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text bg-admin-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                  <span className="text-[11px] text-admin-muted block mt-1">Days before friend's coupon expires</span>
                </div>

                <div>
                  <label className="block font-bold text-admin-text text-xs mb-1.5 font-outfit">Code Apply Window (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={settingsForm.applyWindowDays}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, applyWindowDays: Number(e.target.value) }))}
                    className="w-full border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text bg-admin-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                  <span className="text-[11px] text-admin-muted block mt-1">Allowed days after account signup</span>
                </div>

                <div>
                  <label className="block font-bold text-admin-text text-xs mb-1.5 font-outfit">Max Rewards / Referrer</label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={settingsForm.maxRewardsPerReferrer}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, maxRewardsPerReferrer: Number(e.target.value) }))}
                    className="w-full border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text bg-admin-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                  <span className="text-[11px] text-admin-muted block mt-1">0 = unlimited rewards per user</span>
                </div>
              </div>

              {/* Anti-Farming & Eligibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-admin-text text-xs mb-1.5 font-outfit">Max Applies / IP / Day</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={settingsForm.maxAppliesPerIpPerDay}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, maxAppliesPerIpPerDay: Number(e.target.value) }))}
                    className="w-full border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text bg-admin-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    required
                  />
                  <span className="text-[11px] text-admin-muted block mt-1">Prevents device/network farm abuse</span>
                </div>

                <div className="flex items-center gap-2.5 pt-4">
                  <input
                    type="checkbox"
                    id="requireReferrerOrder"
                    checked={settingsForm.requireReferrerOrder}
                    onChange={(e) => setSettingsForm(prev => ({ ...prev, requireReferrerOrder: e.target.checked }))}
                    className="w-4 h-4 text-primary rounded border-admin-border focus:ring-primary"
                  />
                  <label htmlFor="requireReferrerOrder" className="font-bold text-admin-text cursor-pointer font-outfit">
                    Require referrer to have at least 1 delivered order
                  </label>
                </div>
              </div>

              {/* Public Text Templates */}
              <div>
                <label className="block font-bold text-admin-text text-xs mb-1.5 font-outfit">Customer Description Template</label>
                <textarea
                  rows={2}
                  value={settingsForm.description}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text bg-admin-surface font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed resize-none"
                  maxLength={300}
                />
                <span className="text-[11px] text-admin-muted block mt-1">Placeholders: &#123;restaurant&#125;, &#123;refereeDiscount&#125;, &#123;referrerReward&#125;</span>
              </div>

              <div>
                <label className="block font-bold text-admin-text text-xs mb-1.5 font-outfit">Terms & Conditions</label>
                <textarea
                  rows={3}
                  value={settingsForm.termsAndConditions}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                  className="w-full border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text bg-admin-surface font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed resize-none"
                  maxLength={2000}
                />
              </div>

            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-admin-border flex items-center justify-end gap-3 bg-admin-surface-2/60 rounded-b-2xl">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface rounded-xl transition-colors font-outfit"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="referralSettingsForm"
                disabled={savingSettings}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-hover rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all disabled:opacity-50 font-outfit"
              >
                {savingSettings ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
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
