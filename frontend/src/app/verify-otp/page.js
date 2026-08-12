'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Loader2, ArrowRight, RotateCcw, ShieldCheck, Mail, AlertCircle, ShoppingBag, Bike, Calendar, Tag, Star, Clock } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import { useBrand } from '@/context/BrandContext';

const customerFeatures = [
  { icon: ShoppingBag, label: 'Easy\nOrdering' },
  { icon: Bike, label: 'Fast\nDelivery' },
  { icon: Calendar, label: 'Table\nBooking' },
  { icon: Tag, label: 'Exclusive\nOffers' },
  { icon: Star, label: 'Rewards &\nLoyalty' },
  { icon: Clock, label: 'Live Order\nTracking' },
];

function OtpVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { brand } = useBrand();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [formError, setFormError] = useState('');
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      router.replace('/login');
    }
  }, [email, router]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    if (formError) setFormError('');

    if (value.length > 1) {
      const digits = value.slice(0, 6 - index).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => { newOtp[index + i] = d; });
      setOtp(newOtp);
      const lastIndex = Math.min(index + digits.length, 5);
      inputRefs.current[lastIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setFormError('Please enter the complete 6-digit code.');
      return;
    }
    setFormError('');
    setLoading(true);
    try {
      await authAPI.verifyOtp(email, code);
      showToast('Email verified! Welcome to Lassi Lounge 🎉', 'success');
      window.location.href = '/';
    } catch (err) {
      setFormError(err.message || 'That code is incorrect or has expired. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResendLoading(true);
    setFormError('');
    try {
      await authAPI.resendOtp(email);
      showToast('New code sent to your email!', 'success');
      setSecondsLeft(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setFormError(err.message || 'Failed to resend the code. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <div className="w-full h-screen flex flex-col lg:flex-row relative overflow-hidden bg-white">
        
        {/* Left Side: Branded Hero */}
        <div className="relative w-full lg:w-[50%] h-full flex flex-col justify-center items-center text-center px-8 pt-12 pb-32 overflow-hidden bg-[#4a090b]">
          <div className="absolute inset-0 z-0">
            <Image 
              src="/images/branded/lassi-lounge/hero-spread-auth.png" 
              alt="Indian Cuisine Spread" 
              fill 
              className="object-cover object-bottom"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#4a090b] via-[#4a090b]/85 to-transparent z-10"></div>
          </div>
          
          <div className="absolute top-0 right-0 h-full w-[40px] lg:w-[80px] hidden lg:block z-20 translate-x-[1px]">
            <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="h-full w-full">
              <path d="M0,0 C100,300 100,700 0,1000 L100,1000 L100,0 Z" fill="#fdfdfd" />
              <path d="M0,0 C100,300 100,700 0,1000" fill="none" stroke="#c99742" strokeWidth="6" />
            </svg>
          </div>

          <div className="relative z-10 w-full max-w-md flex flex-col items-center">
            <div className="mb-6 flex flex-col items-center">
              <svg className="w-12 h-12 text-[#c99742] mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
              </svg>
              <h1 className="text-[40px] font-serif text-white tracking-widest mb-1 leading-none">LASSI</h1>
              <div className="flex items-center gap-4 text-white/80 w-full mb-2">
                <div className="h-[1px] flex-1 bg-white/40"></div>
                <span className="tracking-[0.3em] text-sm uppercase font-light">Lounge</span>
                <div className="h-[1px] flex-1 bg-white/40"></div>
              </div>
              <div className="flex items-center justify-center gap-2 text-[#c99742] text-[10px] font-semibold tracking-widest mt-1">
                <span>∞</span>INDIAN RESTAURANT<span>∞</span>
              </div>
            </div>

            <h2 className="text-[28px] font-serif text-[#c99742] mb-4">
              Almost There!
            </h2>
            <div className="flex items-center justify-center mb-6 w-full">
              <div className="w-2 h-2 rotate-45 bg-[#c99742] mr-2 opacity-50"></div>
              <div className="w-2 h-2 rotate-45 border border-[#c99742]"></div>
              <div className="w-2 h-2 rotate-45 bg-[#c99742] ml-2 opacity-50"></div>
            </div>

            <p className="text-white/90 text-[15px] leading-relaxed mb-10">
              Verify your identity to secure your account<br/>and access your dashboard.
            </p>

            <div className="grid grid-cols-3 gap-y-10 gap-x-6 w-full max-w-[380px] mt-6">
              {customerFeatures.map((feat, idx) => (
                <div key={idx} className="flex flex-col items-center group cursor-default">
                  <div className="mb-3 group-hover:scale-110 transition-transform duration-300">
                    <feat.icon className="w-8 h-8 text-[#c99742]" strokeWidth={1.5} />
                  </div>
                  <span className="text-white text-[11px] leading-snug text-center uppercase tracking-wider whitespace-pre-line font-medium drop-shadow-md">
                    {feat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full lg:w-[50%] h-full flex flex-col bg-[#fcfdfc] relative items-center px-6 lg:px-16 py-12 lg:py-16 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          
          <div className="absolute top-[-5%] right-[-5%] w-64 h-64 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNMzAgMjBDMjAgMzAgMjAgNTAgMzAgNjBMMTAwIDEwMEM5MCA4MCA3MCA4MCA2MCA3MEwxMCAyMEMyMCAxMCA0MCAxMCAzMCAyMFoiIGZpbGw9IiNmMmVhZTQiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] bg-no-repeat bg-contain opacity-20 pointer-events-none rotate-45" />
          <div className="absolute bottom-[5%] right-[5%] w-48 h-48 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjQgNCIvPjxwYXRoIGQ9Ik01MCAxMEMzMCAzMCA3MCA3MCA1MCA5MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] bg-no-repeat bg-contain opacity-30 pointer-events-none -rotate-12" />
          <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNMTUgNTBDMTUgMzAgMzAgMTUgNTAgMTVMMTAwIDBDODAgMjAgODAgNTAgMTAwIDcwQzgwIDkwIDUwIDkwIDUwIDcwQzMwIDcwIDE1IDkwIDE1IDUwWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] bg-no-repeat bg-contain opacity-20 pointer-events-none rotate-[30deg]" />

          <div className="w-full max-w-[440px] mx-auto z-10 my-auto py-4">
            <div className="text-center mb-8">
              <h2 className="text-[32px] font-serif text-[#4a090b] mb-3">
                Verify Your Email
              </h2>
              <div className="flex items-center justify-center mb-4 w-full">
                <div className="w-10 h-[1px] bg-[#c99742]"></div>
                <div className="w-1.5 h-1.5 rotate-45 bg-[#c99742] mx-2"></div>
                <div className="w-10 h-[1px] bg-[#c99742]"></div>
              </div>
              <p className="text-[#6b7280] text-[15px]">
                We sent a 6-digit code to <br/><strong className="text-[#1f2937] break-all">{email}</strong>
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgb(0,0,0,0.06)] p-8 sm:p-10 border border-[#f9fafb] relative overflow-hidden">
              
              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-5">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#dc2626' }} />
                  <p className="text-[13px] font-semibold leading-snug" style={{ color: '#b91c1c' }}>{formError}</p>
                </div>
              )}

              <div className="flex gap-2 justify-center mb-8" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-[46px] h-[54px] text-center text-[22px] font-black rounded-xl border-2 outline-none transition-all text-[#1f2937] bg-[#fdfaf8] shadow-sm ${
                      formError ? 'border-red-300' : digit ? 'border-[#4a090b] bg-[#fdf7f0]' : 'border-[#e5e7eb] focus:border-[#4a090b] focus:bg-white focus:ring-4 focus:ring-[#4a090b]/10'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 mb-8 bg-[#fdfaf8] rounded-xl py-3 px-4 border border-[#f3f4f6]">
                <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                <p className="text-[12px] text-[#4b5563] font-medium">Code expires in <strong className="text-[#1f2937]">10 minutes</strong>. Do not share.</p>
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || otp.join('').length < 6}
                className="w-full flex items-center justify-center gap-2 bg-[#550c0e] hover:bg-[#3a080a] text-white py-[14px] rounded-xl text-[14px] font-bold transition-all shadow-[0_6px_16px_rgba(85,12,14,0.2)] disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Verify &amp; Continue
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="mt-8 text-center pt-5 border-t border-[#f3f4f6]">
                {canResend ? (
                  <button
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-bold text-[#4a090b] hover:underline disabled:opacity-50"
                  >
                    {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Resend Code
                  </button>
                ) : (
                  <p className="text-[13px] text-[#6b7280]">
                    Resend code in <span className="font-bold text-[#1f2937]">00:{secondsLeft.toString().padStart(2, '0')}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 text-center border-t border-[#f3f4f6] pt-4">
              <button onClick={() => router.replace('/login')} className="text-[11px] text-[#9ca3af] hover:text-[#4a090b] transition-colors uppercase tracking-widest font-semibold">
                &larr; Back to Login
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function OtpVerificationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#4a090b]" /></div>}>
      <OtpVerificationContent />
    </Suspense>
  );
}