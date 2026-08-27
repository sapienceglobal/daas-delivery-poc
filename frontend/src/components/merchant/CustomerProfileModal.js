import React, { useState, useEffect } from 'react';
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
    const timer = setTimeout(() => setIsMounted(true), 10);
    return () => clearTimeout(timer);
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
      setProfileData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex justify-end bg-[#111827]/40 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isMounted && !isClosing ? 'opacity-100' : 'opacity-0'}`}
      onClick={handleClose}
    >
      <div 
        className={`w-full max-w-[600px] h-full bg-[#f8fafc] shadow-2xl flex flex-col border-l border-[#e5e7eb] transform transition-transform duration-300 ease-in-out ${isMounted && !isClosing ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="bg-white border-b border-[#e5e7eb] shrink-0 pt-6">
          <div className="flex justify-between items-start px-6 pb-6">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8B0000] to-[#5a0000] flex items-center justify-center text-2xl font-bold text-white shadow-md border-2 border-white">
                {customer.name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#111827] flex items-center gap-2">
                  {customer.name}
                  {customer.loyaltyTier && customer.loyaltyTier !== 'Bronze' && (
                    <span className="bg-[#fef3c7] px-2.5 py-0.5 rounded-full text-xs text-[#b45309] border border-[#fde68a] font-bold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-[#b45309]" /> {customer.loyaltyTier}
                    </span>
                  )}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-1.5 text-sm text-[#4b5563] font-medium">
                  <span className="flex items-center gap-1.5 bg-[#f3f4f6] px-2 py-1 rounded-md">
                    <Mail className="w-3.5 h-3.5 text-[#9ca3af]" /> {customer.email || 'No email'}
                  </span>
                  <span className="flex items-center gap-1.5 bg-[#f3f4f6] px-2 py-1 rounded-md">
                    <Phone className="w-3.5 h-3.5 text-[#9ca3af]" /> {customer.phone || 'No phone'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2 rounded-full bg-[#f3f4f6] border border-transparent hover:border-[#e5e7eb] hover:bg-white text-[#4b5563] transition-all shadow-sm"
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
                className={`pb-4 text-sm font-bold capitalize transition-all relative ${
                  activeTab === tab ? 'text-[#8B0000]' : 'text-[#6b7280] hover:text-[#111827]'
                }`}
              >
                {tab === 'overview' && '360° Overview'}
                {tab === 'orders' && 'Order History'}
                {tab === 'loyalty' && 'Loyalty & Rewards'}
                
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B0000] rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative p-6">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#f8fafc]">
              <div className="flex flex-col items-center">
                <RefreshCw className="w-8 h-8 text-[#8B0000] animate-spin mb-3" />
                <span className="text-[#4b5563] font-bold">Aggregating Profile...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-xl text-[#b91c1c] mb-6 flex items-center gap-2 font-medium">
              <X className="w-5 h-5" /> {error}
            </div>
          )}

          {!loading && !error && profileData && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
              {activeTab === 'overview' && <OverviewTab data={profileData} customer={customer} onTriggerPromo={onTriggerPromo} />}
              {activeTab === 'orders' && <OrdersTab data={profileData} />}
              {activeTab === 'loyalty' && <LoyaltyTab data={profileData} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TAB COMPONENTS ──────────────────────────────────────────────────────────

function OverviewTab({ data, customer, onTriggerPromo }) {
  const { stats, promos } = data;
  
  return (
    <div className="space-y-6">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#ecfdf5] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#059669]" />
            </div>
            <span className="text-[#4b5563] text-sm font-bold">Lifetime Value</span>
          </div>
          <div className="text-3xl font-extrabold text-[#111827] flex items-baseline gap-1">
            <span className="text-[#059669] text-xl">$</span>{(stats.totalSpent || 0).toFixed(2)}
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#eff6ff] flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-[#2563eb]" />
            </div>
            <span className="text-[#4b5563] text-sm font-bold">Total Orders</span>
          </div>
          <div className="text-3xl font-extrabold text-[#111827]">{stats.totalOrders || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#faf5ff] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#9333ea]" />
            </div>
            <span className="text-[#4b5563] text-sm font-bold">Avg Order Value</span>
          </div>
          <div className="text-3xl font-extrabold text-[#111827] flex items-baseline gap-1">
            <span className="text-[#9333ea] text-xl">$</span>{stats.aov || '0.00'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#fff7ed] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#ea580c]" />
            </div>
            <span className="text-[#4b5563] text-sm font-bold">Last Order</span>
          </div>
          <div className="text-xl font-bold text-[#111827] truncate mt-2">
            {stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric'}) : 'Never'}
          </div>
        </div>
      </div>

      {/* Preferences & Highlights */}
      <div className="bg-white p-6 rounded-2xl border border-[#e5e7eb] shadow-sm">
        <h3 className="text-base font-bold text-[#111827] mb-5 flex items-center gap-2">
          Customer Profile Details
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-[#f3f4f6]">
            <span className="text-[#6b7280] text-sm font-medium">Preferred Channel</span>
            <span className="text-[#111827] font-bold capitalize bg-[#f3f4f6] px-3 py-1.5 rounded-lg text-xs">
              {stats.preferredOrderType || 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-[#f3f4f6]">
            <span className="text-[#6b7280] text-sm font-medium">Customer Group</span>
            <span className="text-[#111827] font-bold bg-[#f3f4f6] px-3 py-1.5 rounded-lg text-xs">
              {customer.group || 'Others'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-[#f3f4f6]">
            <span className="text-[#6b7280] text-sm font-medium">Platforms Used</span>
            <div className="flex items-center gap-1.5">
              {customer.loginPlatforms?.includes('web') && (
                <span className="text-[11px] font-bold text-[#1e40af] bg-[#eff6ff] border border-[#bfdbfe] px-2 py-1 rounded-md flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" /> Web
                </span>
              )}
              {customer.loginPlatforms?.includes('app') && (
                <span className="text-[11px] font-bold text-[#166534] bg-[#f0fdf4] border border-[#bbf7d0] px-2 py-1 rounded-md flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> App
                </span>
              )}
              {!customer.loginPlatforms?.length && (
                <span className="text-[11px] font-bold text-[#6b7280] bg-[#f3f4f6] px-2 py-1 rounded-md">Unknown</span>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-[#f3f4f6]">
            <span className="text-[#6b7280] text-sm font-medium">Total Savings (Coupons)</span>
            <span className="text-[#059669] font-bold text-sm">
              ${(stats.totalSavings || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#6b7280] text-sm font-medium">Account Status</span>
            {customer.status === 'Active' ? (
              <span className="text-[#059669] font-bold text-xs bg-[#ecfdf5] px-3 py-1.5 rounded-lg">Active</span>
            ) : (
              <span className="text-[#dc2626] font-bold text-xs bg-[#fef2f2] px-3 py-1.5 rounded-lg">Inactive</span>
            )}
          </div>
        </div>
      </div>
      
      {/* Quick Action Card & Promo History */}
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-[#8B0000] to-[#5a0000] p-6 rounded-2xl shadow-lg text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Send Special Offer</h3>
            <p className="text-sm text-white/80 mb-5 px-4 font-medium leading-relaxed">
              Boost retention by sending a personalized promo code directly to this customer via Email/SMS.
            </p>
            <button onClick={onTriggerPromo} className="px-6 py-2.5 bg-white text-[#8B0000] rounded-xl font-bold transition-all shadow-md active:scale-95 hover:bg-[#f9fafb] w-full max-w-xs">
              Create Promo Code
            </button>
          </div>
        </div>

        {/* Promo History */}
        {promos && promos.length > 0 && (
          <div className="bg-white p-6 rounded-2xl border border-[#e5e7eb] shadow-sm">
            <h3 className="text-base font-bold text-[#111827] mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#8B0000]" />
              Promo History
            </h3>
            <div className="space-y-3">
              {promos.map((promo, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-[#f3f4f6] bg-[#f9fafb]">
                  <div>
                    <div className="font-bold text-[#111827] text-sm flex items-center gap-2">
                      {promo.code}
                      {promo.isActive ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#ecfdf5] text-[#059669] rounded-full uppercase tracking-wider font-bold">Active</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#f3f4f6] text-[#6b7280] rounded-full uppercase tracking-wider font-bold">Expired</span>
                      )}
                    </div>
                    <div className="text-xs text-[#6b7280] mt-1 font-medium">
                      {promo.type === 'percentage' ? `${promo.value}% OFF` : `$${promo.value} OFF`} • {new Date(promo.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#4b5563]">Max Uses: {promo.maxUses || 1}</div>
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
  const { orders } = data;

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-[#e5e7eb] shadow-sm">
        <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-[#9ca3af]" />
        </div>
        <h3 className="text-lg font-bold text-[#111827] mb-2">No Order History</h3>
        <p className="text-[#6b7280] text-sm font-medium">This customer hasn't placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order._id} className="bg-white p-5 rounded-2xl border border-[#e5e7eb] shadow-sm hover:border-[#d1d5db] transition-colors relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-[#111827] font-bold text-base flex items-center gap-2">
                Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold ${
                  order.status === 'delivered' ? 'bg-[#ecfdf5] text-[#059669] border border-[#a7f3d0]' : 
                  order.status === 'cancelled' ? 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]' :
                  'bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]'
                }`}>
                  {order.status}
                </span>
              </h4>
              <div className="flex items-center gap-4 text-xs font-bold text-[#6b7280] mt-2">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#9ca3af]" /> {new Date(order.createdAt).toLocaleString()}</span>
                <span className="flex items-center gap-1.5 capitalize"><ShoppingBag className="w-3.5 h-3.5 text-[#9ca3af]" /> {order.orderType || 'Delivery'}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-extrabold text-[#111827]">${(order.total || 0).toFixed(2)}</div>
              <div className="text-xs font-bold text-[#6b7280] mt-1 capitalize">{order.paymentMethod || 'Card'} • {order.paymentStatus || 'Paid'}</div>
            </div>
          </div>
          
          {/* Discounts & Promos */}
          {(order.couponCode || order.loyaltyPointsUsed > 0 || (order.discount || 0) > 0) && (
            <div className="bg-[#f8fafc] rounded-xl p-3 mb-4 border border-[#e5e7eb] flex flex-wrap gap-4 items-center">
              {order.couponCode && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#059669]">
                  <Tag className="w-3.5 h-3.5" /> Code: {order.couponCode}
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#059669]">
                  <TrendingUp className="w-3.5 h-3.5" /> Saved ${(order.discount).toFixed(2)}
                </div>
              )}
              {order.loyaltyPointsUsed > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#ea580c]">
                  <Gift className="w-3.5 h-3.5" /> Used {order.loyaltyPointsUsed} Pts
                </div>
              )}
            </div>
          )}
          
          {/* Items */}
          {order.items && order.items.length > 0 && (
            <div className="bg-[#f9fafb] rounded-xl p-4 border border-[#f3f4f6]">
              <div className="text-xs text-[#6b7280] mb-3 font-bold uppercase tracking-wider">Order Summary</div>
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col text-sm border-b border-[#e5e7eb] last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <span className="bg-white border border-[#e5e7eb] text-[#374151] w-6 h-6 flex items-center justify-center rounded font-bold shrink-0">{item.quantity}x</span>
                        <span className="text-[#111827] font-bold">{typeof item.name === 'object' ? item.name.name : item.name} {item.selectedSize && <span className="text-[#6b7280] text-xs font-medium">({typeof item.selectedSize === 'object' ? item.selectedSize.name : item.selectedSize})</span>}</span>
                      </div>
                      <span className="text-[#111827] font-bold shrink-0">${(item.lineTotal || 0).toFixed(2)}</span>
                    </div>
                    {item.addOns && item.addOns.length > 0 && (
                      <div className="ml-9 mt-1.5 text-xs font-medium text-[#6b7280] space-y-1">
                        {item.addOns.map((addon, i) => (
                          <div key={i} className="flex justify-between">
                            <span>+ {typeof addon.name === 'object' ? addon.name.name : addon.name}</span>
                            <span>+${(addon.price || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Address */}
          {order.orderType === 'delivery' && order.address && (
             <div className="mt-4 flex gap-3 items-start text-sm bg-[#eff6ff] p-4 rounded-xl border border-[#bfdbfe]">
               <MapPin className="w-4 h-4 mt-0.5 text-[#2563eb] flex-shrink-0" />
               <div>
                 <div className="font-bold text-[#1e40af] mb-1">Delivery Address</div>
                 <div className="text-[#1e3a8a] font-medium leading-relaxed">{order.address}</div>
               </div>
             </div>
          )}
        </div>
      ))}
    </div>
  );
}

function LoyaltyTab({ data }) {
  const { loyalty } = data;
  
  return (
    <div className="space-y-6">
      {/* Loyalty Card Header */}
      <div className="bg-gradient-to-r from-[#111827] to-[#1f2937] p-8 rounded-2xl border border-[#374151] flex justify-between items-center relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
        <div className="relative z-10">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Available Balance</h3>
          <div className="text-5xl font-extrabold text-white flex items-center gap-3">
            {loyalty.points || 0} <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
          </div>
        </div>
        <div className="text-right relative z-10">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Current Tier</h3>
          <div className="text-3xl font-extrabold bg-gradient-to-r from-yellow-500 to-yellow-200 text-transparent bg-clip-text">
            {loyalty.tier || 'Bronze'}
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6">
        <h3 className="text-base font-bold text-[#111827] mb-5">Points History</h3>
        {(!loyalty.history || loyalty.history.length === 0) ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-[#9ca3af]" />
            </div>
            <h3 className="text-[#111827] font-bold mb-1">No Activity Yet</h3>
            <p className="text-[#6b7280] text-sm font-medium">This customer hasn't earned or redeemed any points.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loyalty.history.map((tx, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-[#f8fafc] rounded-xl border border-[#e5e7eb] hover:border-[#d1d5db] transition-colors">
                <div>
                  <div className="text-[#111827] font-bold text-sm">{tx.description}</div>
                  <div className="text-xs font-bold text-[#6b7280] flex items-center gap-1.5 mt-1.5">
                    <Calendar className="w-3 h-3 text-[#9ca3af]" /> {new Date(tx.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className={`text-base font-extrabold px-3 py-1.5 rounded-lg ${tx.points > 0 ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#fef2f2] text-[#dc2626]'}`}>
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
