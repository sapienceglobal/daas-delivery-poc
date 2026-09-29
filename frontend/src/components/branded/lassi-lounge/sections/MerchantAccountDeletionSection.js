'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Store, 
  Trash2, 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff,
  Smartphone,
  ShieldCheck
} from 'lucide-react';
import { authAPI } from '@/lib/api';

export default function MerchantAccountDeletionSection() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    reason: 'closing_business',
    confirmation: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.email || !formData.email.includes('@')) {
      setErrorMessage('Please enter a valid merchant email address associated with your store.');
      return;
    }

    if (!formData.password || formData.password.length < 4) {
      setErrorMessage('Please enter your merchant account password to verify your identity.');
      return;
    }

    if (formData.confirmation.trim().toUpperCase() !== 'DELETE') {
      setErrorMessage('Please type DELETE in capital letters to confirm permanent deletion.');
      return;
    }

    setLoading(true);

    try {
      const res = await authAPI.webDeleteAccount({
        email: formData.email.trim(),
        password: formData.password,
        accountType: 'merchant',
        reason: formData.reason,
        confirmation: formData.confirmation.trim().toUpperCase(),
      });

      if (res && (res.success || res.message)) {
        setSuccessResult({
          email: formData.email,
          message: res.message || 'Your merchant account and staff credentials have been permanently deleted.',
        });
      } else {
        setErrorMessage(res?.message || 'Failed to verify merchant account. Please check your credentials.');
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Verification failed. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative py-20 bg-[#faf9f8] text-[#1a1a1a] font-sans overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#cd131b]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#e8a020]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fdecec] text-[#a30f16] text-xs font-bold uppercase tracking-wider mb-6 border border-[#fad0d0]">
            <Store className="w-4 h-4 text-[#cd131b]" />
            <span className="text-[#a30f16]">Merchant &amp; Partner Platform</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold font-serif text-[#1a1a1a] mb-5 tracking-tight">
            Delete Merchant Account
          </h1>

          <p className="text-lg text-[#4b5563] leading-relaxed">
            Permanently delete your restaurant manager/merchant profile, unlink your staff credentials, and revoke store operational access.
          </p>
        </div>

        {/* Informational Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* What gets deleted */}
          <div className="bg-white p-7 rounded-3xl border border-[#e5e7eb] shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[#fdecec] flex items-center justify-center text-[#cd131b] mb-4">
              <Trash2 className="w-6 h-6 text-[#cd131b]" />
            </div>
            <h3 className="text-xl font-bold font-serif text-[#1a1a1a] mb-3">
              Data Permanently Removed
            </h3>
            <p className="text-sm text-[#4b5563] mb-4">
              Upon verifying your credentials, the following records are permanently erased:
            </p>
            <ul className="space-y-2 text-sm text-[#374151]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <span className="text-[#1a1a1a] font-medium">Merchant login credentials (Email, hashed password, staff PINs)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <span className="text-[#1a1a1a] font-medium">Active terminal sessions and merchant app push tokens</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <span className="text-[#1a1a1a] font-medium">Store manager administrative permissions and audit privileges</span>
              </li>
            </ul>
          </div>

          {/* What is retained */}
          <div className="bg-white p-7 rounded-3xl border border-[#e5e7eb] shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[#fef3c7] flex items-center justify-center text-[#d97706] mb-4">
              <FileCheck className="w-6 h-6 text-[#d97706]" />
            </div>
            <h3 className="text-xl font-bold font-serif text-[#1a1a1a] mb-3">
              Statutory Business Records
            </h3>
            <p className="text-sm text-[#4b5563] mb-4">
              In accordance with United States federal and New York commercial tax auditing laws:
            </p>
            <ul className="space-y-2 text-sm text-[#374151]">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                <span className="text-[#1a1a1a] font-medium">Historical sales receipts &amp; tax settlements (retained 7 years for IRS/state auditing)</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                <span className="text-[#1a1a1a] font-medium">Past payment processor settlement logs via Stripe Connect</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Deletion Form */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#e5e7eb] shadow-lg relative overflow-hidden">
          <div className="max-w-2xl mx-auto">
            {successResult ? (
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 bg-[#ecfdf5] text-[#16a34a] rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10 text-[#16a34a]" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#1a1a1a]">
                  Merchant Account Permanently Deleted
                </h3>
                <p className="text-[#4b5563] text-base leading-relaxed max-w-lg mx-auto">
                  Your merchant profile for <strong className="text-[#1a1a1a]">{successResult.email}</strong> has been completely removed from our active partner registry.
                </p>
                <div className="pt-4 flex items-center justify-center gap-4">
                  <Link
                    href="/restaurant-panel"
                    className="inline-block bg-[#cd131b] hover:bg-[#a30f16] text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-colors"
                  >
                    Back to Restaurant Panel
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#fdecec] text-[#cd131b] flex items-center justify-center">
                      <Store className="w-5 h-5 text-[#cd131b]" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-[#1a1a1a]">
                      Merchant Identity Verification
                    </h2>
                  </div>
                  <p className="text-sm text-[#4b5563]">
                    To authorize deletion of a merchant account, please provide your registered managerial email and password.
                  </p>
                </div>

                {errorMessage && (
                  <div className="mb-6 p-4 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#b91c1c] text-sm flex items-start gap-3 shadow-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#b91c1c]" />
                    <span className="font-medium text-[#b91c1c]">{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Registered Email */}
                  <div>
                    <label className="block text-sm font-bold text-[#1a1a1a] mb-2">
                      Registered Merchant Email <span className="text-[#cd131b]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="manager@lassilounge.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#d1d5db] bg-white text-[#111827] placeholder:text-[#9ca3af] font-medium focus:ring-2 focus:ring-[#cd131b] focus:border-[#cd131b] outline-none transition-all"
                    />
                  </div>

                  {/* Merchant Password */}
                  <div>
                    <label className="block text-sm font-bold text-[#1a1a1a] mb-2">
                      Merchant Account Password <span className="text-[#cd131b]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your merchant password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-3 pr-12 rounded-xl border border-[#d1d5db] bg-white text-[#111827] placeholder:text-[#9ca3af] font-medium focus:ring-2 focus:ring-[#cd131b] focus:border-[#cd131b] outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#111827] p-1"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-bold text-[#1a1a1a] mb-2">
                      Reason for Leaving (Optional)
                    </label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#d1d5db] bg-white text-[#111827] font-medium focus:ring-2 focus:ring-[#cd131b] focus:border-[#cd131b] outline-none transition-all"
                    >
                      <option value="closing_business">Restaurant closed or changing systems</option>
                      <option value="left_organization">Left company / no longer with restaurant</option>
                      <option value="privacy_security">Security or privacy concerns</option>
                      <option value="other">Other reason</option>
                    </select>
                  </div>

                  {/* Confirmation text */}
                  <div>
                    <label className="block text-sm font-bold text-[#1a1a1a] mb-2">
                      Type <span className="text-[#cd131b] font-mono font-bold bg-[#fdecec] px-2 py-0.5 rounded">DELETE</span> to confirm <span className="text-[#cd131b]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="DELETE"
                      value={formData.confirmation}
                      onChange={(e) => setFormData({ ...formData, confirmation: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#d1d5db] bg-white text-[#111827] placeholder:text-[#9ca3af] font-mono font-bold uppercase focus:ring-2 focus:ring-[#cd131b] focus:border-[#cd131b] outline-none transition-all"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#cd131b] hover:bg-[#a30f16] disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Lock className="w-5 h-5 animate-pulse" />
                        Verifying &amp; Deleting Merchant Account...
                      </span>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        <span>Permanently Delete Merchant Account</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* In-App Deletion Guide */}
        <div className="mt-12 bg-white rounded-3xl p-7 sm:p-9 border border-[#e5e7eb] shadow-sm">
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-12 h-12 rounded-2xl bg-[#fdecec] flex items-center justify-center text-[#cd131b] shrink-0">
              <Smartphone className="w-6 h-6 text-[#cd131b]" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif text-[#1a1a1a] mb-2">
                In-App Merchant Account Deletion
              </h3>
              <p className="text-sm text-[#4b5563] leading-relaxed mb-3">
                If you have the <strong>Lassi Lounge Merchant App</strong> installed on your restaurant Android device:
              </p>
              <div className="text-sm font-semibold text-[#111827] bg-[#faf9f8] p-4 rounded-xl border border-[#e5e7eb]">
                Open Merchant App &rarr; Tap Drawer / Settings &rarr; Select <span className="text-[#cd131b]">Delete Account</span> &rarr; Enter your password to instantly wipe credentials.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
