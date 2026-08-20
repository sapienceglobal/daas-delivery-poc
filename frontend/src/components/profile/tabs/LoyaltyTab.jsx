'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Gift, Coins, Award, UserPlus, Info, Loader2, Copy, CheckCircle, Ticket, Lock, ShoppingBag, Calendar, Star, Users, ArrowUpRight, ArrowDownLeft, Receipt, X } from 'lucide-react';
import { loyaltyAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';

export default function LoyaltyTab({ user }) {
  const { isAuthenticated } = useAuth();
  const { brand } = useBrand();
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemingPoints, setRedeemingPoints] = useState(null);
  const [joining, setJoining] = useState(false);
  const [history, setHistory] = useState(null);
  const [myCoupons, setMyCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [confirmReward, setConfirmReward] = useState(null);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchLoyaltyData();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setConfirmReward(null);
        setShowRulesModal(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (confirmReward || showRulesModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [confirmReward, showRulesModal]);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    try {
      const [historyRes, couponsRes] = await Promise.allSettled([
        loyaltyAPI.getStatus(),
        loyaltyAPI.getMyCoupons()
      ]);

      if (historyRes.status === 'fulfilled') {
        setHistory(historyRes.value.data);
      } else {
        setHistory(null);
      }

      if (couponsRes.status === 'fulfilled') {
        setMyCoupons(couponsRes.value.data || []);
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

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast('Coupon code copied!', 'success');
    setTimeout(() => setCopiedCode(null), 2000);
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
  const centsPerPoint = brand?.loyaltySettings?.centsPerPoint ?? 1;
  const minMultiplier = brand?.loyaltySettings?.minimumOrderMultiplier ?? 3;
  const dynamicRewards = [
    { points: 100, off: (100 * centsPerPoint) / 100, min: ((100 * centsPerPoint) / 100) * minMultiplier, color: 'from-[#7a0b10] to-[#5a060a]' },
    { points: 250, off: (250 * centsPerPoint) / 100, min: ((250 * centsPerPoint) / 100) * minMultiplier, color: 'from-[#e8a020] to-[#c28416]' },
    { points: 500, off: (500 * centsPerPoint) / 100, min: ((500 * centsPerPoint) / 100) * minMultiplier, color: 'from-[#1a1a1a] to-[#000000]' },
  ];
  const nextReward = isMember ? dynamicRewards.find(r => r.points > currentPoints) : null;

  return (
    <div className="space-y-12 pb-12">
      
      <div>
        <h2 className="text-[20px] sm:text-[24px] font-black text-[#1a1a1a]">Loyalty Rewards</h2>
        <p className="text-[13px] sm:text-[14px] text-[#6b7280] mt-1">Earn points with every order and redeem exciting rewards.</p>
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
                <div className="flex items-center justify-center md:justify-end gap-1 mb-1">
                  <p className="text-[#6b7280] text-[11px] uppercase tracking-widest font-black">Available Points</p>
                  <button onClick={() => setShowRulesModal(true)} className="text-[#9ca3af] hover:text-[#7a0b10] transition-colors p-1.5 -m-1.5 rounded-full hover:bg-gray-100">
                    <Info className="w-4 h-4" />
                  </button>
                </div>
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
                  Start earning points on every order. {dynamicRewards[0].points} points = ${dynamicRewards[0].off} off your next order. It's completely free to join.
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

      

      {isMember && (
        <>
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#fce3e4] flex items-center justify-center">
                <Gift className="text-[#7a0b10] w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-black font-serif text-[#1a1a1a]">Redeem Points</h3>
                  <button onClick={() => setShowRulesModal(true)} className="text-[#9ca3af] hover:text-[#7a0b10] transition-colors p-1 rounded-full hover:bg-gray-100" title="View Program Rules">
                    <Info className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[#6b7280] text-sm font-medium mt-1">Turn your points into delicious discounts.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dynamicRewards.map((reward, i) => {
              const canRedeem = currentPoints >= reward.points;
                const isRedeemingThis = redeemingPoints === reward.points;
                return (
                  <div key={i} className={`relative bg-white rounded-2xl p-6 lg:p-8 border transition-all flex flex-col items-center text-center ${canRedeem ? 'border-[#eadfdb] shadow-md hover:-translate-y-1' : 'border-[#eadfdb]/50 opacity-80'}`}>
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
                        disabled={!canRedeem || redeeming}
                        className={`px-6 py-2.5 rounded-lg font-black text-[13px] uppercase tracking-widest transition-colors whitespace-nowrap ${
                          canRedeem
                            ? 'bg-[#1a1a1a] hover:bg-[#333] text-white shadow-sm'
                            : 'bg-[#f3f4f6] text-[#9ca3af] cursor-not-allowed'
                        }`}
                      >
                        {isRedeemingThis ? (
                          <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Redeeming</span>
                        ) : 'Redeem'}
                      </button>
                    </div>

                    {!canRedeem && (
                      <div className="absolute top-0 right-0 -mt-3 -mr-3 text-[10px] font-black uppercase tracking-widest text-[#7a0b10] bg-[#fce3e4] border border-[#f5c2c4] px-3 py-1.5 rounded-full shadow-sm">
                        Need {reward.points - currentPoints} more
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* My Coupons Section */}
          {myCoupons.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#fbfaf7] flex items-center justify-center border border-[#eadfdb]">
                  <Ticket className="text-[#1a1a1a] w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black font-serif text-[#1a1a1a]">My Coupons</h3>
                  <p className="text-[#6b7280] text-sm font-medium mt-1">Coupons generated from your loyalty points.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myCoupons.map((coupon) => {
                  const isLocked = coupon.status === 'used';
                  const isApplied = false; // Logic for applied can be linked to global state if needed
                  
                  return (
                    <div key={coupon._id} className="relative bg-[#1a1a1a] rounded-xl overflow-hidden shadow-md border border-[#333]">
                      <div className="p-5 flex flex-col justify-between h-full relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="text-white text-2xl font-black">${coupon.value} OFF</h4>
                          {isApplied ? (
                            <span className="bg-white/20 px-2 py-1 rounded text-white text-[10px] font-bold">Applied ✓</span>
                          ) : isLocked ? (
                            <Lock className="w-5 h-5 text-white/50" />
                          ) : (
                            <Ticket className="w-6 h-6 text-white/60" />
                          )}
                        </div>
                        
                        <div className="bg-white/10 rounded-lg py-2 px-3 inline-block w-max mb-3 border border-white/10">
                          <span className="text-white font-bold tracking-widest text-sm">{coupon.code}</span>
                        </div>
                        
                        <div className="text-white/60 text-xs mb-4">
                          {isLocked ? 'Used — order placed' : 'Available for your next order'}
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => !isLocked && handleCopyCode(coupon.code)}
                            disabled={isLocked}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 ${isLocked ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-white/20 text-white hover:bg-white/30 transition-colors'}`}
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy
                          </button>
                        </div>
                      </div>
                      
                      {/* Decorative background element */}
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* How to Earn */}
          <section className="mt-12">
            <h3 className="text-xl font-black font-serif text-[#1a1a1a] mb-6">How to Earn</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#eadfdb] rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-[#7a0b10]" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1a1a1a] text-sm">Order Food</h4>
                  <p className="text-xs text-[#6b7280] mt-1 mb-2">Earn {brand?.loyaltySettings?.centsPerPoint || 1} points for every $1 spent</p>
                </div>
              </div>
              
              <div className="bg-white border border-[#eadfdb] rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-[#7a0b10]" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1a1a1a] text-sm">Daily Login Bonus</h4>
                  <p className="text-xs text-[#6b7280] mt-1 mb-2">Download our app to claim 5 free points daily!</p>
                </div>
              </div>
              
              <div className="bg-white border border-[#eadfdb] rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Star className="w-5 h-5 text-[#7a0b10]" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1a1a1a] text-sm">Write a Review</h4>
                  <p className="text-xs text-[#6b7280] mt-1 mb-2">Review a delivered order — earn 20 points</p>
                </div>
              </div>
              
              <div className="bg-white border border-[#eadfdb] rounded-xl p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-[#7a0b10]" />
                </div>
                <div>
                  <h4 className="font-bold text-[#1a1a1a] text-sm">Refer a Friend</h4>
                  <p className="text-xs text-[#6b7280] mt-1 mb-2">Invite friends to earn 100 points per referral</p>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="mt-12">
            <h3 className="text-xl font-black font-serif text-[#1a1a1a] mb-6">Recent Activity</h3>
            <div className="bg-white border border-[#eadfdb] rounded-xl overflow-hidden">
              {history?.transactions && history.transactions.length > 0 ? (
                <div className="divide-y divide-[#eadfdb]">
                  {history.transactions.slice(0, 5).map((t, idx) => {
                    const isEarned = (t.points || t.amount || 0) > 0;
                    return (
                      <div key={idx} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isEarned ? 'bg-green-50' : 'bg-blue-50'}`}>
                          {isEarned ? <ArrowDownLeft className="w-5 h-5 text-green-600" /> : <ArrowUpRight className="w-5 h-5 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[#1a1a1a] text-sm">{t.title || t.description || 'Activity'}</h4>
                          <p className="text-xs text-[#6b7280] mt-0.5">{new Date(t.createdAt).toLocaleDateString()} • {t.desc || ''}</p>
                        </div>
                        <div className={`font-black text-sm ${isEarned ? 'text-green-600' : 'text-red-600'}`}>
                          {isEarned ? '+' : ''}{t.points || t.amount} PTS
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Receipt className="w-10 h-10 text-[#d1d5db] mx-auto mb-3" />
                  <p className="text-[#6b7280] font-medium text-sm">No recent activity yet.</p>
                </div>
              )}
            </div>
          </section>

        </>
      )}



      {confirmReward && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setConfirmReward(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-[0_0_40px_rgba(0,0,0,0.15)] border border-[#eadfdb] overflow-visible animate-in fade-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#eadfdb] flex items-center justify-between shrink-0 bg-white rounded-t-2xl">
              <h2 className="text-[20px] font-black text-[#1a1a1a]">
                Confirm Redemption
              </h2>
              <button onClick={() => setConfirmReward(null)} className="p-2 rounded-full hover:bg-gray-100 text-[#4b5563] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
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
        </div>,
        document.body
      )}
      {showRulesModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowRulesModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-[0_0_40px_rgba(0,0,0,0.15)] border border-[#eadfdb] overflow-visible animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-[#eadfdb] flex items-center justify-between shrink-0 bg-white rounded-t-2xl">
              <h2 className="text-[20px] font-black text-[#1a1a1a] flex items-center gap-2">
                <Info className="w-5 h-5 text-[#7a0b10]" /> Program Rules
              </h2>
              <button onClick={() => setShowRulesModal(false)} className="p-2 rounded-full hover:bg-gray-100 text-[#4b5563] transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto ll-soft-scroll flex-1 p-6">
              <div className="text-[13px] text-[#4b5563]">
                <p className="font-medium text-[#1f2937] mb-4">{brand?.loyaltySettings?.termsAndConditions}</p>
                <ul className="space-y-3 mb-6 list-none p-0">
                  <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7a0b10] mt-2 shrink-0" />Points have no cash value and cannot be exchanged for cash.</li>
                  <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7a0b10] mt-2 shrink-0" />Coupons must meet the minimum order requirement to be applied.</li>
                  <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#7a0b10] mt-2 shrink-0" />Only one coupon can be used per order.</li>
                </ul>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex gap-3">
                  <Info className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-orange-800 font-medium leading-relaxed m-0">
                    <strong>Note:</strong> We reserve the right to modify the loyalty rules, point values, or minimum order multipliers at any time. However, any previously redeemed coupons will remain valid according to the terms active when they were claimed!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
