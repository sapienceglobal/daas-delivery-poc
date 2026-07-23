'use client';

import { useState } from 'react';
import { Mail, ArrowRight, Loader2, ArrowLeft, X } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import { z } from 'zod';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
});

export default function ForgotPasswordModal({ isOpen, onClose, defaultEmail = '' }) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      schema.parse({ email });
      setError('');
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }

    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
      showToast('Reset link sent to your email', 'success');
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8B93D]/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        <div className="p-8 relative z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black font-serif text-[#1a1a1a] mb-2 tracking-tight">
              Reset Password
            </h2>
            <p className="text-[13px] text-[#4b5563]">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">Check your email</h3>
                <p className="text-[#4b5563] text-sm">
                  We've sent a password reset link to <br/><strong>{email}</strong>
                </p>
              </div>
              <div className="pt-4">
                <button 
                  onClick={onClose}
                  className="inline-flex items-center justify-center w-full h-12 rounded-xl bg-[#f3f4f6] text-[#1a1a1a] text-[14px] font-bold hover:bg-[#e5e7eb] transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9ca3af]" />
                  <input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    autoFocus
                    className={`w-full h-12 pl-10 pr-4 rounded-xl border focus:ring-1 outline-none transition-colors text-[14px] bg-[#f9f9f9] text-[#1a1a1a] ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-[#eadfdb] focus:border-[#7a0b10] focus:ring-[#7a0b10]'}`}
                  />
                </div>
                {error && <p className="text-red-500 text-[11px] mt-1 font-bold">{error}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl bg-[#7a0b10] text-white text-[14px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Reset Link
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9ca3af] hover:text-[#1a1a1a] transition-colors z-[100] cursor-pointer p-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
