'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Mail, Lock, User, Eye, EyeOff, ChefHat, ArrowRight, Loader2, Check, AlertCircle, MailCheck,
  ShoppingBag, Bike, Calendar, Tag, Star, Clock
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/context/BrandContext';
import { GlassCard, Input, Button, showToast, Badge } from '@/components/ui';
import { GoogleLogin } from '@react-oauth/google';
import { z } from 'zod';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import ForgotPasswordModal from './ForgotPasswordModal';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Phone is now required and validated as a real, dialable number
// (matching the mobile app, which already requires it). If phone should
// stay optional on the website, tell me and I'll relax this back to
// `.optional()` — just flagging that mobile and web disagreed before.
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .refine((val) => isValidPhoneNumber(val || ''), 'Enter a valid phone number'),
  password: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Requires uppercase, lowercase, number & special char'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Customer-facing equivalent of admin/login's operational features grid —
// swapped for things an end customer actually cares about (not
// Menu Management / Reports, which are merchant/admin concerns).
const customerFeatures = [
  { icon: ShoppingBag, label: 'Easy\nOrdering' },
  { icon: Bike, label: 'Fast\nDelivery' },
  { icon: Calendar, label: 'Table\nBooking' },
  { icon: Tag, label: 'Exclusive\nOffers' },
  { icon: Star, label: 'Rewards &\nLoyalty' },
  { icon: Clock, label: 'Live Order\nTracking' },
];

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';
  const { login, register, googleLogin, logout, isAuthenticated, user, loading: authLoading } = useAuth();
  const { brand } = useBrand();
  const isSingleMode = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '', role: 'customer', rememberMe: true
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  // Top-of-form banner for anything the backend rejects (duplicate
  // email, wrong password, server errors) — replaces relying on the
  // toast alone, which disappears fast and isn't tied to the form.
  const [formError, setFormError] = useState('');
  // Set to true when backend says email is not verified — triggers the
  // special "Go verify" CTA banner instead of the plain red error.
  const [isUnverifiedEmail, setIsUnverifiedEmail] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'customer') {
        // Use window.location.href instead of router.push to bypass Next.js router cache
        // which aggressively caches middleware redirects, causing infinite loops.
        const dest = redirectPath || '/';
        window.location.href = dest;
      }
    }
  }, [authLoading, isAuthenticated, user, redirectPath]);

  // If backend verification is done and user is authenticated, show loader while redirect fires.
  // We check !authLoading to avoid showing the spinner during the initial /me fetch —
  // that would cause a blink: spinner → form → spinner → redirect.
  if (!authLoading && isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#7a0b10]" />
      </div>
    );
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setFormError('');
    if (e.target.name === 'email') setIsUnverifiedEmail(false);
  };

  const handlePhoneChange = (value) => {
    setForm(prev => ({ ...prev, phone: value || '' }));
    setErrors(prev => ({ ...prev, phone: '' }));
    setFormError('');
  };

  const validate = () => {
    try {
      if (isRegister) {
        registerSchema.parse(form);
      } else {
        loginSchema.parse(form);
      }
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errs = {};
        const issues = error.errors || error.issues || [];
        issues.forEach(err => {
          errs[err.path[0]] = err.message;
        });
        setErrors(errs);
      }
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsUnverifiedEmail(false);
    if (!validate()) return;

    if (isRegister && !agreedToTerms) {
      setErrors(prev => ({ ...prev, terms: 'You must agree to the Terms & Conditions' }));
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        // `register()` (from AuthContext) has been fixed to no longer
        // authenticate the browser as a side effect — it now just
        // calls /api/auth/register, which creates an unverified account
        // and emails an OTP. The session only starts once verifyOtp()
        // succeeds on the next screen (see AuthContext.js + the
        // register controller for the actual fix). That's what was
        // causing "straight to /customer, no verification": the old
        // register() logged the browser in immediately, so the redirect
        // effect above won the race against router.push('/verify-otp').
        await register(form);
        router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
        return;
      } else {
        const userData = await login(form.email, form.password, form.rememberMe);

        // Strictly restrict this portal to customers
        if (userData.role === 'admin' || userData.role === 'merchant') {
          await logout();
          setFormError('Restaurant partners must log in through the Partner Portal.');
          return;
        }

        showToast('Welcome back!', 'success');
      }
    } catch (err) {
      const message = err.message || 'Something went wrong. Please try again.';
      // Detect the "unverified email" error and set a special flag so the
      // UI can show a CTA button to navigate back to the verify-otp page.
      if (message.toLowerCase().includes('verify your email')) {
        setIsUnverifiedEmail(true);
        setFormError('');
      } else {
        setFormError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const userData = await googleLogin(credentialResponse.credential, form.role);
      showToast(isRegister ? 'Account created via Google!' : 'Signed in via Google!', 'success');

      // Handled by the useEffect above
    } catch (err) {
      setFormError(err.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setFormError('Google Sign-In failed. Please try again.');
  };

  if (isSingleMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-sans">
        <div className="w-full max-w-[1400px] min-h-screen lg:min-h-[90vh] lg:h-[90vh] flex flex-col lg:flex-row shadow-2xl relative overflow-hidden bg-white">

          {/* Left Side: Branded Hero (mirrors admin/login's panel, with
              customer-relevant features instead of operational/admin ones) */}
          <div className="relative w-full lg:w-[45%] h-full flex flex-col justify-center items-center text-center px-8 pt-12 pb-32 overflow-hidden bg-[#4a090b]">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#c99742 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

            <div className="absolute bottom-0 left-0 right-0 h-[45%] z-0">
              <div className="absolute inset-0 bg-gradient-to-b from-[#4a090b] via-[#4a090b]/60 to-transparent z-10"></div>
              <Image
                src="/images/branded/lassi-lounge/hero-spread.jpg"
                alt="Indian Cuisine Spread"
                fill
                className="object-cover object-bottom opacity-90"
                priority
              />
            </div>

            <div className="absolute top-0 right-0 h-full w-[40px] lg:w-[80px] hidden lg:block z-20 translate-x-[1px]">
              <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="h-full w-full">
                <path d="M0,0 C100,300 100,700 0,1000 L100,1000 L100,0 Z" fill="#fdfdfd" />
                <path d="M0,0 C100,300 100,700 0,1000" fill="none" stroke="#c99742" strokeWidth="6" />
              </svg>
            </div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
              <div className="mb-6 flex flex-col items-center">
                {brand?.logo ? (
                  <div className="relative w-full max-w-[200px] h-24 mb-3">
                    <Image
                      src={brand.logo}
                      alt={brand?.name || 'Restaurant logo'}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <>
                    <svg className="w-12 h-12 text-[#c99742] mb-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
                    </svg>
                    <h1 className="text-[40px] font-serif text-white tracking-widest mb-1 leading-none">LASSI</h1>
                    <div className="flex items-center gap-4 text-white/80 w-full mb-2">
                      <div className="h-[1px] flex-1 bg-white/40"></div>
                      <span className="tracking-[0.3em] text-sm uppercase font-light">Lounge</span>
                      <div className="h-[1px] flex-1 bg-white/40"></div>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-center gap-2 text-[#c99742] text-[10px] font-semibold tracking-widest mt-1">
                  <span>∞</span>INDIAN RESTAURANT<span>∞</span>
                </div>
              </div>

              <h2 className="text-[28px] font-serif text-[#c99742] mb-4">
                {isRegister ? 'Join the Family' : 'Welcome Back'}
              </h2>
              <div className="flex items-center justify-center mb-6 w-full">
                <div className="w-2 h-2 rotate-45 bg-[#c99742] mr-2 opacity-50"></div>
                <div className="w-2 h-2 rotate-45 border border-[#c99742]"></div>
                <div className="w-2 h-2 rotate-45 bg-[#c99742] ml-2 opacity-50"></div>
              </div>

              <p className="text-white/90 text-[15px] leading-relaxed mb-10">
                Order your favorites, track deliveries,<br/>and never miss a table.
              </p>

              <div className="grid grid-cols-3 gap-y-7 gap-x-6 w-full max-w-[340px] mt-2">
                {customerFeatures.map((feat, idx) => (
                  <div key={idx} className="flex flex-col items-center group">
                    <div className="w-12 h-12 rounded-full bg-[#4a090b]/80 backdrop-blur-sm border border-[#c99742]/40 flex items-center justify-center mb-2.5 shadow-lg group-hover:scale-110 group-hover:border-[#c99742]/70 transition-all duration-300">
                      <feat.icon className="w-5 h-5 text-[#c99742]" strokeWidth={1.75} />
                    </div>
                    <span className="text-white text-[10px] leading-snug text-center uppercase tracking-wider whitespace-pre-line font-bold drop-shadow-lg">
                      {feat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Side: Auth Form */}
          <div className="w-full lg:w-[55%] h-full flex flex-col bg-[#fcfdfc] relative items-center px-6 lg:px-16 py-10 overflow-x-hidden overflow-y-auto">

            <div className="absolute top-[-5%] right-[-5%] w-64 h-64 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNMzAgMjBDMjAgMzAgMjAgNTAgMzAgNjBMMTAwIDEwMEM5MCA4MCA3MCA4MCA2MCA3MEwxMCAyMEMyMCAxMCA0MCAxMCAzMCAyMFoiIGZpbGw9IiNmMmVhZTQiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] bg-no-repeat bg-contain opacity-20 pointer-events-none rotate-45" />
            <div className="absolute bottom-[5%] right-[5%] w-48 h-48 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjQgNCIvPjxwYXRoIGQ9Ik01MCAxMEMzMCAzMCA3MCA3MCA1MCA5MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] bg-no-repeat bg-contain opacity-30 pointer-events-none -rotate-12" />
            <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNMTUgNTBDMTUgMzAgMzAgMTUgNTAgMTVMMTAwIDBDODAgMjAgODAgNTAgMTAwIDcwQzgwIDkwIDUwIDkwIDUwIDcwQzMwIDcwIDE1IDkwIDE1IDUwWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] bg-no-repeat bg-contain opacity-20 pointer-events-none rotate-[30deg]" />

            <div className={`w-full mx-auto z-10 my-auto py-4 transition-all duration-300 ${isRegister ? 'max-w-[560px]' : 'max-w-[440px]'}`}>
              <div className="text-center mb-8">
                <h2 className="text-[32px] font-serif text-[#4a090b] mb-3">
                  {isRegister ? 'Create Account' : 'Welcome Back!'}
                </h2>
                <div className="flex items-center justify-center mb-4 w-full">
                  <div className="w-10 h-[1px] bg-[#c99742]"></div>
                  <div className="w-1.5 h-1.5 rotate-45 bg-[#c99742] mx-2"></div>
                  <div className="w-10 h-[1px] bg-[#c99742]"></div>
                </div>
                <p className="text-[#6b7280] text-[15px]">
                  {isRegister ? 'Join Lassi Lounge today' : 'Sign in to your Lassi Lounge account'}
                </p>
              </div>

              <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgb(0,0,0,0.06)] p-8 sm:p-10 border border-[#f9fafb] relative overflow-hidden">

                {/* Sign In / Register Toggle */}
                <div className="flex bg-[#fdf7f0] p-1 rounded-xl mb-7 border border-[#f0e4d0]">
                  <button
                    type="button"
                    onClick={() => { setIsRegister(false); setFormError(''); setErrors({}); setIsUnverifiedEmail(false); }}
                    className={`flex-1 rounded-lg py-2.5 text-[14px] font-bold transition-all ${
                      !isRegister ? 'bg-white text-[#4a090b] shadow-sm' : 'text-[#6b7280] hover:text-[#4a090b]'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsRegister(true); setFormError(''); setErrors({}); setIsUnverifiedEmail(false); }}
                    className={`flex-1 rounded-lg py-2.5 text-[14px] font-bold transition-all ${
                      isRegister ? 'bg-white text-[#4a090b] shadow-sm' : 'text-[#6b7280] hover:text-[#4a090b]'
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* Unverified email — special CTA banner */}
                {isUnverifiedEmail && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 mb-5">
                    <div className="flex items-start gap-3">
                      <MailCheck className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#d97706' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold leading-snug" style={{ color: '#92400e' }}>
                          Email not verified
                        </p>
                        <p className="text-[12px] mt-0.5 leading-snug" style={{ color: '#b45309' }}>
                          Please verify your email to continue. Click below to go to the verification page.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`)}
                      className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-bold transition-all"
                      style={{ backgroundColor: '#7a0b10', color: '#ffffff' }}
                    >
                      <MailCheck className="h-4 w-4" />
                      Go to Email Verification
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Generic error banner */}
                {formError && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-5">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#dc2626' }} />
                    <p className="text-[13px] font-semibold leading-snug" style={{ color: '#b91c1c' }}>{formError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {isRegister && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div className="space-y-2.5">
                        <label className="text-[13px] font-bold text-[#1f2937] block">Full Name</label>
                        <div className={`relative flex items-center bg-white border rounded-xl overflow-hidden transition-all ${errors.name ? 'border-red-300 ring-1 ring-red-300' : 'border-[#e5e7eb] focus-within:border-[#4a090b] focus-within:ring-1 focus-within:ring-[#4a090b]/20'}`}>
                          <div className="px-4 py-3.5 border-r border-[#f3f4f6] text-[#4a090b] bg-[#fdfaf8]">
                            <User size={18} strokeWidth={2} />
                          </div>
                          <input
                            name="name"
                            placeholder="John Doe"
                            value={form.name}
                            onChange={handleChange}
                            className="flex-1 bg-transparent border-none px-4 py-3.5 text-[14px] text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-0"
                          />
                        </div>
                        {errors.name && <p className="text-xs text-red-500 font-medium mt-1 ml-1">{errors.name}</p>}
                      </div>

                      {/* Phone */}
                      <div className="space-y-2.5">
                        <label className="text-[13px] font-bold text-[#1f2937] block">Phone Number</label>
                        {/*
                          Same experience as the mobile app's country picker:
                          flag + dial code + searchable country list, and the
                          value it produces is already E.164 formatted
                          (e.g. "+919876543210"), so it can be sent to the
                          backend as-is.
                        */}
                        <div className={`phone-field-wrap h-[52px] rounded-xl border px-4 flex items-center bg-white transition-all ${errors.phone ? 'border-red-300 ring-1 ring-red-300' : 'border-[#e5e7eb] focus-within:border-[#4a090b] focus-within:ring-1 focus-within:ring-[#4a090b]/20'}`}>
                          <PhoneInput
                            international
                            defaultCountry="IN"
                            placeholder="Enter phone number"
                            value={form.phone}
                            onChange={handlePhoneChange}
                            className="w-full"
                          />
                        </div>
                        {errors.phone && <p className="text-xs font-medium mt-1 ml-1" style={{ color: '#ef4444' }}>{errors.phone}</p>}
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-bold text-[#1f2937] block">Email Address</label>
                    <div className={`relative flex items-center bg-white border rounded-xl overflow-hidden transition-all ${errors.email ? 'border-red-300 ring-1 ring-red-300' : 'border-[#e5e7eb] focus-within:border-[#4a090b] focus-within:ring-1 focus-within:ring-[#4a090b]/20'}`}>
                      <div className="px-4 py-3.5 border-r border-[#f3f4f6] text-[#4a090b] bg-[#fdfaf8]">
                        <Mail size={18} strokeWidth={2} />
                      </div>
                      <input
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                        className="flex-1 bg-transparent border-none px-4 py-3.5 text-[14px] text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-0"
                      />
                    </div>
                    {errors.email && <p className="text-xs font-medium mt-1 ml-1" style={{ color: '#ef4444' }}>{errors.email}</p>}
                  </div>

                  <div className={isRegister ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
                    {/* Password */}
                    <div className="space-y-2.5">
                      <label className="text-[13px] font-bold text-[#1f2937] block">Password</label>
                      <div className={`relative flex items-center bg-white border rounded-xl overflow-hidden transition-all ${errors.password ? 'border-red-300 ring-1 ring-red-300' : 'border-[#e5e7eb] focus-within:border-[#4a090b] focus-within:ring-1 focus-within:ring-[#4a090b]/20'}`}>
                        <div className="px-4 py-3.5 border-r border-[#f3f4f6] text-[#4a090b] bg-[#fdfaf8]">
                          <Lock size={18} strokeWidth={2} />
                        </div>
                        <input
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={form.password}
                          onChange={handleChange}
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

                    {/* Confirm Password */}
                    {isRegister && (
                      <div className="space-y-2.5">
                        <label className="text-[13px] font-bold text-[#1f2937] block">Confirm Password</label>
                        <div className={`relative flex items-center bg-white border rounded-xl overflow-hidden transition-all ${errors.confirmPassword ? 'border-red-300 ring-1 ring-red-300' : 'border-[#e5e7eb] focus-within:border-[#4a090b] focus-within:ring-1 focus-within:ring-[#4a090b]/20'}`}>
                          <div className="px-4 py-3.5 border-r border-[#f3f4f6] text-[#4a090b] bg-[#fdfaf8]">
                            <Lock size={18} strokeWidth={2} />
                          </div>
                          <input
                            name="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            className="flex-1 bg-transparent border-none px-4 py-3.5 text-[14px] text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-0"
                          />
                        </div>
                        {errors.confirmPassword && <p className="text-xs font-medium mt-1 ml-1" style={{ color: '#ef4444' }}>{errors.confirmPassword}</p>}
                      </div>
                    )}
                  </div>

                  {/* Terms */}
                  {isRegister && (
                    <div className="flex items-start gap-2.5 pt-1">
                      <div
                        onClick={() => setAgreedToTerms(p => !p)}
                        className={`mt-0.5 w-[18px] h-[18px] rounded-[4px] border-[1.5px] flex items-center justify-center cursor-pointer shrink-0 transition-colors ${agreedToTerms ? 'bg-[#4a090b] border-[#4a090b]' : 'bg-white border-[#d1d5db]'}`}
                      >
                        {agreedToTerms && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <label onClick={() => setAgreedToTerms(p => !p)} className="text-[13px] text-[#4b5563] cursor-pointer select-none leading-snug">
                        I agree to the <span className="text-[#4a090b] font-bold hover:underline cursor-pointer">Terms & Conditions</span> and <span className="text-[#4a090b] font-bold hover:underline cursor-pointer">Privacy Policy</span>
                      </label>
                    </div>
                  )}
                  {errors.terms && <p className="text-[11px] font-bold" style={{ color: '#ef4444' }}>{errors.terms}</p>}

                  {/* Remember Me + Forgot Password */}
                  {!isRegister && (
                    <div className="flex items-center justify-between pt-1 pb-1">
                      <label className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="relative flex items-center justify-center w-[18px] h-[18px] rounded-[4px] border-[1.5px] border-[#d1d5db] group-hover:border-[#4a090b] transition-colors">
                          <input
                            type="checkbox"
                            checked={form.rememberMe}
                            onChange={(e) => setForm(prev => ({ ...prev, rememberMe: e.target.checked }))}
                            className="opacity-0 absolute inset-0 cursor-pointer"
                          />
                          {form.rememberMe && (
                            <div className="w-2.5 h-2.5 bg-[#4a090b] rounded-sm"></div>
                          )}
                        </div>
                        <span className="text-[13px] text-[#4b5563] group-hover:text-[#111827] transition-colors">Remember me</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => setIsForgotModalOpen(true)}
                        className="text-[13px] font-bold text-[#4a090b] hover:text-[#2a0506] hover:underline transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-[#550c0e] hover:bg-[#3a080a] text-white py-[15px] rounded-xl text-[15px] font-semibold transition-all shadow-[0_8px_20px_rgba(85,12,14,0.25)] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        {isRegister ? 'Create Account' : 'Sign In'}
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <div className="relative flex items-center py-3">
                    <div className="flex-grow border-t border-[#eadfdb]"></div>
                    <span className="flex-shrink-0 mx-4 text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Or continue with</span>
                    <div className="flex-grow border-t border-[#eadfdb]"></div>
                  </div>

                  <div className="flex justify-center pb-1">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="outline"
                      shape="rectangular"
                      size="large"
                      text={isRegister ? "signup_with" : "signin_with"}
                    />
                  </div>
                </form>
              </div>

              <div className="mt-8 text-center text-[12px] text-[#9ca3af] font-medium">
                © {new Date().getFullYear()} Lassi Lounge. All Rights Reserved.
              </div>
            </div>
          </div>
        </div>

        <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} defaultEmail={form.email} />

        {/* Blend the react-phone-number-input default styling into this
            card's look — the library ships unstyled-ish inputs so this
            keeps borders/colors consistent with the rest of the form. */}
        <style jsx global>{`
          .phone-field-wrap .PhoneInputInput {
            border: none;
            outline: none;
            background: transparent;
            font-size: 14px;
            color: #1a1a1a;
            height: 100%;
          }
          .phone-field-wrap .PhoneInputCountry {
            margin-right: 8px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <GlassCard className="w-full max-w-md relative overflow-hidden">
        {/* Decorative blurs */}
        <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-brand-green/20 blur-[60px]" />
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-brand-cyan/20 blur-[60px]" />

        <div className="relative">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-green to-brand-cyan mb-3">
              <ChefHat className="h-7 w-7 text-brand-bg" />
            </div>
            <h2 className="text-xl font-black text-brand-text">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-sm text-brand-muted mt-1">
              {isRegister ? 'Start ordering your favorite food' : 'Sign in to continue'}
            </p>
          </div>

          {/* NOTE: this is the multi-restaurant / non-single-mode form.
              I've only fixed the isSingleMode branch above since that's
              what NEXT_PUBLIC_SINGLE_RESTAURANT_MODE=true actually
              renders for this project. Tell me if this branch is still
              live somewhere and I'll mirror the same fixes here
              (phone picker, inline error banner, non-authenticating
              register call). */}

          {/* Toggle */}
          <div className="flex gap-1 rounded-xl bg-brand-bg/60 p-1 mb-6 border border-brand-border">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all
                ${!isRegister ? 'bg-gradient-to-r from-brand-green to-brand-cyan text-brand-bg' : 'text-brand-muted'}`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all
                ${isRegister ? 'bg-gradient-to-r from-brand-green to-brand-cyan text-brand-bg' : 'text-brand-muted'}`}
            >
              Register
            </button>
          </div>


          {/* Unverified email — special CTA banner */}
          {isUnverifiedEmail && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-4 mb-4">
              <div className="flex items-start gap-3">
                <MailCheck className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#fbbf24' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold leading-snug" style={{ color: '#fcd34d' }}>
                    Email not verified
                  </p>
                  <p className="text-[12px] mt-0.5 leading-snug" style={{ color: '#fde68a' }}>
                    Please verify your email to continue.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`)}
                className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-bold transition-all border border-amber-400/40"
                style={{ backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
              >
                <MailCheck className="h-4 w-4" />
                Go to Email Verification
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Generic error banner */}
          {formError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 mb-4">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#f87171' }} />
              <p className="text-sm font-semibold leading-snug" style={{ color: '#f87171' }}>{formError}</p>
            </div>
          )}


          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {isRegister && (
              <>
                <Input
                  name="name"
                  label="Full Name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  error={errors.name}
                  icon={User}
                />
                <div>
                  <label className="text-sm font-medium text-brand-muted">Phone Number</label>
                  <div className={`phone-field-wrap h-11 mt-1.5 rounded-xl border px-3 flex items-center bg-brand-card/60 ${errors.phone ? 'border-red-400' : 'border-brand-border'}`}>
                    <PhoneInput
                      international
                      defaultCountry="IN"
                      placeholder="Enter phone number"
                      value={form.phone}
                      onChange={handlePhoneChange}
                      className="w-full"
                    />
                  </div>
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                </div>
              </>
            )}

            <Input
              name="email"
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              icon={Mail}
            />

            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                error={errors.password}
                icon={Lock}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-brand-muted hover:text-brand-text transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {isRegister && (
              <div className="relative">
                <Input
                  name="confirmPassword"
                  type="password"
                  label="Confirm Password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  icon={Lock}
                />
              </div>
            )}

            {isRegister && (
              <div className="flex items-start gap-2">
                <div
                  onClick={() => setAgreedToTerms(p => !p)}
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center cursor-pointer shrink-0 transition-colors ${agreedToTerms ? 'bg-brand-primary border-brand-primary' : 'bg-white border-brand-divider'}`}
                >
                  {agreedToTerms && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <label onClick={() => setAgreedToTerms(p => !p)} className="text-sm text-brand-muted cursor-pointer select-none leading-snug">
                  I agree to the <span className="text-brand-cyan font-bold hover:underline cursor-pointer">Terms & Conditions</span> and <span className="text-brand-cyan font-bold hover:underline cursor-pointer">Privacy Policy</span>
                </label>
              </div>
            )}
            {errors.terms && <p className="text-red-500 text-xs font-bold">{errors.terms}</p>}

            {!isRegister && (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setForm(prev => ({ ...prev, rememberMe: !prev.rememberMe }))}
                  className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${form.rememberMe ? 'bg-brand-primary border-brand-primary' : 'bg-white border-brand-divider'}`}
                >
                  {form.rememberMe && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <label onClick={() => setForm(prev => ({ ...prev, rememberMe: !prev.rememberMe }))} className="text-sm text-brand-muted cursor-pointer select-none">
                  Remember me
                </label>
              </div>
            )}

            {isRegister && !isSingleMode && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-brand-muted">Account Type</label>
                <div className="flex gap-2">
                  {[
                    { value: 'customer', label: 'Customer' },
                    { value: 'merchant', label: 'Restaurant Owner' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, role: opt.value }))}
                      className={`flex-1 rounded-xl py-2.5 text-xs font-semibold border transition-all
                        ${form.role === opt.value
                          ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
                          : 'bg-brand-card/60 text-brand-muted border-brand-border hover:border-brand-cyan/20'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {isRegister ? 'Create Account' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-brand-border"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-semibold text-brand-muted uppercase">Or continue with</span>
              <div className="flex-grow border-t border-brand-border"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                shape="pill"
                size="large"
                text={isRegister ? "signup_with" : "signin_with"}
              />
            </div>
          </form>

          {!isRegister && (
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-xs text-brand-muted hover:text-brand-cyan transition-colors">
                Forgot your password?
              </button>
            </div>
          )}

        </div>

        {/* Discreet Admin Link */}
        <div className="mt-6 text-center border-t border-brand-border/50 pt-4">
          <Link href="/admin/login" className="text-[10px] text-brand-muted/70 hover:text-brand-cyan transition-colors uppercase tracking-widest">
            Restaurant Partner Login
          </Link>
        </div>
      </GlassCard>
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} defaultEmail={form.email} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}