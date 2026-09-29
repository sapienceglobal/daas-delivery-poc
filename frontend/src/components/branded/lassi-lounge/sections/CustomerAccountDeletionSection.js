'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  UserX, 
  Trash2, 
  FileCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Eye, 
  EyeOff,
  User,
  Smartphone
} from 'lucide-react';
import { authAPI } from '@/lib/api';

export default function CustomerAccountDeletionSection() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    reason: 'no_longer_needed',
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
      setErrorMessage('Please enter a valid email address associated with your customer account.');
      return;
    }

    if (!formData.password || formData.password.length < 4) {
      setErrorMessage('Please enter your account password to verify your identity.');
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
        accountType: 'customer',
        reason: formData.reason,
        confirmation: formData.confirmation.trim().toUpperCase(),
      });

      if (res && (res.success || res.message)) {
        setSuccessResult({
          email: formData.email,
          message: res.message || 'Your customer account and personal data have been permanently deleted.',
        });
      } else {
        setErrorMessage(res?.message || 'Failed to verify account. Please check your credentials.');
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Verification failed. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative py-20 bg-[#faf9f8] text-[#1a1a1a] overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#cd131b]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[#e8a020]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fdecec] text-[#a30f16] text-xs font-bold uppercase tracking-wider mb-6 border border-[#fad0d0]">
            <UserX className="w-4 h-4 text-[#cd131b]" />
            <span className="text-[#a30f16]">Customer Account &amp; Data Privacy</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold font-serif text-[#1a1a1a] mb-5 tracking-tight">
            Delete Customer Account
          </h1>

          <p className="text-lg text-[#4b5563] leading-relaxed">
            Permanently remove your Lassi Lounge food delivery account, saved delivery addresses, loyalty rewards, and personal profile data.
          </p>
        </div>

        {/* Informational Cards: What is Deleted vs Retained */}
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
              Upon verifying your credentials, the following data is permanently purged immediately:
            </p>
            <ul className="space-y-2 text-sm text-[#374151]">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <span className="text-[#1a1a1a] font-medium">Customer profile credentials (Name, email, phone number)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <span className="text-[#1a1a1a] font-medium">Saved delivery addresses &amp; payment method tokens</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <span className="text-[#1a1a1a] font-medium">Push notification tokens &amp; active login sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16a34a] shrink-0 mt-0.5" />
                <span className="text-[#1a1a1a] font-medium">Loyalty points, coupons &amp; saved cart items</span>
              </li>
            </ul>
          </div>

          {/* What is retained */}
          <div className="bg-white p-7 rounded-3xl border border-[#e5e7eb] shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[#fef3c7] flex items-center justify-center text-[#d97706] mb-4">
              <FileCheck className="w-6 h-6 text-[#d97706]" />
            </div>
            <h3 className="text-xl font-bold font-serif text-[#1a1a1a] mb-3">
              Statutory Records Retained
            </h3>
            <p className="text-sm text-[#4b5563] mb-4">
              In accordance with United States federal and New York commercial regulations:
            </p>
            <ul className="space-y-2 text-sm text-[#374151]">
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                <span className="text-[#1a1a1a] font-medium">Historical completed financial receipts (retained up to 7 years strictly for IRS/State tax audits)</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#d97706] shrink-0 mt-0.5" />
                <span className="text-[#1a1a1a] font-medium">Anonymized past dispute &amp; fraud logs</span>
              </li>
            </ul>
            <div className="mt-4 p-3 rounded-xl bg-[#faf9f8] border border-[#e5e7eb] text-xs text-[#6b7280]">
              <em>Note: Retained records are decoupled from your email and cannot be used for login or marketing.</em>
            </div>
          </div>
        </div>

        {/* Deletion Form / Confirmation Container */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-[#e5e7eb] shadow-lg relative overflow-hidden">
          <div className="max-w-2xl mx-auto">
            {successResult ? (
              <div className="text-center py-8 space-y-6">
                <div className="w-16 h-16 bg-[#ecfdf5] text-[#16a34a] rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10 text-[#16a34a]" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold font-serif text-[#1a1a1a]">
                  Customer Account Permanently Deleted
                </h3>
                <p className="text-[#4b5563] text-base leading-relaxed max-w-lg mx-auto">
                  Your customer account for <strong className="text-[#1a1a1a]">{successResult.email}</strong> and all personal records have been permanently erased from our active databases.
                </p>
                <div className="p-4 rounded-2xl bg-[#faf9f8] border border-[#e5e7eb] text-sm text-[#6b7280] max-w-md mx-auto">
                  Your active sessions have been invalidated. If you ever wish to order again, you can create a new account anytime.
                </div>
                <div className="pt-4 flex items-center justify-center gap-4">
                  <Link
                    href="/"
                    className="inline-block bg-[#cd131b] hover:bg-[#a30f16] text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-colors"
                  >
                    Return to Homepage
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-[#fdecec] text-[#cd131b] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#cd131b]" />
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-[#1a1a1a]">
                      Customer Identity Verification
                    </h2>
                  </div>
                  <p className="text-sm text-[#4b5563]">
                    To protect against unauthorized deletion, please enter your registered customer email and account password.
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
                      Registered Customer Email <span className="text-[#cd131b]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="yourname@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#d1d5db] bg-white text-[#111827] placeholder:text-[#9ca3af] font-medium focus:ring-2 focus:ring-[#cd131b] focus:border-[#cd131b] outline-none transition-all"
                    />
                  </div>

                  {/* Account Password for Security Verification */}
                  <div>
                    <label className="block text-sm font-bold text-[#1a1a1a] mb-2">
                      Account Password <span className="text-[#cd131b]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Enter your customer password"
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
                    <p className="text-xs text-[#6b7280] mt-1.5">
                      Required to verify that you are the authentic owner of this customer account.
                    </p>
                  </div>

                  {/* Reason for Deletion */}
                  <div>
                    <label className="block text-sm font-bold text-[#1a1a1a] mb-2">
                      Reason for Deletion (Optional)
                    </label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#d1d5db] bg-white text-[#111827] font-medium focus:ring-2 focus:ring-[#cd131b] focus:border-[#cd131b] outline-none transition-all"
                    >
                      <option value="no_longer_needed">I no longer need this account</option>
                      <option value="privacy_concerns">Privacy or data security concerns</option>
                      <option value="too_many_notifications">Too many emails / notifications</option>
                      <option value="relocated">Relocated outside New York</option>
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
                    <p className="text-xs text-[#b91c1c] font-medium mt-1.5">
                      Warning: Once confirmed, your customer account, points, and saved addresses will be deleted permanently.
                    </p>
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
                        Verifying &amp; Deleting Customer Account...
                      </span>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        <span>Permanently Delete My Customer Account</span>
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
                Prefer In-App Immediate Deletion?
              </h3>
              <p className="text-sm text-[#4b5563] leading-relaxed mb-3">
                If you have the <strong>Lassi Lounge Customer App</strong> installed on your Android or iPhone device, you can delete your account directly inside the app:
              </p>
              <div className="text-sm font-semibold text-[#111827] bg-[#faf9f8] p-4 rounded-xl border border-[#e5e7eb]">
                Open App &rarr; Tap Menu / Profile &rarr; Select <span className="text-[#cd131b]">Delete Account</span> &rarr; Enter your password to instantly wipe your profile.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
