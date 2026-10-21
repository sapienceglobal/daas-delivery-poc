import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Crown, ArrowUpRight, ArrowDownRight, Gift, Activity, TrendingUp, Clock, FileText, Star, Settings, X, Save, Sparkles, ShieldCheck } from 'lucide-react';
import StatCard from './StatCard';
import PageHeaderGradient from './common/PageHeaderGradient';
import TableScrollContainer from './common/TableScrollContainer';
import { loyaltyAPI, restaurantAPI } from '@/lib/api';
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

export default function LoyaltyRewardsView({ restaurant }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const filteredTxns = (stats.recentTransactions || []).filter(txn => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = txn.userId?.name?.toLowerCase() || '';
    const email = txn.userId?.email?.toLowerCase() || '';
    const desc = txn.description?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || desc.includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Title Area */}
      <PageHeaderGradient
        title="Loyalty & Rewards"
        subtitle="Track customer loyalty members, point generation rates, and redemption transactions."
        actions={
          <button 
            onClick={() => setShowSettings(true)} 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-hover text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-primary/25 hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer font-outfit"
          >
            <Settings className="w-4 h-4 text-white" /> Manage Program
          </button>
        }
      />

      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Members" 
          value={stats.totalMembers.toLocaleString()} 
          icon={Crown} 
          iconColor="text-amber-500" 
          iconBg="bg-amber-500/10 dark:bg-amber-500/20" 
          footer={
            <span className="text-xs font-bold text-emerald-500 flex items-center gap-1 font-outfit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Program
            </span>
          }
        />
        <StatCard 
          title="Points Issued" 
          value={stats.pointsIssued.toLocaleString()} 
          icon={ArrowUpRight} 
          iconColor="text-emerald-500" 
          iconBg="bg-emerald-500/10 dark:bg-emerald-500/20" 
          footer={
            <span className="text-xs font-bold text-admin-muted font-outfit">Lifetime Issued</span>
          }
        />
        <StatCard 
          title="Points Redeemed" 
          value={stats.pointsRedeemed.toLocaleString()} 
          icon={ArrowDownRight} 
          iconColor="text-rose-500" 
          iconBg="bg-rose-500/10 dark:bg-rose-500/20" 
          footer={
            <span className="text-xs font-bold text-admin-text font-outfit">{stats.redemptionRate}% Redemption Rate</span>
          }
        />
        <StatCard 
          title="Outstanding Points" 
          value={stats.outstandingPoints.toLocaleString()} 
          icon={Gift} 
          iconColor="text-purple-500" 
          iconBg="bg-purple-500/10 dark:bg-purple-500/20" 
          footer={
            <span className="text-xs font-bold text-rose-500 font-outfit">Current Liability</span>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Col: Main Table */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-admin-text flex items-center gap-2 font-outfit">
              <Activity className="w-4 h-4 text-primary" /> Recent Points Activity
            </h3>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-muted pointer-events-none" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by customer..." 
                className="bg-admin-surface border border-admin-border rounded-xl pl-10 pr-4 py-2 text-sm text-admin-text placeholder:text-admin-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-64 transition-all" 
              />
            </div>
          </div>

          <TableScrollContainer className="bg-admin-surface border border-admin-border rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-admin-border bg-admin-surface-2/60">
                  <th className="px-5 py-3.5 text-xs font-extrabold text-admin-muted uppercase tracking-wider font-outfit">Date & Time</th>
                  <th className="px-5 py-3.5 text-xs font-extrabold text-admin-muted uppercase tracking-wider font-outfit">Customer</th>
                  <th className="px-5 py-3.5 text-xs font-extrabold text-admin-muted uppercase tracking-wider font-outfit">Action</th>
                  <th className="px-5 py-3.5 text-xs font-extrabold text-admin-muted uppercase tracking-wider font-outfit">Description</th>
                  <th className="px-5 py-3.5 text-xs font-extrabold text-admin-muted uppercase tracking-wider text-right font-outfit">Points</th>
                  <th className="px-5 py-3.5 text-xs font-extrabold text-admin-muted uppercase tracking-wider text-right font-outfit">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border dark:divide-white/[0.08]">
                {filteredTxns.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-sm font-semibold text-admin-muted">
                      No loyalty activity found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTxns.map((txn, idx) => (
                    <tr key={txn._id || idx} className="hover:bg-admin-surface-2/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-bold text-admin-text font-outfit">{new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}</p>
                        <p className="text-[11px] text-admin-muted mt-0.5">{new Date(txn.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-bold text-admin-text font-outfit">{txn.userId?.name || 'Guest User'}</p>
                        <p className="text-[11px] text-admin-muted">{txn.userId?.email || ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {txn.type === 'earned' || txn.type === 'bonus' ? (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase flex items-center gap-1 w-max font-outfit">
                            <ArrowUpRight className="w-3 h-3" /> {txn.type}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 border border-rose-500/20 uppercase flex items-center gap-1 w-max font-outfit">
                            <ArrowDownRight className="w-3 h-3" /> {txn.type}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs text-admin-text max-w-[220px] truncate">{txn.description}</p>
                        {txn.reward?.couponId && (
                          <p className="text-[11px] font-bold text-primary mt-0.5">Coupon: {txn.reward.couponId.code}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-xs font-black font-outfit ${txn.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {txn.points > 0 ? '+' : ''}{txn.points}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="text-xs font-bold text-admin-text font-outfit">{txn.balanceAfter} pts</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </TableScrollContainer>
        </div>

        {/* Right Col: Program Details */}
        <div className="xl:col-span-1 space-y-6 pt-0 xl:pt-10">
          
          <div className="bg-admin-surface border border-admin-border rounded-2xl shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 dark:opacity-10 pointer-events-none text-admin-text">
              <Gift className="w-24 h-24" />
            </div>
            
            <h3 className="text-sm font-bold text-admin-text mb-4 relative z-10 flex items-center gap-2 font-outfit">
              <ShieldCheck className="w-4 h-4 text-primary" /> Active Program Rules
            </h3>
            
            <div className="space-y-3 relative z-10">
              <div className="flex items-start gap-3 p-3 bg-admin-surface-2 rounded-xl border border-admin-border/60">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-admin-text font-outfit">Order Purchases</h4>
                  <p className="text-[11px] text-admin-muted mt-0.5">Earn {restaurant?.loyaltySettings?.pointsPerDollar || 1} point per $1 spent on all delivered orders.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-admin-surface-2 rounded-xl border border-admin-border/60">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-admin-text font-outfit">Daily App Open</h4>
                  <p className="text-[11px] text-admin-muted mt-0.5">Earn 5 bonus points once per day just for opening the app.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-5 pt-4 border-t border-admin-border relative z-10">
              <h4 className="text-xs font-bold text-admin-text mb-3 font-outfit">Redemption Rules</h4>
              <div className="flex items-center justify-between p-3 bg-rose-500/10 dark:bg-rose-500/20 rounded-xl border border-rose-500/20 mb-3">
                 <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-outfit">
                   <Gift className="w-4 h-4" /> Exchange Rate
                 </span>
                 <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-outfit">
                   100 Points = ${ (((restaurant?.loyaltySettings?.centsPerPoint || 1) * 100) / 100).toFixed(2) }
                 </span>
              </div>
              <p className="text-[11px] text-admin-muted text-center leading-relaxed">
                {restaurant?.loyaltySettings?.termsAndConditions || 'Earn 1 point for every $1 spent. Minimum redemption tiers apply.'}
              </p>
            </div>
          </div>

        </div>
      </div>

      {showSettings && createPortal(
        <div className={`fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 duration-200 ${isClosing ? 'animate-out fade-out' : 'animate-in fade-in'}`}>
          <div className={`bg-admin-surface border border-admin-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col duration-200 ${isClosing ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95'}`}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between bg-admin-surface-2/60">
              <h2 className="text-base font-bold text-admin-text flex items-center gap-2 font-outfit">
                <Settings className="w-5 h-5 text-primary" />
                Loyalty Program Settings
              </h2>
              <button onClick={handleCloseModal} className="p-1.5 hover:bg-admin-surface-2 rounded-xl text-admin-muted hover:text-admin-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
               {/* Toggle Enable */}
               <div className="flex items-center justify-between p-3.5 bg-admin-surface-2/50 rounded-xl border border-admin-border/50">
                 <div>
                   <label className="text-sm font-bold text-admin-text block font-outfit">Enable Loyalty Program</label>
                   <p className="text-xs text-admin-muted mt-0.5">Allow customers to earn and redeem points.</p>
                 </div>
                 <Toggle 
                   checked={form.enabled} 
                   onChange={(val) => setForm({ ...form, enabled: val })} 
                   label="Enable Loyalty Program"
                 />
               </div>
               
               {/* Rates Grid */}
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-admin-text block mb-1.5 font-outfit">Points Earn Rate</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={form.pointsPerDollar} 
                        onChange={e => setForm({...form, pointsPerDollar: e.target.value === '' ? '' : Number(e.target.value)})} 
                        className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                        min="0" step="0.1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider font-bold text-admin-muted pointer-events-none bg-admin-surface px-1">pts / $1</span>
                    </div>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-admin-text block mb-1.5 font-outfit">Redemption Value</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={form.centsPerPoint} 
                        onChange={e => setForm({...form, centsPerPoint: e.target.value === '' ? '' : Number(e.target.value)})} 
                        className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                        min="0" step="0.1"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider font-bold text-admin-muted pointer-events-none bg-admin-surface px-1">¢ / pt</span>
                    </div>
                 </div>
                </div>

               <div className="grid grid-cols-1 gap-4">
                 <div>
                   <label className="text-xs font-bold text-admin-text block mb-1.5 font-outfit">Minimum Order Multiplier</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={form.minimumOrderMultiplier} 
                        onChange={e => setForm({...form, minimumOrderMultiplier: e.target.value === '' ? '' : Number(e.target.value)})} 
                        className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2 text-sm text-admin-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                        min="1" step="0.5"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider font-bold text-admin-muted pointer-events-none bg-admin-surface px-1">X Coupon Value</span>
                    </div>
                   <p className="text-[11px] text-admin-muted mt-1.5">E.g., if set to 3, a $5 coupon requires a $15 minimum order.</p>
                 </div>
               </div>

               {/* Mathematical Calculation Insight */}
               <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                 <div className="bg-blue-500/20 p-1.5 rounded-lg shrink-0">
                   <Activity className="w-4 h-4 text-blue-500" />
                 </div>
                 <div className="text-xs text-admin-text leading-relaxed">
                   <strong className="text-blue-500 font-bold block mb-1 font-outfit">Live Simulation</strong> 
                   A customer spending <strong>$500</strong> earns <strong>{500 * (form.pointsPerDollar || 1)} points</strong>. 
                   Redeeming gives <strong>${((500 * (form.pointsPerDollar || 1) * (form.centsPerPoint || 1)) / 100).toFixed(2)}</strong> off, requiring a minimum order of <strong>${(((500 * (form.pointsPerDollar || 1) * (form.centsPerPoint || 1)) / 100) * (form.minimumOrderMultiplier || 1)).toFixed(2)}</strong>.
                 </div>
               </div>

               {/* Terms & Conditions */}
               <div>
                 <label className="text-xs font-bold text-admin-text block mb-1.5 font-outfit">Terms and Conditions</label>
                 <textarea 
                   rows={3}
                   value={form.termsAndConditions} 
                   onChange={e => setForm({...form, termsAndConditions: e.target.value})} 
                   className="w-full bg-admin-surface border border-admin-border rounded-xl px-3.5 py-2.5 text-xs text-admin-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none leading-relaxed" 
                 />
                 <p className="text-[11px] text-admin-muted mt-1">Displayed to customers in their mobile apps and rewards dashboard.</p>
               </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-admin-border flex items-center justify-end gap-3 bg-admin-surface-2/60 rounded-b-2xl">
              <button 
                onClick={handleCloseModal} 
                className="px-4 py-2 text-xs font-bold text-admin-muted hover:text-admin-text hover:bg-admin-surface rounded-xl transition-colors font-outfit"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveSettings} 
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-primary to-primary-hover rounded-xl shadow-md shadow-primary/20 hover:shadow-lg transition-all disabled:opacity-50 font-outfit"
              >
                {saving ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
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
