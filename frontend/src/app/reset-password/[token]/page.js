'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { GlassCard, showToast } from '@/components/ui';
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

export default function ResetPasswordPage({ params }) {
  const router = useRouter();
  const token = params.token;
  
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
        err.errors.forEach(e => {
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
    <div className="flex items-center justify-center min-h-[70vh]">
      <GlassCard className="w-full max-w-md relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8B93D]/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#7a0b10]/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

        <div className="p-8 md:p-10 relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black font-serif text-[#1a1a1a] mb-2 tracking-tight">
              Create New Password
            </h1>
            <p className="text-[14px] text-[#4b5563]">
              Your new password must be different from previous used passwords.
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">Password Reset</h3>
                <p className="text-[#4b5563] text-sm">
                  Your password has been reset successfully. You can now log in with your new password.
                </p>
              </div>
              <div className="pt-4">
                <Link 
                  href="/login"
                  className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-[#7a0b10] text-white text-[14px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors"
                >
                  Continue to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9ca3af]" />
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className={`w-full h-12 pl-10 pr-10 rounded-xl border focus:ring-1 outline-none transition-colors text-[14px] bg-[#f9f9f9] text-[#1a1a1a] ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-[#eadfdb] focus:border-[#7a0b10] focus:ring-[#7a0b10]'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-[11px] mt-1 font-bold">{errors.password}</p>}
                <p className="text-[11px] text-[#6b7280] mt-2">
                  Must be at least 8 characters containing an uppercase, lowercase, number, and special character.
                </p>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9ca3af]" />
                  <input
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={`w-full h-12 pl-10 pr-4 rounded-xl border focus:ring-1 outline-none transition-colors text-[14px] bg-[#f9f9f9] text-[#1a1a1a] ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-[#eadfdb] focus:border-[#7a0b10] focus:ring-[#7a0b10]'}`}
                  />
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-[11px] mt-1 font-bold">{errors.confirmPassword}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[#7a0b10] text-white text-[14px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset Password
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
