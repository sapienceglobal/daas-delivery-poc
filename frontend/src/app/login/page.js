'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, User, Phone, Eye, EyeOff, ChefHat, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { GlassCard, Input, Button, showToast, Badge } from '@/components/ui';
import { GoogleLogin } from '@react-oauth/google';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Min 8 characters').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 'Requires uppercase, lowercase, number & special char'),
});

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';
  const { login, register, googleLogin, isAuthenticated, user, loading: authLoading } = useAuth();
  const isSingleMode = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'customer'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'merchant') router.push('/merchant');
      else router.push(redirectPath || '/customer');
    }
  }, [authLoading, isAuthenticated, user, router, redirectPath]);

  // If we are authenticated, return a loader while we redirect
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#7a0b10]" />
      </div>
    );
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
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
    if (!validate()) return;

    setLoading(true);
    try {
      let userData;
      if (isRegister) {
        userData = await register(form);
        showToast('Account created successfully!', 'success');
      } else {
        userData = await login(form.email, form.password);
        showToast('Welcome back!', 'success');
      }

      // Role-based routing
      if (userData?.role === 'merchant') {
        router.push('/merchant');
      } else if (userData?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push(redirectPath || (isSingleMode ? '/customer/restaurant/lassi-lounge' : '/customer'));
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const userData = await googleLogin(credentialResponse.credential, form.role);
      showToast(isRegister ? 'Account created via Google!' : 'Signed in via Google!', 'success');
      
      if (userData.role === 'admin') router.push('/admin');
      else if (userData.role === 'merchant') router.push('/merchant');
      else router.push(redirectPath || (isSingleMode ? '/customer/restaurant/lassi-lounge' : '/customer/profile'));
    } catch (err) {
      showToast(err.message || 'Google authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    showToast('Google Sign-In failed', 'error');
  };

  if (isSingleMode) {
    return (
      <div className="flex items-center justify-center min-h-[75vh] bg-[#fdfbf7] px-4 font-sans py-12">
        <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl overflow-hidden border border-[#eadfdb] animate-fadeIn relative">
          
          {/* Top Banner Accent */}
          <div className="h-2 w-full bg-[#7a0b10]" />

          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-[26px] font-black text-[#1a1a1a] mb-1">
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-[14px] text-[#6b7280]">
                {isRegister ? 'Join Lassi Lounge today' : 'Sign in to your account'}
              </p>
            </div>

            {/* Toggle */}
            <div className="flex bg-[#f4f7f9] p-1 rounded-xl mb-8 border border-[#eadfdb]">
              <button
                onClick={() => setIsRegister(false)}
                className={`flex-1 rounded-lg py-2.5 text-[14px] font-bold transition-all ${
                  !isRegister ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#6b7280] hover:text-[#1a1a1a]'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsRegister(true)}
                className={`flex-1 rounded-lg py-2.5 text-[14px] font-bold transition-all ${
                  isRegister ? 'bg-white text-[#1a1a1a] shadow-sm' : 'text-[#6b7280] hover:text-[#1a1a1a]'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-[12px] font-bold text-[#4b5563] mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9ca3af]" />
                      <input
                        name="name"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={handleChange}
                        className={`w-full h-12 pl-10 pr-4 rounded-xl border focus:ring-1 outline-none transition-colors text-[14px] bg-[#f9f9f9] text-[#1a1a1a] ${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-[#eadfdb] focus:border-[#7a0b10] focus:ring-[#7a0b10]'}`}
                      />
                    </div>
                    {errors.name && <p className="text-red-500 text-[11px] mt-1 font-bold">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-[12px] font-bold text-[#4b5563] mb-1.5">Phone (Optional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9ca3af]" />
                      <input
                        name="phone"
                        placeholder="(555) 000-0000"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-[#7a0b10] focus:ring-1 outline-none transition-colors text-[14px] bg-[#f9f9f9] text-[#1a1a1a]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9ca3af]" />
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className={`w-full h-12 pl-10 pr-4 rounded-xl border focus:ring-1 outline-none transition-colors text-[14px] bg-[#f9f9f9] text-[#1a1a1a] ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-[#eadfdb] focus:border-[#7a0b10] focus:ring-[#7a0b10]'}`}
                  />
                </div>
                {errors.email && <p className="text-red-500 text-[11px] mt-1 font-bold">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1.5">Password</label>
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
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[#7a0b10] text-white text-[14px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-[#eadfdb]"></div>
                <span className="flex-shrink-0 mx-4 text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Or continue with</span>
                <div className="flex-grow border-t border-[#eadfdb]"></div>
              </div>

              <div className="flex justify-center pb-2">
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

            {!isRegister && (
              <div className="mt-6 text-center">
                <Link href="/forgot-password" className="text-[13px] font-bold text-[#7a0b10] hover:underline">
                  Forgot your password?
                </Link>
              </div>
            )}
          </div>
        </div>
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
                <Input
                  name="phone"
                  label="Phone (Optional)"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={handleChange}
                  icon={Phone}
                />
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
              <Link href="/forgot-password" className="text-xs text-brand-muted hover:text-brand-cyan transition-colors">
                Forgot your password?
              </Link>
            </div>
          )}

        </div>
      </GlassCard>
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
