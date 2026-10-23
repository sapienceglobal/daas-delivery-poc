import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingBag, Star, Mail, Phone, Calendar, Clock, MapPin, Gift, TrendingUp, RefreshCw, ChevronRight, MessageSquare, Tag, Globe, Smartphone } from 'lucide-react';
import { crmAPI } from '@/lib/api';

export default function CustomerProfileModal({ customer, restaurantId, onClose, onTriggerPromo }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (customer?._id && restaurantId) {
      fetchProfileData();
    }
  }, [customer, restaurantId]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await crmAPI.getCustomerProfile(restaurantId, customer._id);
      const payload = res?.data?.stats ? res.data : (res?.data?.data || res?.data || res);
      setProfileData(payload);
    } catch (err) {
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (!customer || !isMounted || typeof document === 'undefined') return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[9999] flex justify-end bg-black/70 backdrop-blur-md transition-opacity duration-300 ease-in-out ${isMounted && !isClosing ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`w-full max-w-[620px] h-full bg-admin-surface shadow-2xl flex flex-col border-l border-admin-border transform transition-transform duration-300 ease-in-out text-admin-text ${isMounted && !isClosing ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="bg-admin-surface border-b border-admin-border shrink-0 pt-6">
          <div className="flex justify-between items-start px-6 pb-6">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand to-rose-400 flex items-center justify-center text-2xl font-bold text-white shadow-lg border border-white/20 shrink-0">
                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div className="min-w-0">
                <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-admin-text flex items-center gap-2 truncate">
                  <span className="truncate">{customer.name}</span>
                  {customer.loyaltyTier && customer.loyaltyTier !== 'Bronze' && (
                    <span className="bg-amber-500/15 px-2.5 py-0.5 rounded-full text-xs text-amber-500 border border-amber-500/30 font-bold flex items-center gap-1 shrink-0">
                      <Star className="w-3 h-3 fill-amber-500" /> {customer.loyaltyTier}
                    </span>
                  )}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1.5 text-xs text-admin-text-secondary font-medium">
                  <span className="flex items-center gap-1.5 bg-admin-surface-light px-2.5 py-1 rounded-lg border border-admin-border truncate">
                    <Mail className="w-3.5 h-3.5 text-admin-text-muted shrink-0" /> <span className="truncate">{customer.email || 'No email'}</span>
                  </span>
                  <span className="flex items-center gap-1.5 bg-admin-surface-light px-2.5 py-1 rounded-lg border border-admin-border shrink-0">
                    <Phone className="w-3.5 h-3.5 text-admin-text-muted" /> {customer.phone || 'No phone'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2 rounded-full bg-admin-surface-light border border-admin-border hover:bg-admin-surface-hover text-admin-text-secondary hover:text-admin-text transition-all cursor-pointer shrink-0"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center px-6 gap-6 relative">
            {['overview', 'orders', 'loyalty'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3.5 text-xs sm:text-sm font-bold capitalize transition-all relative cursor-pointer ${
                  activeTab === tab ? 'text-brand' : 'text-admin-text-muted hover:text-admin-text'
                }`}
              >
                {tab === 'overview' && '360° Overview'}
                {tab === 'orders' && 'Order History'}
                {tab === 'loyalty' && 'Loyalty & Rewards'}
                
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-t-full shadow-[0_0_8px_rgba(205,19,27,0.5)]" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative p-6 bg-admin-bg">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-admin-bg/80 backdrop-blur-xs">
              <div className="flex flex-col items-center">
                <RefreshCw className="w-8 h-8 text-brand animate-spin mb-3" />
                <span className="text-admin-text-secondary font-semibold text-sm">Aggregating Profile...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 mb-6 flex items-center gap-2 font-medium text-xs">
              <X className="w-4 h-4" /> {error}
            </div>
          )}

          {!loading && !error && profileData && (
            <div className="animate-fadeIn space-y-6 pb-12">
              {activeTab === 'overview' && <OverviewTab data={profileData} customer={customer} onTriggerPromo={onTriggerPromo} />}
              {activeTab === 'orders' && <OrdersTab data={profileData} />}
              {activeTab === 'loyalty' && <LoyaltyTab data={profileData} />}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── TAB COMPONENTS ──────────────────────────────────────────────────────────

function OverviewTab({ data, customer, onTriggerPromo }) {
  const stats = data?.stats || {};
  const promos = data?.promos || [];
  
  return (
    <div className="space-y-6">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-admin-card p-4 sm:p-5 rounded-2xl border border-admin-border shadow-sm group">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-admin-text-secondary text-xs font-semibold">Lifetime Value</span>
          </div>
          <div className="font-heading text-2xl font-extrabold text-admin-text">
            ${Number(stats.totalSpent || 0).toFixed(2)}
          </div>
        </div>
        
        <div className="bg-admin-card p-4 sm:p-5 rounded-2xl border border-admin-border shadow-sm group">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-admin-text-secondary text-xs font-semibold">Total Orders</span>
          </div>
          <div className="font-heading text-2xl font-extrabold text-admin-text">{stats.totalOrders || 0}</div>
        </div>

        <div className="bg-admin-card p-4 sm:p-5 rounded-2xl border border-admin-border shadow-sm group">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
            <span className="text-admin-text-secondary text-xs font-semibold">Avg Order Value</span>
          </div>
          <div className="font-heading text-2xl font-extrabold text-admin-text">${stats.aov || '0.00'}</div>
        </div>

        <div className="bg-admin-card p-4 sm:p-5 rounded-2xl border border-admin-border shadow-sm group">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-admin-text-secondary text-xs font-semibold">Last Order</span>
          </div>
          <div className="font-heading text-base font-bold text-admin-text truncate mt-1">
            {stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'}) : 'Never'}
          </div>
        </div>
      </div>

      {/* Preferences & Highlights */}
      <div className="bg-admin-card p-5 sm:p-6 rounded-2xl border border-admin-border shadow-sm">
        <h3 className="font-heading text-sm font-bold text-admin-text mb-4 uppercase tracking-wider">
          Profile Attributes
        </h3>
        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between items-center pb-3 border-b border-admin-border">
            <span className="text-admin-text-secondary font-medium">Preferred Channel</span>
            <span className="text-admin-text font-bold capitalize bg-admin-surface-light border border-admin-border px-2.5 py-1 rounded-lg">
              {stats.preferredOrderType || 'Delivery'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-admin-border">
            <span className="text-admin-text-secondary font-medium">Customer Group</span>
            <span className="text-admin-text font-bold bg-admin-surface-light border border-admin-border px-2.5 py-1 rounded-lg">
              {customer?.group || 'General'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-admin-border">
            <span className="text-admin-text-secondary font-medium">Platforms Used</span>
            <div className="flex items-center gap-1.5">
              {customer?.loginPlatforms?.includes('web') && (
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Web
                </span>
              )}
              {customer?.loginPlatforms?.includes('app') && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> Mobile App
                </span>
              )}
              {!customer?.loginPlatforms?.length && (
                <span className="text-[10px] text-admin-text-muted bg-admin-surface-light px-2 py-0.5 rounded-md">Direct</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-admin-border">
            <span className="text-admin-text-secondary font-medium">Total Savings (Coupons)</span>
            <span className="text-emerald-500 font-bold font-mono text-sm">
              ${Number(stats.totalSavings || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-admin-text-secondary font-medium">Account Status</span>
            {customer?.status === 'Active' ? (
              <span className="text-emerald-500 font-bold text-xs bg-emerald-500/15 border border-emerald-500/25 px-2.5 py-1 rounded-lg">Active</span>
            ) : (
              <span className="text-rose-500 font-bold text-xs bg-rose-500/15 border border-rose-500/25 px-2.5 py-1 rounded-lg">Inactive</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Action Card & Promo History */}
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-[#210F24] via-[#161022] to-[#0F101B] border border-brand/40 p-6 rounded-2xl shadow-xl text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-11 h-11 bg-brand/20 border border-brand/40 text-brand rounded-2xl flex items-center justify-center mb-3 shadow-md">
              <Gift className="w-5 h-5" />
            </div>
            <h3 className="font-heading text-base font-bold text-white mb-1.5">Personalized Special Offer</h3>
            <p className="text-xs text-slate-300 mb-4 px-4 font-normal leading-relaxed">
              Boost customer retention by issuing a targeted promo coupon code directly to this account.
            </p>
            <button
              type="button"
              onClick={onTriggerPromo}
              className="px-6 py-2.5 bg-brand text-white rounded-xl text-xs font-bold transition-all shadow-md hover:brightness-110 active:scale-95 cursor-pointer w-full max-w-xs"
            >
              Generate Promo Code
            </button>
          </div>
        </div>

        {/* Promo History */}
        {promos && promos.length > 0 && (
          <div className="bg-admin-card p-5 rounded-2xl border border-admin-border shadow-sm">
            <h3 className="font-heading text-xs font-bold text-admin-text uppercase tracking-wider mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand" />
              Promo History
            </h3>
            <div className="space-y-2.5">
              {promos.map((promo, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-admin-border bg-admin-surface-light/40">
                  <div>
                    <div className="font-mono font-bold text-admin-text text-xs flex items-center gap-2">
                      {promo.code}
                      {promo.isActive ? (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 rounded-full uppercase tracking-wider font-bold">Active</span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-500/15 text-slate-400 border border-slate-500/25 rounded-full uppercase tracking-wider font-bold">Expired</span>
                      )}
                    </div>
                    <div className="text-[11px] text-admin-text-muted mt-1 font-medium">
                      {promo.type === 'percentage' ? `${promo.value}% OFF` : `$${promo.value} OFF`} • {promo.createdAt ? new Date(promo.createdAt).toLocaleDateString() : 'Recent'}
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-bold text-admin-text-secondary">
                    Max Uses: {promo.maxUses || 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrdersTab({ data }) {
  const orders = data?.orders || [];

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16 bg-admin-card rounded-2xl border border-admin-border shadow-sm">
        <div className="w-14 h-14 bg-admin-surface-light rounded-full flex items-center justify-center mx-auto mb-3">
          <ShoppingBag className="w-7 h-7 text-admin-text-muted" />
        </div>
        <h3 className="text-sm font-bold text-admin-text mb-1">No Order History</h3>
        <p className="text-admin-text-muted text-xs font-medium">This customer hasn't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {orders.map((order) => (
        <div key={order._id || Math.random()} className="bg-admin-card p-4 sm:p-5 rounded-2xl border border-admin-border shadow-sm hover:border-brand/40 transition-colors relative overflow-hidden group">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h4 className="text-admin-text font-bold text-sm flex items-center gap-2">
                Order #{order.orderNumber || (order._id ? String(order._id).slice(-6).toUpperCase() : 'N/A')}
                <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                  order.status === 'delivered' || order.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/25' : 
                  order.status === 'cancelled' ? 'bg-rose-500/15 text-rose-500 border border-rose-500/25' :
                  'bg-blue-500/15 text-blue-500 border border-blue-500/25'
                }`}>
                  {order.status}
                </span>
              </h4>
              <div className="flex items-center gap-3 text-xs font-medium text-admin-text-muted mt-1.5">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Recent'}</span>
                <span className="capitalize">{order.orderType || 'Delivery'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-heading text-lg font-black text-admin-text">${Number(order.total || 0).toFixed(2)}</div>
              <div className="text-[10px] font-bold text-admin-text-muted mt-0.5 capitalize">{order.paymentMethod || 'Card'} • {order.paymentStatus || 'Paid'}</div>
            </div>
          </div>
          
          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="bg-admin-surface-light/40 rounded-xl p-3 border border-admin-border text-xs space-y-2 mt-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs border-b border-admin-border last:border-0 pb-1.5 last:pb-0">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono text-[10px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded">{item.quantity}x</span>
                    <span className="text-admin-text font-medium truncate">{typeof item.name === 'object' ? item.name?.name : item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-admin-text shrink-0">${Number(item.lineTotal || (item.price * item.quantity) || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LoyaltyTab({ data }) {
  const loyalty = data?.loyalty || {};
  
  return (
    <div className="space-y-6">
      {/* Loyalty Card Header */}
      <div className="bg-gradient-to-r from-[#210F24] via-[#161022] to-[#0F101B] p-6 sm:p-8 rounded-2xl border border-brand/40 flex justify-between items-center relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Points Balance</h3>
          <div className="font-heading text-4xl sm:text-5xl font-black text-white flex items-center gap-2.5">
            {loyalty.points || 0} <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
          </div>
        </div>
        <div className="text-right relative z-10">
          <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Tier Status</h3>
          <div className="font-heading text-2xl sm:text-3xl font-extrabold text-amber-400">
            {loyalty.tier || 'Bronze'}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-admin-card rounded-2xl border border-admin-border shadow-sm p-5 sm:p-6">
        <h3 className="font-heading text-xs font-bold text-admin-text uppercase tracking-wider mb-4">
          Points Activity
        </h3>
        {(!loyalty.history || loyalty.history.length === 0) ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-admin-surface-light rounded-full flex items-center justify-center mx-auto mb-2 text-admin-text-muted">
              <Star className="w-6 h-6" />
            </div>
            <p className="text-xs text-admin-text-muted">No points earned or redeemed yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {loyalty.history.map((tx, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-admin-surface-light/40 rounded-xl border border-admin-border text-xs">
                <div>
                  <div className="text-admin-text font-bold text-xs">{tx.description}</div>
                  <div className="text-[10px] text-admin-text-muted flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3 h-3" /> {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Recent'}
                  </div>
                </div>
                <div className={`text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg ${
                  tx.points > 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                }`}>
                  {tx.points > 0 ? '+' : ''}{tx.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
