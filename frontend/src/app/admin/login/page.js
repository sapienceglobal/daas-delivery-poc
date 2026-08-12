'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag, Calendar, Users, Tag, BarChart3, Mail, Lock, Eye, EyeOff, Headset, Globe, Shield,
  X, ArrowRight, Loader2, CheckCircle2, RotateCcw
} from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { showToast } from '@/components/ui';
import { authAPI } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ── Inline Forgot Password Modal ─────────────────────────────────────────────
function ForgotPasswordModal({ isOpen, onClose, defaultEmail = '' }) {
  const [fpEmail, setFpEmail] = useState(defaultEmail);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFpSubmit = async (e) => {
    e.preventDefault();
    if (!fpEmail || !/^\S+@\S+\.\S+$/.test(fpEmail)) {
      setFpError('Please enter a valid email address.');
      return;
    }
    setFpError('');
    setFpLoading(true);
    try {
      await authAPI.forgotPassword(fpEmail);
      setFpSuccess(true);
    } catch (err) {
      setFpError(err.message || 'Failed to send reset link. Please try again.');
    } finally {
      setFpLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setFpEmail(defaultEmail);
      setFpError('');
      setFpSuccess(false);
    }, 200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-[420px] rounded-2xl shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-[#4a090b]" />
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#c99742] to-transparent opacity-60" />

        <div className="p-8 relative">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-[#9ca3af] hover:text-[#4a090b] transition-colors p-1.5 rounded-full hover:bg-[#fdf7f0]"
          >
            <X className="w-5 h-5" />
          </button>

          {fpSuccess ? (
            <div className="text-center space-y-5 py-2">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-[#1f2937] mb-2">Check your inbox</h3>
                <p className="text-[13px] text-[#6b7280] leading-relaxed">
                  We sent a password reset link to<br />
                  <strong className="text-[#1f2937]">{fpEmail}</strong>
                </p>
                <p className="text-[12px] text-[#9ca3af] mt-3">
                  Link expires in 60 minutes. Check your spam folder if you don&apos;t see it.
                </p>
              </div>
              <button
                onClick={handleClose}
                className="w-full h-11 rounded-xl bg-[#f3f4f6] text-[#1f2937] text-[14px] font-bold hover:bg-[#e5e7eb] transition-colors"
              >
                Back to Sign In
              </button>
              <button
                type="button"
                onClick={() => { setFpSuccess(false); setFpEmail(''); }}
                className="flex items-center justify-center gap-1.5 mx-auto text-[12px] text-[#4a090b] font-bold hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-7">
                <div className="w-14 h-14 bg-[#fdf7f0] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#f0e4d0]">
                  <Mail className="w-7 h-7 text-[#4a090b]" />
                </div>
                <h3 className="text-[22px] font-bold text-[#1f2937] mb-1.5">Reset your password</h3>
                <p className="text-[13px] text-[#6b7280]">
                  Enter your admin account email and we&apos;ll send you a secure reset link.
                </p>
              </div>

              <form onSubmit={handleFpSubmit} className="space-y-5">
                <div>
                  <label className="text-[12px] font-bold text-[#1f2937] block mb-2">Email Address</label>
                  <div className={`flex items-center bg-white border rounded-xl overflow-hidden transition-all ${fpError ? 'border-red-300 ring-1 ring-red-300' : 'border-[#e5e7eb] focus-within:border-[#4a090b] focus-within:ring-1 focus-within:ring-[#4a090b]/20'}`}>
                    <div className="px-4 py-3.5 border-r border-[#f3f4f6] text-[#4a090b] bg-[#fdfaf8]">
                      <Mail size={17} strokeWidth={2} />
                    </div>
                    <input
                      type="email"
                      value={fpEmail}
                      onChange={e => { setFpEmail(e.target.value); setFpError(''); }}
                      placeholder="admin@lassilounge.com"
                      autoFocus
                      className="flex-1 bg-transparent border-none px-4 py-3.5 text-[14px] text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-0"
                    />
                  </div>
                  {fpError && <p className="text-red-500 text-[11px] mt-1.5 font-bold">{fpError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={fpLoading}
                  className="w-full flex items-center justify-center gap-2 bg-[#550c0e] hover:bg-[#3a080a] text-white py-[14px] rounded-xl text-[14px] font-bold transition-all shadow-[0_6px_16px_rgba(85,12,14,0.2)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {fpLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Reset Link
                  {!fpLoading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Login Page ─────────────────────────────────────────────────────
export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout } = useAuth();
  const { brand } = useBrand();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const validate = () => {
    try {
      loginSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errs = {};
        error.errors.forEach(err => {
          errs[err.path[0]] = err.message;
        });
        setErrors(errs);
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError('');
    try {
      const user = await login(email, password, rememberMe);
      if (user.role === 'admin' || user.role === 'merchant') {
        const redirectUrl = searchParams.get('redirect') || '/merchant';
        router.push(redirectUrl);
      } else {
        await logout();
        setFormError('Access Denied: This portal is for restaurant partners only.');
      }
    } catch (error) {
      setFormError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const operationalFeatures = [
    { icon: ShoppingBag, label: 'Order\nManagement' },
    { icon: Shield, label: 'Menu\nManagement' },
    { icon: Calendar, label: 'Table\nReservations' },
    { icon: Users, label: 'Customer\nManagement' },
    { icon: Tag, label: 'Offers &\nPromotions' },
    { icon: BarChart3, label: 'Reports &\nAnalytics' }
  ];

  return (
    <div className="min-h-screen flex bg-white font-sans">
      <div className="w-full h-screen flex flex-col lg:flex-row relative overflow-hidden bg-white">

        {/* Left Side: Branded Hero */}
        <div className="relative hidden lg:flex w-full lg:w-[50%] h-full flex-col justify-center items-center text-center px-8 pt-12 pb-32 overflow-hidden bg-[#4a090b]">
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
              <div className="relative w-[360px] h-[130px]">
                <Image
                  src="/assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png"
                  alt="Lassi Lounge"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="flex items-center justify-center gap-2 text-[#c99742] text-[10px] font-semibold tracking-widest mt-1">
                <span>∞</span>INDIAN RESTAURANT<span>∞</span>
              </div>
            </div>

            <h2 className="text-[32px] font-serif text-[#c99742] mb-4">Admin Panel</h2>
            <div className="flex items-center justify-center mb-6 w-full">
              <div className="w-2 h-2 rotate-45 bg-[#c99742] mr-2 opacity-50"></div>
              <div className="w-2 h-2 rotate-45 border border-[#c99742]"></div>
              <div className="w-2 h-2 rotate-45 bg-[#c99742] ml-2 opacity-50"></div>
            </div>

            <p className="text-white/90 text-[15px] leading-relaxed mb-10">
              Manage your restaurant operations<br />efficiently and effortlessly.
            </p>

            <div className="grid grid-cols-3 gap-y-10 gap-x-6 w-full max-w-[380px] mt-6">
              {operationalFeatures.map((feat, idx) => (
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

        {/* Right Side: Login Form */}
        <div className="w-full lg:w-[50%] h-full flex flex-col bg-[#fcfdfc] relative items-center px-6 lg:px-16 py-6 lg:py-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          <div className="absolute top-[-5%] right-[-5%] w-64 h-64 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNMzAgMjBDMjAgMzAgMjAgNTAgMzAgNjBMMTAwIDEwMEM5MCA4MCA3MCA4MCA2MCA3MEwxMCAyMEMyMCAxMCA0MCAxMCAzMCAyMFoiIGZpbGw9IiNmMmVhZTQiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] bg-no-repeat bg-contain opacity-20 pointer-events-none rotate-45" />
          <div className="absolute bottom-[5%] right-[5%] w-48 h-48 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjQgNCIvPjxwYXRoIGQ9Ik01MCAxMEMzMCAzMCA3MCA3MCA1MCA5MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] bg-no-repeat bg-contain opacity-30 pointer-events-none -rotate-12" />
          <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNMTUgNTBDMTUgMzAgMzAgMTUgNTAgMTVMMTAwIDBDODAgMjAgODAgNTAgMTAwIDcwQzgwIDkwIDUwIDkwIDUwIDcwQzMwIDcwIDE1IDkwIDE1IDUwWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] bg-no-repeat bg-contain opacity-20 pointer-events-none rotate-[30deg]" />

          <div className="w-full mx-auto z-10 my-auto max-w-[440px] transition-all duration-300">

            {/* Mobile Logo (Visible only on small screens) */}
            <div className="flex flex-col items-center mb-6 lg:hidden">
              <div className="relative w-[240px] h-[90px]">
                <Image
                  src="/assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png"
                  alt="Lassi Lounge"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-[32px] font-serif text-[#4a090b] mb-3">Admin Portal</h2>
              <div className="flex items-center justify-center mb-4 w-full">
                <div className="w-10 h-[1px] bg-[#c99742]"></div>
                <div className="w-1.5 h-1.5 rotate-45 bg-[#c99742] mx-2"></div>
                <div className="w-10 h-[1px] bg-[#c99742]"></div>
              </div>
              <p className="text-[#6b7280] text-[15px]">Sign in to your Lassi Lounge Admin Account</p>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgb(0,0,0,0.06)] px-8 pt-8 pb-5 sm:px-10 sm:pt-10 sm:pb-6 border border-[#f9fafb] relative overflow-hidden">

              {formError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-6">
                  <svg className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#dc2626' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  <p className="text-[13px] font-semibold leading-snug" style={{ color: '#b91c1c' }}>{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Email Field */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-[#1f2937] block">Email Address</label>
                  <div className={`relative flex items-center bg-white border rounded-xl overflow-hidden transition-all ${errors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-[#e5e7eb] focus-within:border-[#4a090b] focus-within:ring-1 focus-within:ring-[#4a090b]/20'}`}>
                    <div className="px-4 py-3.5 border-r border-[#f3f4f6] text-[#4a090b] bg-[#fdfaf8]">
                      <Mail size={18} strokeWidth={2} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors(prev => ({ ...prev, email: '' })); }}
                      placeholder="Enter your email address"
                      className="flex-1 bg-transparent border-none px-4 py-3.5 text-[14px] text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-0"
                    />
                  </div>
                  {errors.email && <p className="text-xs font-medium mt-1 ml-1" style={{ color: '#ef4444' }}>{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-[#1f2937] block">Password</label>
                  <div className={`relative flex items-center bg-white border rounded-xl overflow-hidden transition-all ${errors.password ? 'border-red-300 ring-1 ring-red-300' : 'border-[#e5e7eb] focus-within:border-[#4a090b] focus-within:ring-1 focus-within:ring-[#4a090b]/20'}`}>
                    <div className="px-4 py-3.5 border-r border-[#f3f4f6] text-[#4a090b] bg-[#fdfaf8]">
                      <Lock size={18} strokeWidth={2} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors(prev => ({ ...prev, password: '' })); }}
                      placeholder="Enter your password"
                      className="flex-1 bg-transparent border-none px-4 py-3.5 text-[14px] text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="px-4 text-[#9ca3af] hover:text-[#4a090b] focus:outline-none transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs font-medium mt-1 ml-1" style={{ color: '#ef4444' }}>{errors.password}</p>}
                </div>

                {/* Remember Me + Forgot Password */}
                <div className="flex items-center justify-between pt-1 pb-2">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-[18px] h-[18px] rounded-[4px] border-[1.5px] border-[#d1d5db] group-hover:border-[#4a090b] transition-colors">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="opacity-0 absolute inset-0 cursor-pointer"
                      />
                      {rememberMe && (
                        <div className="w-2.5 h-2.5 bg-[#4a090b] rounded-sm"></div>
                      )}
                    </div>
                    <span className="text-[13px] text-[#4b5563] group-hover:text-[#111827] transition-colors">Remember me</span>
                  </label>

                  {/* ✅ Fixed: Opens modal in-page, not a broken /login redirect */}
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-[13px] font-bold text-[#4a090b] hover:text-[#2a0506] hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-[#550c0e] hover:bg-[#3a080a] text-white py-[15px] rounded-xl text-[15px] font-semibold transition-all shadow-[0_8px_20px_rgba(85,12,14,0.25)] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Lock size={16} strokeWidth={2.5} />
                      Sign In
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer Links */}
            <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-[13px]">
              <Link href="#" className="flex items-center gap-2 text-[#6b7280] hover:text-[#4a090b] transition-colors">
                <Headset size={16} />
                <span>Need Help? <span className="font-bold text-[#4a090b]">Contact Support</span></span>
              </Link>
              <div className="hidden sm:block w-[1px] h-[14px] bg-[#d1d5db]"></div>
              <Link href="/" className="flex items-center gap-2 text-[#6b7280] hover:text-[#111827] transition-colors">
                <Globe size={16} />
                <span>Back to Website</span>
              </Link>
            </div>

            <div className="mt-8 text-center text-[11px] text-[#9ca3af] font-medium">
              © {new Date().getFullYear()} Lassi Lounge. All Rights Reserved.
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal — stays in admin context */}
      <ForgotPasswordModal
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
        defaultEmail={email}
      />
    </div>
  );
}