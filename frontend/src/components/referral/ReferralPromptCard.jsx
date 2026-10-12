'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Tag, ArrowRight, Check, Copy, Loader2, AlertCircle, X } from 'lucide-react';
import { referralAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function ReferralPromptCard({
  programInfo,
  restaurantName = 'Lassi Lounge',
  onComplete,
  isModal = false,
  onClose,
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pending = localStorage.getItem('pending_referral_code');
      if (pending && !code) {
        setCode(pending.toUpperCase());
      }
    }
  }, []);

  const discountValue = result?.coupon?.discount ?? programInfo?.refereeDiscountValue ?? 20;
  const minOrderValue = result?.coupon?.minOrder ?? programInfo?.refereeMinOrder ?? 0;

  const handleApply = async (e) => {
    e?.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a referral code.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await referralAPI.applyCode(cleanCode);
      setResult(res?.data || {});
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pending_referral_code');
      }
      showToast('Referral code applied! 🎉', 'success');
    } catch (err) {
      setError(err.message || 'Invalid or expired referral code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      await referralAPI.skipOnboarding();
    } catch (_) {}
    if (onComplete) {
      onComplete();
    } else {
      window.location.href = '/';
    }
  };

  const handleCopyCode = async () => {
    const couponCode = result?.coupon?.code;
    if (!couponCode) return;
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      showToast('Coupon code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      showToast(couponCode, 'info');
    }
  };

  const handleStartOrdering = () => {
    if (onComplete) {
      onComplete();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="w-full max-w-[420px] mx-auto bg-[#faf7f2] rounded-3xl shadow-[0_20px_60px_rgba(74,9,11,0.08)] border border-[#f3e7df] overflow-hidden relative flex flex-col">
      {/* Top action row */}
      <div className="flex items-center justify-between px-6 pt-5 pb-1 relative z-20">
        <div className="flex-1" />
        {isModal ? (
          <button
            type="button"
            onClick={onClose || handleSkip}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSkip}
            className="text-[14px] font-semibold text-[#7a0b10] hover:text-[#550c0e] hover:underline transition-all flex items-center gap-0.5"
          >
            Skip &gt;
          </button>
        )}
      </div>

      {!result ? (
        /* ── Screen 1: Prompt ("Have a Referral Code?") ──────────────────────── */
        <div className="px-6 pt-1 pb-7 flex flex-col items-center text-center relative z-10">
          {/* 3D Gift Hero with Dynamic Discount Badge */}
          <div className="relative w-[280px] h-[135px] mb-2 select-none">
            <Image
              src="/images/branded/lassi-lounge/referral_hero_blank.png"
              alt="Welcome Gift"
              fill
              className="object-contain"
              priority
            />
            {/* Dynamic $XX Ticket Tag overlay positioned above authentic image OFF */}
            <div className="absolute top-[48%] left-[58%] -translate-x-1/2 -translate-y-1/2 w-[65px] transform rotate-[11deg] text-white text-center pointer-events-none">
              <div className="text-[21px] font-black leading-none tracking-tight drop-shadow-md">
                ${discountValue}
              </div>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h2 className="text-[30px] font-serif font-black text-[#550c0e] leading-tight mb-2 tracking-tight">
            Have a<br />Referral Code?
          </h2>
          <p className="text-[#555a64] text-[14px] leading-relaxed max-w-[320px] mb-5">
            Enter your friend&apos;s referral code to get{' '}
            <strong className="text-[#7a0b10] font-black">${discountValue} OFF</strong> on your
            first order at {restaurantName}!
          </p>

          {/* Error Banner */}
          {error && (
            <div
              className="w-full flex items-start gap-2.5 rounded-2xl px-4 py-3 mb-4 text-left shadow-xs transition-all"
              style={{
                backgroundColor: '#fef2f2',
                border: '1.5px solid #fca5a5',
              }}
            >
              <AlertCircle
                className="h-4 w-4 mt-0.5 shrink-0"
                style={{ color: '#dc2626' }}
              />
              <p
                className="text-[13px] font-bold leading-snug select-text"
                style={{ color: '#dc2626' }}
              >
                {error}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleApply} className="w-full space-y-3.5">
            {/* Pill Input with Tag Icon */}
            <div
              className="w-full relative flex items-center bg-white rounded-2xl shadow-sm transition-all overflow-hidden px-4 py-3"
              style={{
                border: error ? '2px solid #dc2626' : '2px solid #eadcd5',
              }}
            >
              <Tag className="w-5 h-5 text-[#7a0b10] shrink-0 mr-3" strokeWidth={2} />
              <input
                type="text"
                placeholder="Enter referral code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError('');
                }}
                maxLength={12}
                autoCapitalize="characters"
                className="w-full bg-transparent text-[15px] font-bold tracking-wider text-[#1f2937] placeholder:text-[#9ca3af] placeholder:font-normal outline-none"
              />
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7a0b10] to-[#550c0e] hover:from-[#65080c] hover:to-[#420608] text-white py-3.5 rounded-2xl text-[14px] font-bold transition-all shadow-[0_8px_20px_rgba(122,11,16,0.25)] hover:shadow-[0_10px_24px_rgba(122,11,16,0.35)] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Apply &amp; Claim Discount
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Subtle OR Divider */}
            <div className="flex items-center justify-center gap-3 py-1">
              <div className="h-[1px] bg-[#e5d8d0] flex-1" />
              <span className="text-[11px] font-bold text-[#8c7b74] tracking-widest uppercase">
                OR
              </span>
              <div className="h-[1px] bg-[#e5d8d0] flex-1" />
            </div>

            {/* Secondary Outlined Action Button */}
            <button
              type="button"
              onClick={handleSkip}
              className="w-full flex items-center justify-center gap-1.5 bg-transparent hover:bg-[#7a0b10]/5 text-[#7a0b10] border border-[#7a0b10] py-3 rounded-2xl text-[13px] font-bold transition-all cursor-pointer"
            >
              I don&apos;t have a code, continue &gt;
            </button>
          </form>
        </div>
      ) : (
        /* ── Screen 2: Success Celebration Ticket ("Awesome! Code Applied") ─── */
        <div className="px-6 pt-2 pb-7 flex flex-col items-center text-center relative z-10 animate-in fade-in zoom-in-95 duration-300">
          {/* Green Checkmark Circle with Confetti Burst */}
          <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
            {/* Celebration rays SVG */}
            <svg
              className="absolute inset-[-14px] w-[108px] h-[108px] pointer-events-none animate-pulse"
              viewBox="0 0 100 100"
              fill="none"
            >
              {/* Confetti dashes */}
              <line x1="50" y1="5" x2="50" y2="15" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
              <line x1="82" y1="18" x2="75" y2="25" stroke="#7a0b10" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="95" y1="50" x2="85" y2="50" stroke="#f97316" strokeWidth="3" strokeLinecap="round" />
              <line x1="82" y1="82" x2="75" y2="75" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="18" y1="18" x2="25" y2="25" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="5" y1="50" x2="15" y2="50" stroke="#7a0b10" strokeWidth="3" strokeLinecap="round" />
              {/* Confetti specks */}
              <circle cx="28" cy="12" r="2.5" fill="#eab308" />
              <circle cx="86" cy="36" r="2" fill="#7a0b10" />
              <circle cx="12" cy="70" r="2.5" fill="#f97316" />
              <circle cx="90" cy="72" r="2.5" fill="#eab308" />
            </svg>

            {/* Solid emerald circle */}
            <div className="w-16 h-16 rounded-full bg-[#1b873f] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(27,135,63,0.35)] relative z-10">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h2 className="text-[30px] font-serif font-black text-[#550c0e] leading-tight mb-2 tracking-tight">
            Awesome!<br />Code Applied
          </h2>
          <p className="text-[#555a64] text-[13px] leading-relaxed max-w-[320px] mb-5">
            You unlocked{' '}
            <strong className="text-[#7a0b10] font-black">${discountValue} OFF</strong> on your
            first order at {restaurantName}!<br />
            <span className="text-[#78716c] text-[12px]">Your personal coupon has been activated.</span>
          </p>

          {/* Perforated Coupon Ticket Card */}
          <div className="w-full relative bg-white rounded-2xl border-2 border-dashed border-[#f4c7be] p-4 shadow-[0_12px_28px_rgba(122,11,16,0.06)] overflow-hidden mb-5">
            {/* Left & Right Circular Notch Cutouts */}
            <div className="absolute left-[-11px] top-1/2 -translate-y-1/2 w-5 h-5 bg-[#faf7f2] rounded-full border-r-2 border-dashed border-[#f4c7be] pointer-events-none" />
            <div className="absolute right-[-11px] top-1/2 -translate-y-1/2 w-5 h-5 bg-[#faf7f2] rounded-full border-l-2 border-dashed border-[#f4c7be] pointer-events-none" />

            {/* Ticket Header Label */}
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#8c7b74] mb-2.5">
              YOUR FIRST-ORDER COUPON
            </div>

            {/* Code Row */}
            <div className="flex items-center justify-between gap-3 px-2 mb-3">
              {/* 3D Gift Box Icon */}
              <div className="relative w-11 h-11 shrink-0 rounded-xl overflow-hidden shadow-sm bg-[#fff1f2] border border-[#fecdd3]">
                <Image
                  src="/images/branded/lassi-lounge/referral_box_icon.jpg"
                  alt="Coupon Box"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Monospace Code */}
              <div className="flex-1 text-center font-mono font-black text-[22px] tracking-wider text-[#1f2937]">
                {result?.coupon?.code || 'WELCOME20'}
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopyCode}
                className="w-10 h-10 shrink-0 rounded-xl border border-[#fee2e2] bg-[#fef2f2] hover:bg-[#fee2e2] text-[#7a0b10] flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                title="Copy Coupon Code"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-600 stroke-[2.5]" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Lower Blush Details Banner */}
            <div className="bg-[#fff5f5] rounded-xl py-2 px-3 text-center border border-[#fee2e2]/70">
              <div className="text-[13px] font-bold text-[#7a0b10]">
                ${discountValue} OFF on your first order
              </div>
              <div className="text-[11px] text-[#78716c] mt-0.5 font-medium">
                Minimum order: ${minOrderValue} &bull; Valid for first order only
              </div>
            </div>
          </div>

          {/* Primary CTA Button: Start Ordering Now */}
          <button
            type="button"
            onClick={handleStartOrdering}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#7a0b10] to-[#550c0e] hover:from-[#65080c] hover:to-[#420608] text-white py-3.5 rounded-2xl text-[14px] font-bold transition-all shadow-[0_8px_20px_rgba(122,11,16,0.25)] hover:shadow-[0_10px_24px_rgba(122,11,16,0.35)] cursor-pointer uppercase tracking-wider"
          >
            Start Ordering Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
