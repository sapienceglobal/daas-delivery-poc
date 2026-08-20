'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Ticket, CheckCircle, Percent, ChevronRight, Gift, CreditCard, Award, Utensils, Info, X, Loader2 } from 'lucide-react';
import { couponAPI, loyaltyAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

export default function CouponsTab({ user }) {
  const { isAuthenticated } = useAuth();
  const { brand } = useBrand();
  const { itemCount, subtotal, restaurant } = useCart();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchCoupons();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setSelectedCoupon(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (selectedCoupon) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedCoupon]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const [res, historyRes] = await Promise.allSettled([
        couponAPI.getActive(),
        loyaltyAPI.getStatus()
      ]);
      
      if (res.status === 'fulfilled') {
        setCoupons(res.value.data || []);
      }
      
      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load coupons', err);
      showToast('Failed to load offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('Code copied to clipboard!', 'success');
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleApplyPromo = async (e) => {
    e.preventDefault();
    if (!promoCode.trim() || isApplying) return;

    if (!itemCount || itemCount === 0) {
      showToast('Add items to cart first', 'error');
      return;
    }

    setIsApplying(true);
    try {
      await couponAPI.validate(promoCode.trim().toUpperCase(), subtotal, restaurant?._id);
      localStorage.setItem('pendingCouponCode', promoCode.trim().toUpperCase());
      showToast('Coupon applied successfully!', 'success');
      router.push('/checkout');
    } catch (err) {
      showToast(err.message || 'Invalid coupon code or does not meet criteria', 'error');
    } finally {
      setIsApplying(false);
    }
  };

  const isLoyaltyEnabled = brand?.loyaltySettings?.enabled !== false;
  const topCoupons = coupons.slice(0, 3);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#f3f4f6] p-8 min-h-[600px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7a0b10]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-[#f3f4f6] p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-[#1f2937] mb-2">Offers & Discounts</h2>
        <p className="text-[#6b7280] text-sm mb-6">Discover the best deals and promo codes for your next order.</p>

        {/* Promo Code Input */}
        <form onSubmit={handleApplyPromo} className="flex gap-2 mb-8 p-1 bg-white border border-[#e5e7eb] rounded-xl shadow-sm">
          <div className="flex-1 flex items-center px-3">
            <Ticket className="w-5 h-5 text-[#7a0b10]" />
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code"
              className="w-full h-10 px-3 outline-none bg-transparent text-[#1f2937] font-medium placeholder:font-normal placeholder-[#9ca3af]"
            />
          </div>
          <button 
            type="submit"
            disabled={isApplying || !promoCode.trim()}
            className="px-6 rounded-lg bg-[#7a0b10] text-white font-bold hover:bg-[#680307] transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[90px]"
          >
            {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Apply'}
          </button>
        </form>

        {/* Hero Banner Carousel (Top 3) */}
        {topCoupons.length > 0 && (
          <div className="mb-10">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#4A0000] to-orange-900 shadow-md border border-[#4A0000]/20 h-[220px]">
              {/* Background abstract art */}
              <div className="absolute -right-10 -bottom-10 opacity-20 pointer-events-none">
                <Utensils size={180} className="text-orange-200" />
              </div>
              
              <div className="relative z-10 p-6 md:p-8 flex flex-col justify-center h-full">
                <div className="inline-block px-2 py-1 bg-amber-400 text-[#1a1a1a] text-[10px] font-bold rounded mb-3 w-max uppercase tracking-wider">
                  Exclusive Offer
                </div>
                <h3 className="text-white text-lg font-medium mb-1">Get FLAT</h3>
                <div className="text-amber-400 text-4xl md:text-5xl font-extrabold leading-none mb-2">
                  {topCoupons[currentHeroIndex].type === 'percentage' 
                    ? `${topCoupons[currentHeroIndex].value}% OFF` 
                    : `$${topCoupons[currentHeroIndex].value} OFF`}
                </div>
                <p className="text-white/90 text-sm mb-4">
                  {topCoupons[currentHeroIndex].firstOrderOnly ? 'on your first order' : (topCoupons[currentHeroIndex].description || 'Limited time offer')}
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 border border-white/50 bg-black/20 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-black/30 transition-colors" onClick={() => handleCopyCode(topCoupons[currentHeroIndex].code)}>
                    <span className="text-white/70 text-xs">Code:</span>
                    <span className="text-white font-bold tracking-wide">{topCoupons[currentHeroIndex].code}</span>
                    <Copy className="w-3.5 h-3.5 text-white/90 ml-1" />
                  </div>
                  <span className="text-white/60 text-[10px]">Min. order ${topCoupons[currentHeroIndex].minCartValue || 0}</span>
                </div>
              </div>
            </div>
            
            {/* Carousel Indicators */}
            {topCoupons.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {topCoupons.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentHeroIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${currentHeroIndex === idx ? 'bg-[#7a0b10] w-4' : 'bg-gray-300'}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Best Offers For You */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-[#1f2937] uppercase tracking-widest mb-4">Best Offers For You</h3>
          {coupons.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-[#d1d5db] rounded-xl p-8 text-center">
              <Ticket className="w-10 h-10 text-[#9ca3af] mx-auto mb-3 opacity-50" />
              <p className="text-[#6b7280]">No offers available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map((coupon) => (
                <div key={coupon._id} className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden hover:shadow-md transition-all group flex flex-col relative">
                  <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#7a0b10]/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="p-4 flex gap-4">
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center shrink-0 border border-orange-100 shadow-sm">
                      {coupon.type === 'percentage' ? (
                        <Percent className="w-6 h-6 text-orange-600" />
                      ) : (
                        <Ticket className="w-6 h-6 text-orange-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <h4 className="font-bold text-[#1f2937] text-[15px] truncate text-[#7a0b10]">
                        {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}
                      </h4>
                      <p className="text-[#6b7280] text-xs mt-0.5 line-clamp-2">
                        {coupon.minCartValue > 0 ? `on orders above $${coupon.minCartValue}` : (coupon.description || 'Exclusive offer')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto border-t border-dashed border-[#e5e7eb] bg-gray-50/50 p-3 flex items-center justify-between">
                    <div 
                      onClick={() => handleCopyCode(coupon.code)}
                      className="border border-[#e5e7eb] border-dashed bg-white px-2.5 py-1 rounded-md flex items-center gap-2 cursor-pointer hover:bg-gray-50 hover:border-[#7a0b10] transition-colors"
                    >
                      <span className="text-xs font-bold text-[#1f2937] tracking-wider">{coupon.code}</span>
                      {copiedCode === coupon.code ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#9ca3af]" />
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedCoupon(coupon)}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#9ca3af] hover:text-[#7a0b10] transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" /> T&C Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bank Offers */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-[#1f2937] uppercase tracking-widest mb-4">Bank Offers</h3>
          <div className="bg-gray-50 border border-[#e5e7eb] rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <CreditCard className="w-12 h-12 text-[#9ca3af] opacity-50 mb-3" />
            <h4 className="font-bold text-[#1f2937] mb-1">No Bank Offers Available</h4>
            <p className="text-sm text-[#6b7280]">Check back later for exciting bank discounts.</p>
          </div>
        </div>

        {/* More Ways To Save */}
        <div>
          <h3 className="text-sm font-bold text-[#1f2937] uppercase tracking-widest mb-4">More Ways To Save</h3>
          <div className="border border-[#e5e7eb] rounded-xl overflow-hidden bg-white">
            {isLoyaltyEnabled && (
              <div 
                className="flex items-center gap-4 p-4 border-b border-[#e5e7eb] hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push('/profile?tab=loyalty', { scroll: false })}
              >
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center shrink-0 text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-[#1f2937] text-sm">Loyalty Rewards</h4>
                  <p className="text-xs text-[#6b7280]">Earn points on every order & redeem exciting rewards</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#d1d5db]" />
              </div>
            )}
            
            <div 
              className="flex items-center gap-4 p-4 border-b border-[#e5e7eb] hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => router.push('/profile?tab=refer', { scroll: false })}
            >
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0 text-blue-600">
                <Gift className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#1f2937] text-sm">Refer & Earn</h4>
                <p className="text-xs text-[#6b7280]">Invite your friends and both get $10 off</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#d1d5db]" />
            </div>

            <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center shrink-0 text-orange-600">
                <Ticket className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#1f2937] text-sm">Lassi Lounge Club</h4>
                <p className="text-xs text-[#6b7280]">Join our club & get exclusive member benefits</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#d1d5db]" />
            </div>
          </div>
        </div>

        {selectedCoupon && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedCoupon(null)}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-2xl shadow-[0_0_40px_rgba(0,0,0,0.15)] border border-[#eadfdb] overflow-visible animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-[#eadfdb] flex items-center justify-between shrink-0 bg-white rounded-t-2xl">
                <h2 className="text-[20px] font-black text-[#1a1a1a]">
                  Terms & Conditions
                </h2>
                <button onClick={() => setSelectedCoupon(null)} className="p-2 rounded-full hover:bg-gray-100 text-[#4b5563] transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="overflow-y-auto ll-soft-scroll flex-1 p-6 space-y-4">
                <div className="mb-4">
                  <p className="text-[#4b5563] text-sm font-bold">Code: <span className="font-mono font-bold text-[#e8a020]">{selectedCoupon.code}</span></p>
                </div>
                <ul className="space-y-3 text-[13px] text-[#4b5563] font-medium">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#2f8a42] shrink-0 mt-0.5" />
                    <span>{selectedCoupon.description || 'Applies to your order based on cart value.'}</span>
                  </li>
                  {selectedCoupon.minCartValue > 0 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#2f8a42] shrink-0 mt-0.5" />
                      <span>Minimum order value of <strong>${selectedCoupon.minCartValue}</strong> is required.</span>
                    </li>
                  )}
                  {selectedCoupon.firstOrderOnly && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#2f8a42] shrink-0 mt-0.5" />
                      <span>Valid for <strong>first-time orders</strong> only.</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#2f8a42] shrink-0 mt-0.5" />
                    <span>Valid for <strong>{selectedCoupon.channels?.join(', ') || 'Web & Mobile'}</strong> orders.</span>
                  </li>
                  {selectedCoupon.maxDiscount > 0 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#2f8a42] shrink-0 mt-0.5" />
                      <span>Maximum discount capped at <strong>${selectedCoupon.maxDiscount}</strong>.</span>
                    </li>
                  )}
                  {selectedCoupon.endDate && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#2f8a42] shrink-0 mt-0.5" />
                      <span>Expires on <strong>{new Date(selectedCoupon.endDate).toLocaleDateString()}</strong>.</span>
                    </li>
                  )}
                  {selectedCoupon.allowedPaymentMethods && selectedCoupon.allowedPaymentMethods.length > 0 && !selectedCoupon.allowedPaymentMethods.includes('All') && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#2f8a42] shrink-0 mt-0.5" />
                      <span>Valid only for payments via <strong>{selectedCoupon.allowedPaymentMethods.join(', ')}</strong>.</span>
                    </li>
                  )}
                  {selectedCoupon.minOrdersRequired > 0 && (
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#2f8a42] shrink-0 mt-0.5" />
                      <span>Requires a minimum of <strong>{selectedCoupon.minOrdersRequired} past orders</strong> to unlock.</span>
                    </li>
                  )}
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#2f8a42] shrink-0 mt-0.5" />
                    <span>Only one coupon can be applied per order. Not valid with other offers.</span>
                  </li>
                </ul>

                <div className="mt-6 pt-4 border-t border-[#eadfdb] flex flex-col gap-3">
                  {(() => {
                    const isFirstOrderError = selectedCoupon.firstOrderOnly && (history?.ordersCount || 0) > 0;
                    const isMinOrdersError = (selectedCoupon.minOrdersRequired || 0) > 0 && (history?.ordersCount || 0) < selectedCoupon.minOrdersRequired;

                    if (isFirstOrderError) {
                      return (
                        <div className="p-3 rounded-xl border flex items-center gap-2 text-sm font-bold bg-[#fce3e4] border-[#f5c2c4] text-[#7a0b10]">
                          <Info className="w-5 h-5 shrink-0" />
                          You are not eligible for this coupon as it is for first-time orders only.
                        </div>
                      );
                    }

                    if (isMinOrdersError) {
                      return (
                        <div className="p-3 rounded-xl border flex items-center gap-2 text-sm font-bold bg-[#fce3e4] border-[#f5c2c4] text-[#7a0b10]">
                          <Info className="w-5 h-5 shrink-0" />
                          You need at least {selectedCoupon.minOrdersRequired} past orders to use this coupon.
                        </div>
                      );
                    }

                    return (
                      <div className="p-3 rounded-xl border flex items-center gap-2 text-sm font-bold bg-[#dff4df] border-[#b7e4b7] text-[#2f8a42]">
                        <Info className="w-5 h-5 shrink-0" />
                        You are eligible to use this coupon on your next applicable order!
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
