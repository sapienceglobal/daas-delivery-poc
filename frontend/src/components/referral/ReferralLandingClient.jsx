'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Gift, Copy, Check, ArrowRight, Sparkles, ShoppingBag, 
  Tag, ShieldCheck, Heart, Award, Utensils, CheckCircle2,
  AlertCircle, Loader2, Star
} from 'lucide-react';
import { referralAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/components/ui';

export default function ReferralLandingClient({ referralCode }) {
  const code = (referralCode || '').trim().toUpperCase();
  const { user, isAuthenticated } = useAuth();

  const [copied, setCopied] = useState(false);
  const [program, setProgram] = useState(null);
  const [loadingProgram, setLoadingProgram] = useState(true);

  // Apply state for logged-in users
  const [isApplying, setIsApplying] = useState(false);
  const [applyResult, setApplyResult] = useState(null);
  const [applyError, setApplyError] = useState('');

  // Persist code into localStorage and cookie immediately
  useEffect(() => {
    if (code && typeof window !== 'undefined') {
      try {
        localStorage.setItem('pending_referral_code', code);
        document.cookie = `pending_referral_code=${encodeURIComponent(code)}; path=/; max-age=2592000; SameSite=Lax`;
      } catch (e) {
        console.error('Failed to store referral code', e);
      }
    }
  }, [code]);

  // Fetch dynamic program configuration
  useEffect(() => {
    async function loadProgram() {
      try {
        setLoadingProgram(true);
        const res = await referralAPI.getProgram();
        if (res?.data) {
          setProgram(res.data);
        }
      } catch (err) {
        console.error('Failed to load referral program', err);
      } finally {
        setLoadingProgram(false);
      }
    }
    loadProgram();
  }, []);

  const discountValue = program?.refereeDiscountValue ?? 25;
  const minOrderValue = program?.refereeMinOrder ?? 30;
  const referrerReward = program?.referrerRewardValue ?? 25;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      showToast('Referral code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      showToast(code, 'info');
    }
  };

  const handleApplyNow = async () => {
    if (!isAuthenticated) return;
    setIsApplying(true);
    setApplyError('');
    try {
      const res = await referralAPI.applyCode(code);
      setApplyResult(res?.data || {});
      showToast('Referral offer claimed successfully! 🎉', 'success');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_referral_code');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to claim referral offer. You may already have used a code or placed an order.';
      setApplyError(msg);
      showToast(msg, 'error');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] py-8 sm:py-14 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#fde68a]/30 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-1/3 left-10 w-80 h-80 bg-[#fee2e2]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        
        {/* Top Invitation Badge */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fdf2e9] border border-[#f5a623]/40 text-[#7a0b10] text-[12px] sm:text-[13px] font-black uppercase tracking-wider shadow-sm mb-4">
            <Sparkles className="w-4 h-4 text-[#e8a020]" />
            <span>Special Friend Invitation</span>
          </div>

          <h1 className="text-[32px] sm:text-[44px] md:text-[50px] font-black text-[#1a1a1a] tracking-tight leading-tight">
            You're Invited to <span className="text-[#7a0b10]">Lassi Lounge</span>
          </h1>
          <p className="text-[15px] sm:text-[17px] text-[#4b5563] mt-2 max-w-lg mx-auto leading-relaxed">
            A friend shared an exclusive invitation with you! Enjoy authentic fruit lassis, signature rolls &amp; flavorful treats with special savings.
          </p>
        </div>

        {/* Hero Card */}
        <div className="bg-[#fcf3e3] rounded-3xl p-6 sm:p-9 md:p-10 border border-[#f5a623] shadow-[0_20px_50px_rgba(122,11,16,0.08)] relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="relative z-10 text-center max-w-xl mx-auto">
            {/* Gift Icon Badge */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-5 shadow-sm border border-[#f5a623]/30">
              <Gift className="h-8 w-8 sm:h-10 sm:w-10 text-[#7a0b10]" />
            </div>

            {/* Discount Headline */}
            <div className="inline-block px-4 py-1 rounded-full bg-white/80 border border-[#f5a623]/40 text-[#7a0b10] text-xs font-black uppercase tracking-widest mb-3">
              First Order Special
            </div>
            
            <h2 className="text-[36px] sm:text-[48px] font-black text-[#1a1a1a] leading-none mb-2 tracking-tight">
              Get <span className="text-[#7a0b10]">${discountValue} OFF</span>
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#4b5563] mb-6">
              Valid on your first order of <strong className="text-[#1a1a1a] font-bold">${minOrderValue} or more</strong>.
            </p>

            {/* Referral Code Display & Copy Box */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-3 shadow-sm border border-[#eadfdb] max-w-md mx-auto mb-6">
              <div className="flex-1 text-center sm:text-left sm:pl-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">
                  Referral Code
                </div>
                <div className="text-[20px] sm:text-[24px] font-mono font-black text-[#7a0b10] tracking-widest">
                  {code}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            {/* Interactive Action Based on User State */}
            {applyResult ? (
              <div className="bg-white rounded-2xl p-5 border border-[#a7f3d0] shadow-sm text-left">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#d1fae5] text-[#047857] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[16px] font-bold text-[#111827]">
                      Discount Applied to Your Account! 🎉
                    </h4>
                    <p className="text-[13px] text-[#4b5563] mt-0.5">
                      Coupon <strong className="font-mono text-[#047857]">{applyResult?.coupon?.code}</strong> is ready. Apply it at checkout to get ${applyResult?.coupon?.discount || discountValue} off!
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      <Link
                        href="/menu"
                        className="h-11 px-6 rounded-xl bg-[#059669] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#047857] transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Browse Menu &amp; Order</span>
                      </Link>
                      <Link
                        href="/profile"
                        className="h-11 px-5 rounded-xl bg-[#f9fafb] text-[#374151] border border-[#e5e7eb] text-[13px] font-bold hover:bg-[#f3f4f6] transition-all flex items-center justify-center"
                      >
                        View in Profile
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : isAuthenticated ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleApplyNow}
                  disabled={isApplying}
                  className="w-full sm:w-auto min-w-[240px] h-12 px-8 rounded-xl bg-[#7a0b10] text-white text-[14px] font-black uppercase tracking-wider hover:bg-[#680307] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-md mx-auto"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Claiming Offer...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#f5a623]" />
                      <span>Claim &amp; Apply Offer</span>
                    </>
                  )}
                </button>

                {applyError && (
                  <div className="flex items-center justify-center gap-2 text-[12px] font-semibold text-[#b91c1c] bg-[#fef2f2] px-4 py-2.5 rounded-xl border border-[#fecaca] max-w-md mx-auto">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href="/menu"
                    className="text-[13px] font-bold text-[#7a0b10] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Or browse menu directly</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/login?ref=${encodeURIComponent(code)}&mode=register&redirect=/menu`}
                  className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#7a0b10] text-white text-[14px] font-black uppercase tracking-wider hover:bg-[#680307] transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <span>Claim ${discountValue} Off &amp; Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/menu"
                  className="w-full sm:w-auto h-12 px-6 rounded-xl bg-white text-[#4A0E13] border border-[#C99742] text-[13px] font-black uppercase tracking-wider hover:bg-[#f3ece0] transition-all flex items-center justify-center gap-2"
                >
                  <Utensils className="w-4 h-4 text-[#7a0b10]" />
                  <span>Explore Menu</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 3 Simple Steps */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e5e7eb] shadow-sm mb-8">
          <h3 className="text-[20px] font-black text-[#1a1a1a] text-center mb-6">
            How To Redeem Your Offer
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#eadfdb] text-center">
              <div className="w-10 h-10 rounded-full bg-[#7a0b10] text-white flex items-center justify-center mx-auto mb-3 font-mono font-black text-[15px]">
                1
              </div>
              <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-1">Claim Code</h4>
              <p className="text-[12px] text-[#6b7280]">
                Sign up with code <strong className="font-mono text-[#7a0b10]">{code}</strong> or apply it to your account.
              </p>
            </div>

            <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#eadfdb] text-center">
              <div className="w-10 h-10 rounded-full bg-[#7a0b10] text-white flex items-center justify-center mx-auto mb-3 font-mono font-black text-[15px]">
                2
              </div>
              <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-1">Pick Your Food</h4>
              <p className="text-[12px] text-[#6b7280]">
                Order delicious lassis, rolls &amp; street food (${minOrderValue}+ min order).
              </p>
            </div>

            <div className="bg-[#FAF7F2] rounded-2xl p-5 border border-[#eadfdb] text-center">
              <div className="w-10 h-10 rounded-full bg-[#7a0b10] text-white flex items-center justify-center mx-auto mb-3 font-mono font-black text-[15px]">
                3
              </div>
              <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-1">Save Instantly</h4>
              <p className="text-[12px] text-[#6b7280]">
                Enjoy ${discountValue} OFF deducted directly at checkout. Bon appétit!
              </p>
            </div>
          </div>
        </div>

        {/* Why Lassi Lounge Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-white rounded-2xl p-5 border border-[#e5e7eb] shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center mx-auto mb-3">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <h5 className="text-[14px] font-bold text-[#111827]">Fresh &amp; Authentic</h5>
            <p className="text-[12px] text-[#6b7280] mt-1">
              Crafted fresh daily with pure yogurt and real mangoes.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#e5e7eb] shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] text-[#047857] flex items-center justify-center mx-auto mb-3">
              <Award className="w-5 h-5" />
            </div>
            <h5 className="text-[14px] font-bold text-[#111827]">Lassi Rewards</h5>
            <p className="text-[12px] text-[#6b7280] mt-1">
              Earn reward points on every order you complete.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#e5e7eb] shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#fee2e2] text-[#991b1b] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h5 className="text-[14px] font-bold text-[#111827]">100% Guaranteed</h5>
            <p className="text-[12px] text-[#6b7280] mt-1">
              Secure online payments and direct order tracking.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
