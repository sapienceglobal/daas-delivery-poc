'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Users, Gift, ArrowRight } from 'lucide-react';
import { showToast } from '@/components/ui';

export default function ReferTab({ user }) {
  const [copied, setCopied] = useState(false);
  const referralCode = user?.referralCode || 'LASSI100';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    showToast('Referral code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[24px] font-black text-[#1a1a1a]">Refer & Earn</h2>
        <p className="text-[14px] text-[#6b7280]">Share the love and get rewarded for every friend you refer.</p>
      </div>

      {/* Main Promo Banner */}
      <div className="bg-[#fcf3e3] rounded-3xl p-8 md:p-10 border border-[#f5a623] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Gift className="h-8 w-8 text-[#f5a623]" />
          </div>
          
          <h3 className="text-[28px] font-black text-[#1a1a1a] leading-tight mb-4">
            Give $10, Get $10
          </h3>
          <p className="text-[15px] text-[#4b5563] mb-8 leading-relaxed">
            Invite your friends to Lassi Lounge. They get $10 off their first order, and you get $10 in loyalty points once they order!
          </p>

          <div className="bg-white rounded-xl p-2 flex items-center shadow-sm border border-[#eadfdb] max-w-md mx-auto">
            <div className="flex-1 text-center">
              <span className="text-[20px] font-mono font-black text-[#7a0b10] tracking-widest">{referralCode}</span>
            </div>
            <button
              onClick={handleCopy}
              className="h-11 px-6 py-1 rounded-lg bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center gap-2"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {/* How it Works */}
      <div>
        <h3 className="text-[18px] font-black text-[#1a1a1a] mb-6">How it works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-[#eadfdb] shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#f4f7f9] flex items-center justify-center mx-auto mb-4">
              <Share2 className="h-5 w-5 text-[#0ea5e9]" />
            </div>
            <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-2">1. Share Code</h4>
            <p className="text-[13px] text-[#6b7280]">Send your unique referral code to friends and family.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#eadfdb] shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#fdf2f2] flex items-center justify-center mx-auto mb-4">
              <Users className="h-5 w-5 text-[#ef4444]" />
            </div>
            <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-2">2. Friend Orders</h4>
            <p className="text-[13px] text-[#6b7280]">They create an account and place their first order using your code.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#eadfdb] shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#f1fae8] flex items-center justify-center mx-auto mb-4">
              <Gift className="h-5 w-5 text-[#65a30d]" />
            </div>
            <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-2">3. You Earn</h4>
            <p className="text-[13px] text-[#6b7280]">You automatically receive $10 worth of loyalty points in your account!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
