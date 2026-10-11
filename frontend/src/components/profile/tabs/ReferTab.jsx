'use client';

import { useState, useEffect } from 'react';
import { 
  Share2, Copy, Check, Users, Gift, ArrowRight, 
  Sparkles, Clock, CheckCircle2, Award, TrendingUp, Info
} from 'lucide-react';
import { referralAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function ReferTab({ user }) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralInfo();
  }, []);

  const fetchReferralInfo = async () => {
    try {
      setLoading(true);
      const res = await referralAPI.getMyReferral();
      if (res?.data) {
        setReferralData(res.data);
      }
    } catch (err) {
      console.error('Failed to load referral details', err);
    } finally {
      setLoading(false);
    }
  };

  const code = referralData?.code || user?.referralCode || 'LASSI100';
  const shareLink = referralData?.shareLink || `https://lassiloungeny.com/ref/${code}`;
  
  const program = referralData?.program || {};
  const stats = referralData?.stats || { invited: 0, pending: 0, rewarded: 0, pointsEarned: 0 };
  const friends = referralData?.friends || [];

  const refereeDiscount = program.refereeDiscountValue ?? 25;
  const referrerReward = program.referrerRewardValue ?? 25;
  const refereeMinOrder = program.refereeMinOrder ?? 30;
  const maxRewards = program.maxRewardsPerReferrer ?? 20;

  const remainingInvites = maxRewards > 0 ? Math.max(0, maxRewards - stats.rewarded) : null;
  const progressPercent = maxRewards > 0 ? Math.min(100, Math.round((stats.rewarded / maxRewards) * 100)) : 0;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Referral code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    showToast('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[20px] sm:text-[24px] font-black text-[#1a1a1a]">Refer &amp; Earn</h2>
        <p className="text-[13px] sm:text-[14px] text-[#6b7280]">
          Invite your friends, share the savings, and earn loyalty points on every delivered order.
        </p>
      </div>

      {/* Main Promo Banner with Dynamic Config */}
      <div className="bg-[#fcf3e3] rounded-3xl p-6 sm:p-8 md:p-10 border border-[#f5a623] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-sm border border-[#f5a623]/30">
            <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-[#7a0b10]" />
          </div>
          
          <h3 className="text-[24px] sm:text-[28px] font-black text-[#1a1a1a] leading-tight mb-3 sm:mb-4">
            Give ${refereeDiscount}, Get ${referrerReward}
          </h3>
          <p className="text-[14px] sm:text-[15px] text-[#4b5563] mb-6 sm:mb-8 leading-relaxed">
            Invite your friends to Lassi Lounge. They get <strong className="text-[#1a1a1a] font-bold">${refereeDiscount} off</strong> their first order (min order ${refereeMinOrder}), and you get <strong className="text-[#7a0b10] font-bold">${referrerReward} in loyalty points</strong> once their order is delivered!
          </p>

          <div className="bg-white rounded-2xl p-2.5 flex flex-col sm:flex-row items-center gap-2 shadow-sm border border-[#eadfdb] max-w-md mx-auto">
            <div className="flex-1 text-center py-1">
              <span className="text-[18px] sm:text-[20px] font-mono font-black text-[#7a0b10] tracking-widest">{code}</span>
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={handleCopyCode}
                className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-[#7a0b10] text-white text-[12px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center justify-center gap-1.5"
                title="Copy code"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Code'}
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-[#FAF7F2] text-[#4A0E13] border border-[#C99742] text-[12px] font-black uppercase tracking-wider hover:bg-[#f3ece0] transition-colors flex items-center justify-center gap-1.5"
                title="Copy share link"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                {copiedLink ? 'Copied' : 'Link'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Referral Stats & Activity Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#e5e7eb] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#f3f4f6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fee2e2] flex items-center justify-center text-[#8b0000]">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-[#111827]">Your Referral Activity &amp; Earnings</h3>
              <p className="text-[12px] text-[#6b7280]">
                {maxRewards > 0 
                  ? `${stats.rewarded} of ${maxRewards} rewards claimed` 
                  : `${stats.rewarded} friends completed`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-[#FAF7F2] text-[#4A0E13] border border-[#C99742]">
              {remainingInvites !== null ? `${remainingInvites} Invites Left` : 'Unlimited Invites'}
            </span>
          </div>
        </div>

        {/* Progress bar if capped */}
        {maxRewards > 0 && (
          <div className="mb-6">
            <div className="w-full bg-[#f3f4f6] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#C99742] h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[#6b7280] font-medium mt-1.5">
              <span>{stats.rewarded} completed</span>
              <span>Limit: {maxRewards} friends</span>
            </div>
          </div>
        )}

        {/* 3 Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
          <div className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-2xl p-4 text-center">
            <div className="text-[20px] font-black text-[#047857]">
              {stats.pointsEarned > 0 ? `${stats.pointsEarned.toLocaleString()} pts` : '0 pts'}
            </div>
            <div className="text-[12px] font-bold text-[#065f46] mt-0.5">Points Earned</div>
            <div className="text-[11px] text-[#047857] mt-0.5">
              ${(stats.rewarded * referrerReward).toFixed(0)} value in food
            </div>
          </div>

          <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-2xl p-4 text-center">
            <div className="text-[20px] font-black text-[#1d4ed8]">
              {stats.rewarded}
            </div>
            <div className="text-[12px] font-bold text-[#1e40af] mt-0.5">Completed Friends</div>
            <div className="text-[11px] text-[#2563eb] mt-0.5">
              Delivered &amp; rewarded
            </div>
          </div>

          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 text-center">
            <div className="text-[20px] font-black text-[#b45309]">
              {stats.pending}
            </div>
            <div className="text-[12px] font-bold text-[#92400e] mt-0.5">In Progress</div>
            <div className="text-[11px] text-[#b45309] mt-0.5">
              Waiting for first order
            </div>
          </div>
        </div>

        {/* Friends Activity List */}
        <div>
          <h4 className="text-[13px] font-bold text-[#111827] mb-3">
            Friend Redemptions ({friends.length})
          </h4>

          {friends.length === 0 ? (
            <div className="bg-[#f9fafb] border border-[#f3f4f6] rounded-2xl p-5 text-center text-[#6b7280] text-[13px] flex items-center justify-center gap-2">
              <Info className="w-4 h-4 text-[#9ca3af]" />
              No friends have entered your code yet. Share your code above to start earning!
            </div>
          ) : (
            <div className="space-y-2">
              {friends.slice(0, 6).map((friend, idx) => {
                const isRewarded = friend.status === 'rewarded';
                return (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#f9fafb] border border-[#f3f4f6]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        isRewarded ? 'bg-[#d1fae5] text-[#047857]' : 'bg-[#fef3c7] text-[#b45309]'
                      }`}>
                        {isRewarded ? <Check className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#111827]">{friend.name}</div>
                        <div className="text-[11px] text-[#9ca3af]">
                          {friend.date ? new Date(friend.date).toLocaleDateString() : 'Joined'}
                        </div>
                      </div>
                    </div>

                    <div>
                      <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold border ${
                        isRewarded 
                          ? 'bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]' 
                          : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'
                      }`}>
                        {isRewarded ? `+$${referrerReward} Earned` : 'Joined • Pending Order'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* How it Works */}
      <div>
        <h3 className="text-[18px] font-black text-[#1a1a1a] mb-6">How it works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eadfdb] shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#f4f7f9] flex items-center justify-center mx-auto mb-4">
              <Share2 className="h-5 w-5 text-[#0ea5e9]" />
            </div>
            <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-2">1. Share Code</h4>
            <p className="text-[13px] text-[#6b7280]">Send your unique code or link to friends and family.</p>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eadfdb] shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#fdf2f2] flex items-center justify-center mx-auto mb-4">
              <Users className="h-5 w-5 text-[#ef4444]" />
            </div>
            <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-2">2. Friend Orders</h4>
            <p className="text-[13px] text-[#6b7280]">
              They get ${refereeDiscount} off their first order of ${refereeMinOrder}+.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eadfdb] shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#f1fae8] flex items-center justify-center mx-auto mb-4">
              <Gift className="h-5 w-5 text-[#65a30d]" />
            </div>
            <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-2">3. You Earn</h4>
            <p className="text-[13px] text-[#6b7280]">
              You automatically receive ${referrerReward} worth of loyalty points upon delivery!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
