'use client';

import React, { useEffect, useState } from 'react';
import { Gift, Copy, CheckCircle, Ticket, Coins, Award, Sparkles, UserPlus, Info, Loader2, Clock } from 'lucide-react';
import { loyaltyAPI, couponAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

const REWARDS = [
  { points: 100, off: 10, min: 50, color: 'from-[#7a0b10] to-[#5a060a]' },
  { points: 250, off: 25, min: 100, color: 'from-[#e8a020] to-[#c28416]' },
  { points: 500, off: 50, min: 150, color: 'from-[#1a1a1a] to-[#000000]' },
];

export default function LoyaltyTab({ user }) {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemingPoints, setRedeemingPoints] = useState(null);
  const [joining, setJoining] = useState(false);
  const [history, setHistory] = useState(null);
  const [myCoupons, setMyCoupons] = useState([]);
  const [publicCoupons, setPublicCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [confirmReward, setConfirmReward] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLoyaltyData();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setSelectedCoupon(null);
        setConfirmReward(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      const [historyRes, couponsRes, activeCouponsRes] = await Promise.allSettled([
        loyaltyAPI.getStatus(),
        loyaltyAPI.getMyCoupons(),
        couponAPI.getActive()
      ]);

      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value.data);
      } else {
        setHistory(null);
      }

      if (couponsRes.status === 'fulfilled') {
        setMyCoupons(couponsRes.value.data);
      }

      if (activeCouponsRes.status === 'fulfilled') {
        setPublicCoupons(activeCouponsRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load loyalty data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinProgram = async () => {
    setJoining(true);
    try {
      await loyaltyAPI.joinProgram();
      showToast('Welcome to Lassi Rewards!', 'success');
      await fetchLoyaltyData();
    } catch (err) {
      showToast(err.message || 'Failed to join program', 'error');
    } finally {
      setJoining(false);
    }
  };

  const handleRedeemClick = (reward) => {
    if (!history || history.currentBalance < reward.points) {
      showToast('Not enough points', 'warning');
      return;
    }
    setConfirmReward(reward);
  };

  const handleConfirmRedeem = async () => {
    if (!confirmReward) return;
    const reward = confirmReward;
    setConfirmReward(null);
    setRedeeming(true);
    setRedeemingPoints(reward.points);
    try {
      await loyaltyAPI.redeem(reward.points, reward.off);
      showToast('Reward redeemed successfully!', 'success');
      await fetchLoyaltyData();

      const walletEl = document.getElementById('my-wallet');
      if (walletEl) walletEl.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      showToast(err.message || 'Failed to redeem points', 'error');
    } finally {
      setRedeeming(false);
      setRedeemingPoints(null);
    }
  };

  const copyToClipboard = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      showToast('Coupon code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(null), 3000);
    } catch (err) {
      showToast('Could not copy automatically — please copy the code manually.', 'error');
    }
  };

  const renderCouponCard = (coupon, isPublic = false) => {
    const isPercentage = coupon.type === 'percentage';
    const amount = isPercentage ? `${coupon.value}%` : `$${coupon.value}`;
    const bgClass = isPublic ? 'bg-gradient-to-br from-[#fffaf5] to-[#fef2e6] border-[#fce3c8]' : 'bg-gradient-to-br from-[#fdfbfb] to-[#f5f7fa] border-[#eadfdb]';
    const accentClass = isPublic ? 'bg-[#e8a020]' : 'bg-[#7a0b10]';

    return (
      <div key={coupon._id} className={`relative flex flex-col rounded-2xl border ${bgClass} shadow-sm hover:shadow-md transition-all overflow-hidden`}>
        <div className={`h-1.5 w-full ${accentClass}`}></div>
        <div className="p-6 flex flex-col h-full">
           <div className="flex items-start justify-between mb-4">
             <div>
               {isPublic && <span className="inline-block px-2 py-1 rounded bg-white text-[#e8a020] text-[10px] font-black uppercase tracking-wider shadow-sm mb-2 border border-[#fce3c8]">Special Offer</span>}
               <h4 className="text-3xl font-black font-serif text-[#1a1a1a]">{amount} <span className="text-lg">OFF</span></h4>
             </div>
             <div className="flex items-center gap-2">
               <button
                 onClick={() => setSelectedCoupon(coupon)}
                 className="w-8 h-8 rounded-full bg-white border border-[#eadfdb] flex items-center justify-center text-[#6b7280] hover:text-[#7a0b10] hover:border-[#7a0b10] transition-colors shadow-sm"
                 title="Terms & Conditions"
               >
                 <Info className="w-4 h-4" />
               </button>
               <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${accentClass} shadow-md`}>
                 <Ticket className="w-6 h-6" />
               </div>
             </div>
           </div>
           <div className="flex-1 mb-6">
             <p className="text-[13px] text-[#4b5563] font-medium">
               {coupon.description || (coupon.minCartValue > 0 ? `Valid on orders over $${coupon.minCartValue}` : 'No minimum order required.')}
             </p>
             {coupon.endDate && (
               <p className="flex items-center gap-1 text-[11px] text-[#9ca3af] font-semibold mt-1.5">
                 <Clock className="w-3 h-3" /> Expires {new Date(coupon.endDate).toLocaleDateString()}
               </p>
             )}
           </div>
           <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#eadfdb]/50">
             <span className="font-mono font-bold text-[#1a1a1a] tracking-widest">{coupon.code}</span>
             <button
               onClick={() => copyToClipboard(coupon.code)}
               className={`flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors ${copiedCode === coupon.code ? 'bg-[#dff4df] text-[#2f8a42]' : 'bg-[#f3f4f6] text-[#4b5563] hover:bg-[#e5e7eb]'}`}
             >
               {copiedCode === coupon.code ? <><CheckCircle className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
             </button>
           </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-transparent">
        <div className="w-12 h-12 border-4 border-[#eadfdb] border-t-[#7a0b10] rounded-full animate-spin"></div>
        <p className="mt-4 text-[#6b7280] font-medium font-serif">Loading your rewards...</p>
      </div>
    );
  }

  const isMember = history?.isLoyaltyMember;
  const currentPoints = history?.currentBalance || 0;
  const tier = history?.tier || 'BRONZE';
  const nextReward = isMember ? REWARDS.find(r => r.points > currentPoints) : null;

  return (
    <div className="space-y-12 pb-12 animate-in fade-in zoom-in-95 duration-300">
      
      <div>
        <h2 className="text-[20px] sm:text-[24px] font-black text-[#1a1a1a]">Rewards & Coupons</h2>
        <p className="text-[13px] sm:text-[14px] text-[#6b7280] mt-1">Earn points with every order, redeem rewards, and manage your coupons.</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 border border-[#eadfdb] flex flex-col md:flex-row items-center justify-between gap-6">
          {isMember ? (
            <>
              <div className="text-center md:text-left flex-1">
                <p className="text-[#6b7280] text-[11px] uppercase tracking-widest font-black mb-1">Current Tier</p>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Award className="w-10 h-10 text-[#e8a020]" />
                  <h2 className="text-3xl font-black text-[#1a1a1a] font-serif uppercase">{tier} <span className="text-xl text-[#6b7280]">Member</span></h2>
                </div>
              </div>

              <div className="w-full md:w-px h-px md:h-20 bg-[#eadfdb] hidden md:block"></div>

              <div className="text-center md:text-right flex-1">
                <p className="text-[#6b7280] text-[11px] uppercase tracking-widest font-black mb-1">Available Points</p>
                <div className="flex items-center justify-center md:justify-end gap-3">
                  <h2 className="text-5xl font-black text-[#7a0b10]">{currentPoints}</h2>
                  <Coins className="w-10 h-10 text-[#e8a020]" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between w-full gap-6 text-center md:text-left">
              <div>
                <h3 className="text-2xl font-black font-serif text-[#1a1a1a] mb-2">Join Lassi Rewards Today!</h3>
                <p className="text-[#4b5563] text-sm font-medium max-w-md">
                  Start earning points on every order. {REWARDS[0].points} points = ${REWARDS[0].off} off your next order. It's completely free to join.
                </p>
              </div>
              <button
                onClick={handleJoinProgram}
                disabled={joining}
                className="bg-[#7a0b10] hover:bg-[#5a060a] text-white font-black py-4 px-8 rounded-xl shadow-md transition-transform hover:scale-105 flex items-center gap-2 whitespace-nowrap disabled:opacity-60 disabled:hover:scale-100"
              >
                {joining ? <><Loader2 className="w-5 h-5 animate-spin" /> Joining...</> : <><UserPlus className="w-5 h-5" /> Join For Free</>}
              </button>
            </div>
          )}
        </div>

        {isMember && nextReward && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-[#eadfdb]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-bold text-[#4b5563]">Progress to next reward</p>
              <p className="text-[13px] font-bold text-[#7a0b10]">{currentPoints} / {nextReward.points} pts</p>
            </div>
            <div className="h-2.5 rounded-full bg-[#f3f4f6] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#e8a020] to-[#7a0b10] transition-all duration-500"
                style={{ width: `${Math.min(100, (currentPoints / nextReward.points) * 100)}%` }}
              />
            </div>
            <p className="text-[12px] text-[#6b7280] mt-2">
              Earn <strong className="text-[#1a1a1a]">{nextReward.points - currentPoints} more points</strong> to unlock ${nextReward.off} OFF.
            </p>
          </div>
        )}
        {isMember && !nextReward && (
          <div className="bg-gradient-to-r from-[#7a0b10] to-[#5a060a] rounded-2xl shadow-sm p-5 text-center text-white">
            <p className="text-sm font-bold">🎉 You've unlocked every reward tier — redeem below anytime!</p>
          </div>
        )}
      </div>

      {publicCoupons.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-[#fdf0d5] flex items-center justify-center">
              <Sparkles className="text-[#e8a020] w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black font-serif text-[#1a1a1a]">Exclusive Offers</h3>
              <p className="text-[#6b7280] text-sm font-medium mt-1">Apply these codes at checkout to save.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {publicCoupons.map(coupon => renderCouponCard(coupon, true))}
          </div>
        </section>
      )}

      {isMember && (
        <>
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#fce3e4] flex items-center justify-center">
                <Gift className="text-[#7a0b10] w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black font-serif text-[#1a1a1a]">Redeem Points</h3>
                <p className="text-[#6b7280] text-sm font-medium mt-1">Turn your points into delicious discounts.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {REWARDS.map((reward, idx) => {
                const canAfford = currentPoints >= reward.points;
                const isRedeemingThis = redeemingPoints === reward.points;
                return (
                  <div key={idx} className={`relative bg-white rounded-2xl p-6 lg:p-8 border transition-all flex flex-col items-center text-center ${canAfford ? 'border-[#eadfdb] shadow-md hover:-translate-y-1' : 'border-[#eadfdb]/50 opacity-80'}`}>
                    <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center text-white bg-gradient-to-br shadow-sm ${reward.color}`}>
                      <Gift className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl lg:text-4xl font-black text-[#1a1a1a] font-serif mb-2">${reward.off} <span className="text-xl text-[#6b7280]">OFF</span></h3>
                    <p className="text-[#4b5563] text-sm font-medium mb-8">Valid on orders above ${reward.min}</p>

                    <div className="w-full mt-auto pt-6 border-t border-[#eadfdb] flex items-center justify-between">
                      <span className="font-black text-[#7a0b10] flex items-center gap-1.5 text-lg">
                        <Coins className="w-5 h-5 text-[#e8a020]" /> {reward.points} <span className="text-xs text-[#6b7280]">PTS</span>
                      </span>
                      <button
                        onClick={() => handleRedeemClick(reward)}
                        disabled={!canAfford || redeeming}
                        className={`px-6 py-2.5 rounded-lg font-black text-[13px] uppercase tracking-widest transition-colors whitespace-nowrap ${
                          canAfford
                            ? 'bg-[#1a1a1a] hover:bg-[#333] text-white shadow-sm'
                            : 'bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed'
                        }`}
                      >
                        {isRedeemingThis ? (
                          <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Redeeming</span>
                        ) : 'Redeem'}
                      </button>
                    </div>

                    {!canAfford && (
                      <div className="absolute top-0 right-0 -mt-3 -mr-3 text-[10px] font-black uppercase tracking-widest text-[#7a0b10] bg-[#fce3e4] border border-[#f5c2c4] px-3 py-1.5 rounded-full shadow-sm">
                        Need {reward.points - currentPoints} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section id="my-wallet" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#fdfaf5] border border-[#eadfdb] flex items-center justify-center">
                <Ticket className="text-[#1a1a1a] w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-black font-serif text-[#1a1a1a]">My Reward Wallet</h3>
                <p className="text-[#6b7280] text-sm font-medium mt-1">Your uniquely generated coupon codes.</p>
              </div>
            </div>

            {myCoupons.length === 0 ? (
              <div className="text-center py-12 lg:py-16 bg-white rounded-3xl border border-[#eadfdb] border-dashed shadow-sm">
                <Ticket className="w-16 h-16 text-[#d1d5db] mx-auto mb-4" />
                <p className="text-[#1a1a1a] text-lg font-black font-serif mb-2">Your wallet is empty</p>
                <p className="text-[#6b7280] text-sm font-medium max-w-sm mx-auto">Redeem your loyalty points above to instantly receive exclusive discount codes here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {myCoupons.map(coupon => renderCouponCard(coupon, false))}
              </div>
            )}
          </section>
        </>
      )}

      {selectedCoupon && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setSelectedCoupon(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#7a0b10] p-6 text-white text-center relative">
              <h3 className="text-2xl font-black font-serif">Terms & Conditions</h3>
              <p className="text-white/80 text-sm mt-1">Code: <span className="font-mono font-bold text-[#e8a020]">{selectedCoupon.code}</span></p>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
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
                        You need at least {selectedCoupon.minOrdersRequired} past orders to use this coupon. (You have {history?.ordersCount || 0}).
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

            <div className="p-4 bg-[#fbfaf7] border-t border-[#eadfdb] text-center">
              <button
                onClick={() => setSelectedCoupon(null)}
                className="w-full py-3 bg-[#1a1a1a] hover:bg-[#333] text-white rounded-xl font-black text-sm uppercase tracking-widest transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmReward && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setConfirmReward(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center text-white bg-gradient-to-br shadow-md ${confirmReward.color}`}>
                <Gift className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black font-serif text-[#1a1a1a] mb-2">Redeem {confirmReward.points} Points?</h3>
              <p className="text-[#6b7280] text-sm font-medium mb-7 leading-relaxed">
                You'll receive <strong className="text-[#7a0b10]">${confirmReward.off} OFF</strong> your next order over ${confirmReward.min}. Points can't be refunded once redeemed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmReward(null)}
                  className="flex-1 py-3 rounded-xl border border-[#eadfdb] text-[#4b5563] font-bold text-sm hover:bg-[#f9f9f9] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRedeem}
                  className="flex-1 py-3 rounded-xl bg-[#7a0b10] hover:bg-[#5a060a] text-white font-black text-sm transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
