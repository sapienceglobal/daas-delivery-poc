'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Layers, Activity } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button, showToast } from '@/components/ui';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isAdmin, loading: authLoading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Auto redirect if already authenticated as Super Admin
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else if (user.role === 'merchant') {
        setFormError('You are currently signed in with a merchant account. Please logout to access the Super Admin control plane.');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setFormError('Please enter both administrator email and password.');
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      const res = await login(email.trim(), password, true);
      const userRole = res?.role || res?.user?.role;
      if (userRole === 'admin') {
        showToast('Super Admin authenticated successfully', 'success');
        router.push('/admin');
      } else {
        await logout();
        setFormError('Access Denied: This console is strictly reserved for Platform Super Administrators. Restaurant store merchants must login via /restaurant-panel.');
      }
    } catch (err) {
      setFormError(err.message || 'Invalid administrator credentials. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#07090e] text-slate-100 relative overflow-hidden">
      {/* Ambient Radial Lights */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-indigo-500/15 via-blue-600/10 to-transparent rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Matrix Grid */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)`,
          backgroundSize: '36px 36px'
        }}
      />

      <div className="w-full max-w-[440px] relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 text-indigo-400 shadow-2xl shadow-indigo-500/20 mb-1 relative group">
            <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 blur-lg group-hover:blur-xl transition-all" />
            <Layers className="h-8 w-8 relative z-10" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SaaS Control Plane v2.4
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Platform Super Admin</h1>
            <p className="text-xs text-slate-400 mt-1">Global Multi-Tenancy & White-Label Infrastructure</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-2xl p-7 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] relative space-y-5">
          {formError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 leading-relaxed flex items-start gap-2.5">
              <div className="h-4 w-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5 text-red-400 font-bold text-[10px]">!</div>
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Admin Email Address
              </label>
              <div className="relative flex items-center bg-slate-950/70 border border-slate-800 rounded-xl focus-within:border-indigo-500/70 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-hidden">
                <div className="pl-3.5 pr-2 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFormError(''); }}
                  placeholder="admin@platform.com"
                  className="w-full bg-transparent py-2.5 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Security Password
              </label>
              <div className="relative flex items-center bg-slate-950/70 border border-slate-800 rounded-xl focus-within:border-indigo-500/70 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all overflow-hidden">
                <div className="pl-3.5 pr-2 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFormError(''); }}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-200 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-lg shadow-indigo-600/25 transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Control Plane <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800/80 text-center">
            <a
              href="/restaurant-panel"
              className="text-xs text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5"
            >
              Looking for individual restaurant portal? <span className="text-indigo-400 font-semibold underline">Go to Merchant Portal</span>
            </a>
          </div>
        </div>

        {/* Security Trust Footer */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/80" /> TLS 1.3 Encrypted
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-indigo-400/80" /> Multi-Tenant Sharding Active
          </span>
        </div>
      </div>
    </div>
  );
}
