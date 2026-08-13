'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, ArrowRight, Loader2, CheckCircle, Eye, EyeOff, ShoppingBag, Bike, Calendar, Tag, Star, Clock } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import { useBrand } from '@/context/BrandContext';
import { z } from 'zod';

const schema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/, 'Password requires uppercase, lowercase, number & special char'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const customerFeatures = [
  { icon: ShoppingBag, label: 'Easy\nOrdering' },
  { icon: Bike, label: 'Fast\nDelivery' },
  { icon: Calendar, label: 'Table\nBooking' },
  { icon: Tag, label: 'Exclusive\nOffers' },
  { icon: Star, label: 'Rewards &\nLoyalty' },
  { icon: Clock, label: 'Live Order\nTracking' },
];

export default function ResetPasswordPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const token = unwrappedParams.token;
  const { brand } = useBrand();

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      schema.parse(form);
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors = {};
        const issues = err.errors || err.issues || [];
        issues.forEach(e => {
          newErrors[e.path[0]] = e.message;
        });
        setErrors(newErrors);
        return;
      }
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, form.password);
      setSuccess(true);
      showToast('Password reset successful', 'success');
    } catch (err) {
      showToast(err.message || 'The reset link is invalid or has expired', 'error');
    } finally {
      setLoading(false);
    }
  };

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
              <div className="relative w-[480px] h-[180px]">
                <Image
                  src="/assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png"
                  alt="Lassi Lounge"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <h2 className="text-[28px] font-serif text-[#c99742] mb-4">
              Secure Your Account
            </h2>
            <div className="flex items-center justify-center mb-6 w-full">
              <div className="w-2 h-2 rotate-45 bg-[#c99742] mr-2 opacity-50"></div>
              <div className="w-2 h-2 rotate-45 border border-[#c99742]"></div>
              <div className="w-2 h-2 rotate-45 bg-[#c99742] ml-2 opacity-50"></div>
            </div>

            <p className="text-white/90 text-[15px] leading-relaxed mb-10">
              Choose a strong password to protect your<br />Lassi Lounge profile.
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
        <div className="w-full lg:w-[50%] h-full flex flex-col bg-[#fcfdfc] relative items-center px-6 lg:px-16 py-6 lg:py-8 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

          <div className="absolute top-[-5%] right-[-5%] w-64 h-64 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNMzAgMjBDMjAgMzAgMjAgNTAgMzAgNjBMMTAwIDEwMEM5MCA4MCA3MCA4MCA2MCA3MEwxMCAyMEMyMCAxMCA0MCAxMCAzMCAyMFoiIGZpbGw9IiNmMmVhZTQiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PC9zdmc+')] bg-no-repeat bg-contain opacity-20 pointer-events-none rotate-45" />
          <div className="absolute bottom-[5%] right-[5%] w-48 h-48 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjQgNCIvPjxwYXRoIGQ9Ik01MCAxMEMzMCAzMCA3MCA3MCA1MCA5MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] bg-no-repeat bg-contain opacity-30 pointer-events-none -rotate-12" />
          <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNMTUgNTBDMTUgMzAgMzAgMTUgNTAgMTVMMTAwIDBDODAgMjAgODAgNTAgMTAwIDcwQzgwIDkwIDUwIDkwIDUwIDcwQzMwIDcwIDE1IDkwIDE1IDUwWiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZjJlYWU0IiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=')] bg-no-repeat bg-contain opacity-20 pointer-events-none rotate-[30deg]" />

          <div className="w-full mx-auto z-10 my-auto max-w-[440px]">

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
              <h2 className="text-[32px] font-serif text-[#4a090b] mb-3">
                Reset Password
              </h2>
              <div className="flex items-center justify-center mb-4 w-full">
                <div className="w-10 h-[1px] bg-[#c99742]"></div>
                <div className="w-1.5 h-1.5 rotate-45 bg-[#c99742] mx-2"></div>
                <div className="w-10 h-[1px] bg-[#c99742]"></div>
              </div>
              <p className="text-[#6b7280] text-[15px]">
                Create a new password to secure your account.
              </p>
            </div>

            <div className="bg-white rounded-3xl shadow-[0_12px_40px_rgb(0,0,0,0.06)] p-8 sm:p-10 border border-[#f9fafb] relative overflow-hidden">

              {success ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 bg-[#fdfaf8] text-[#4a090b] rounded-full flex items-center justify-center mx-auto border border-[#f3f4f6]">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-bold text-[#1f2937] mb-2">Password Reset Successful</h3>
                    <p className="text-[#6b7280] text-[13px] leading-relaxed">
                      Your password has been securely updated. You can now log in using your new credentials.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center gap-2 bg-[#550c0e] hover:bg-[#3a080a] text-white py-[14px] rounded-xl text-[14px] font-bold transition-all shadow-[0_6px_16px_rgba(85,12,14,0.2)] uppercase tracking-wider"
                    >
                      Continue to Login
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <label className="text-[13px] font-bold text-[#1f2937] block mb-2">New Password</label>
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
                    <p className="text-[11px] text-[#6b7280] mt-2 font-medium leading-relaxed">
                      Must be at least 8 characters containing an uppercase, lowercase, number, and special character.
                    </p>
                  </div>

                  <div>
                    <label className="text-[13px] font-bold text-[#1f2937] block mb-2">Confirm Password</label>
                    <div className={`relative flex items-center bg-white border rounded-xl overflow-hidden transition-all ${errors.confirmPassword ? 'border-red-300 ring-1 ring-red-300' : 'border-[#e5e7eb] focus-within:border-[#4a090b] focus-within:ring-1 focus-within:ring-[#4a090b]/20'}`}>
                      <div className="px-4 py-3.5 border-r border-[#f3f4f6] text-[#4a090b] bg-[#fdfaf8]">
                        <Lock size={18} strokeWidth={2} />
                      </div>
                      <input
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        className="flex-1 bg-transparent border-none px-4 py-3.5 text-[14px] text-[#1f2937] placeholder-[#9ca3af] focus:outline-none focus:ring-0"
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-xs font-medium mt-1 ml-1" style={{ color: '#ef4444' }}>{errors.confirmPassword}</p>}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-[#550c0e] hover:bg-[#3a080a] text-white py-[14px] rounded-xl text-[14px] font-bold transition-all shadow-[0_6px_16px_rgba(85,12,14,0.2)] disabled:opacity-60 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Reset Password
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="mt-6 text-center border-t border-[#f3f4f6] pt-4">
              <Link href="/login" className="text-[11px] text-[#9ca3af] hover:text-[#4a090b] transition-colors uppercase tracking-widest font-semibold">
                &larr; Back to Login
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
