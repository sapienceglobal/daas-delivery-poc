'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, RotateCcw, ShieldCheck, Mail, AlertCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

function OtpVerificationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  // Inline banner for invalid/expired codes and resend failures —
  // replaces relying on the toast alone for something this important.
  const [formError, setFormError] = useState('');
  const inputRefs = useRef([]);

  // If someone lands here directly without an email (e.g. refreshed a
  // bookmarked link, or navigated here manually), there's nothing to
  // verify — send them back to register/login instead of showing a
  // broken "code sent to " screen.
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

    // Paste support: pasting the full code into any single box arrives
    // here as a multi-character value (see handlePaste too, for the
    // container-level paste event).
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
      // Only NOW should the user be treated as authenticated — this is
      // the one place in the register flow that should ever grant
      // access. If /customer is reachable without ever completing this
      // call, the session is being created too early (at /auth/register
      // instead of /auth/verify-otp) — that's a backend fix, not
      // something this page can gate on its own.
      window.location.href = '/customer';
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
    <div className="flex items-center justify-center min-h-[85vh] bg-[#fdfbf7] px-4 font-sans py-12">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl overflow-hidden border border-[#eadfdb] animate-fadeIn">
        <div className="h-2 w-full bg-[#7a0b10]" />
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#fff3cd] rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#7a0b10]" />
            </div>
            <h1 className="text-[24px] font-black text-[#1a1a1a] mb-2">Verify your email</h1>
            <p className="text-[13px] text-[#6b7280]">We sent a 6-digit code to</p>
            <p className="text-[14px] font-bold text-[#1a1a1a] mt-0.5 break-all">{email}</p>
          </div>

          {formError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#dc2626' }} />
              <p className="text-[13px] font-semibold leading-snug" style={{ color: '#b91c1c' }}>{formError}</p>
            </div>
          )}

          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
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
                className={`w-12 h-14 text-center text-[22px] font-black rounded-xl border-2 outline-none transition-all text-[#1a1a1a] bg-[#f9f9f9] ${
                  formError ? 'border-red-300' : digit ? 'border-[#7a0b10] bg-[#fff3cd]' : 'border-[#eadfdb] focus:border-[#7a0b10]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <ShieldCheck className="w-4 h-4 text-green-500" />
            <p className="text-[12px] text-[#6b7280]">Code expires in <strong>10 minutes</strong>. Don&apos;t share it.</p>
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length < 6}
            className="w-full h-12 rounded-xl bg-[#7a0b10] text-white text-[14px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Verify &amp; Continue
            <ArrowRight className="h-4 w-4" />
          </button>

          <div className="mt-5 text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="flex items-center justify-center gap-1.5 mx-auto text-[13px] font-bold text-[#7a0b10] hover:underline disabled:opacity-50"
              >
                {resendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                Resend Code
              </button>
            ) : (
              <p className="text-[13px] text-[#6b7280]">
                Resend code in <span className="font-bold text-[#1a1a1a]">00:{secondsLeft.toString().padStart(2, '0')}</span>
              </p>
            )}
          </div>

          <div className="mt-6 text-center">
            <button onClick={() => router.push('/login')} className="text-[12px] text-[#9ca3af] hover:text-[#7a0b10] transition-colors">
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-[#7a0b10]" /></div>}>
      <OtpVerificationContent />
    </Suspense>
  );
}