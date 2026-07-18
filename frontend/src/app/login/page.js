'use client';

import { useState, Suspense } from 'react';
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
  const { login, register, googleLogin } = useAuth();
  const isSingleMode = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'customer'
  });
  const [errors, setErrors] = useState({});

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
        router.push(redirectPath || '/customer');
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
      else router.push(redirectPath || '/customer/profile');
    } catch (err) {
      showToast(err.message || 'Google authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    showToast('Google Sign-In failed', 'error');
  };

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
