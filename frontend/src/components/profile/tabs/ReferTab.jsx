'use client';

import { useState, useEffect } from 'react';
import { 
  Share2, Copy, Check, Users, Gift, ArrowRight, 
  Sparkles, Clock, CheckCircle2, Award, TrendingUp, Info,
  Smartphone, Download, Zap, ShieldCheck, Tag
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
  const myCoupon = referralData?.myCoupon;

  const refereeDiscount = program.refereeDiscountValue ?? 25;
  const referrerReward = program.referrerRewardValue ?? 25;
  const refereeMinOrder = program.refereeMinOrder ?? 30;
  const maxRewards = program.maxRewardsPerReferrer ?? 20;

  const remainingInvites = maxRewards > 0 ? Math.max(0, maxRewards - stats.rewarded) : null;
  const progressPercent = maxRewards > 0 ? Math.min(100, Math.round((stats.rewarded / maxRewards) * 100)) : 0;

  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.lassilounge.customer';
  const appStoreUrl = 'https://apps.apple.com/app/lassi-lounge/id6470000000';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Referral code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    showToast('App referral link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#7a0b10] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Smartphone className="w-3 h-3" /> App Exclusive Feature
          </span>
        </div>
        <h2 className="text-[22px] sm:text-[26px] font-black text-[#1a1a1a]">Refer &amp; Earn on Mobile App</h2>
        <p className="text-[13px] sm:text-[14px] text-[#6b7280]">
          Invite your friends to order on the Lassi Lounge Mobile App. Give them ${refereeDiscount} and earn ${referrerReward} for each friend!
        </p>
      </div>

      {/* Main Promo & Share Card */}
      <div className="bg-gradient-to-br from-[#7a0b10] via-[#50070a] to-[#2e0406] text-white rounded-3xl p-6 sm:p-8 md:p-10 relative overflow-hidden shadow-xl border border-[#9b1d23]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c99742]/15 rounded-full blur-2xl pointer-events-none translate-y-1/3 -translate-x-1/3" />

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#ffd700] text-[12px] font-bold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#ffd700]" /> Mobile App Referral Offer
          </div>

          <h3 className="text-[26px] sm:text-[34px] font-black tracking-tight leading-tight mb-3">
            Give ${refereeDiscount}, Get ${referrerReward}
          </h3>
          <p className="text-[14px] sm:text-[15px] text-[#fbe8e9] mb-7 leading-relaxed max-w-lg mx-auto">
            Friends get <strong className="text-white font-bold">${refereeDiscount} OFF</strong> their first mobile app order (${refereeMinOrder}+), and you get <strong className="text-[#ffd700] font-bold">${referrerReward} in loyalty points</strong> delivered straight to your app wallet!
          </p>

          {/* Referral Code Box */}
          <div className="bg-white rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center gap-2.5 shadow-2xl max-w-md mx-auto text-[#1a1a1a]">
            <div className="flex-1 text-center py-1 sm:py-2 px-3">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#6b7280] block">Your Referral Code</span>
              <span className="text-[20px] sm:text-[22px] font-mono font-black text-[#7a0b10] tracking-widest">{code}</span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyCode}
                className="flex-1 sm:flex-none h-11 px-5 rounded-xl bg-[#7a0b10] text-white text-[12px] font-black uppercase tracking-wider hover:bg-[#60080c] transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Copy referral code"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
              <button
                onClick={handleCopyLink}
                className="flex-1 sm:flex-none h-11 px-4 rounded-xl bg-[#FAF7F2] text-[#7a0b10] border border-[#C99742] text-[12px] font-black uppercase tracking-wider hover:bg-[#f3ece0] transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                title="Copy share link"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                {copiedLink ? 'Copied' : 'Share Link'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prominent Mobile App Install Banner */}
      <div className="bg-gradient-to-r from-[#FAF7F2] to-[#FFF9F5] rounded-3xl p-6 sm:p-8 border-2 border-[#C99742]/40 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#7a0b10] text-white flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-7 h-7 text-[#ffd700]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#7a0b10]">
                  Required for Rewards
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e]">
                  iOS &amp; Android
                </span>
              </div>
              <h4 className="text-[19px] sm:text-[22px] font-black text-[#111827] mt-1">
                Download the Lassi Lounge Mobile App
              </h4>
              <p className="text-[13px] sm:text-[14px] text-[#4b5563] mt-1 max-w-xl">
                Referral bonuses, welcome discounts, and code redemptions are <strong>exclusively available on our mobile app</strong>. Install now to apply your friend&apos;s code or track your earnings on the go!
              </p>
            </div>
          </div>

          {/* App Store / Play Store Buttons */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0 justify-center">
            <a
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#111827] hover:bg-black text-white transition-all shadow-md active:scale-95"
            >
              <svg className="w-5 h-5 fill-current text-[#34A853]" viewBox="0 0 24 24">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a1.987 1.987 0 0 1-.22-.924V2.738c0-.34.08-.656.219-.924zM15.207 13.414l2.428 2.428-11.45 6.47 9.022-8.898zm2.428-2.828l-2.428 2.428-9.022-8.898 11.45 6.47zm1.616 1.616l2.87 1.623c.899.508.899 1.332 0 1.84l-2.87 1.623-2.126-2.543 2.126-2.543z" />
              </svg>
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-gray-300 leading-none">Get it on</div>
                <div className="text-[13px] font-black tracking-wide leading-none mt-1">Google Play</div>
              </div>
            </a>

            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center gap-2.5 px-5 py-3 rounded-xl bg-[#111827] hover:bg-black text-white transition-all shadow-md active:scale-95"
            >
              <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.36-.57.65-1.07 1.72-.94 2.74 1 .08 2.03-.5 2.66-1.25z" />
              </svg>
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-gray-300 leading-none">Download on</div>
                <div className="text-[13px] font-black tracking-wide leading-none mt-1">App Store</div>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Info Notice: Code Entry is In-App Only */}
      <div className="bg-[#eff6ff] rounded-2xl p-4 sm:p-5 border border-[#bfdbfe] flex items-start gap-3.5">
        <Info className="w-5 h-5 text-[#2563eb] shrink-0 mt-0.5" />
        <div className="text-[13px] text-[#1e40af] leading-relaxed">
          <strong className="font-bold">Have a referral code from a friend?</strong> Referral codes cannot be applied on the website. Please install the <strong className="font-bold">Lassi Lounge Mobile App</strong> on your phone and enter the code during your first sign-in to unlock your <strong>${refereeDiscount} discount</strong>!
        </div>
      </div>

      {/* Welcome Reward Status Card (If User Applied a Code in App) */}
      {myCoupon && (
        <div className="bg-gradient-to-r from-[#ecfdf5] to-[#f0fdf4] rounded-3xl p-6 sm:p-7 border border-[#a7f3d0] shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-black uppercase tracking-wider text-[#047857]">
                    Your Mobile Welcome Reward
                  </span>
                  {myCoupon.used ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#e5e7eb] text-[#4b5563]">Redeemed</span>
                  ) : myCoupon.expired ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#fee2e2] text-[#b91c1c]">Expired</span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d]">Ready on Mobile App</span>
                  )}
                </div>
                <h4 className="text-[18px] sm:text-[20px] font-black text-[#111827] mt-0.5">
                  ${myCoupon.discount} OFF Your First Order
                </h4>
                <p className="text-[12px] sm:text-[13px] text-[#4b5563] mt-0.5">
                  Min order ${myCoupon.minOrder}+ • Open the mobile app at checkout to apply this reward.
                </p>
              </div>
            </div>

            <div className="bg-white px-4 py-2.5 rounded-xl border border-[#a7f3d0] font-mono font-black text-[#047857] text-[15px] tracking-wider select-all shadow-sm">
              {myCoupon.code}
            </div>
          </div>
        </div>
      )}

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
            <div className="text-[12px] font-bold text-[#1e40af] mt-0.5">Friends Joined &amp; Ordered</div>
            <div className="text-[11px] text-[#2563eb] mt-0.5">
              Delivered on mobile app
            </div>
          </div>

          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 text-center">
            <div className="text-[20px] font-black text-[#b45309]">
              {stats.pending}
            </div>
            <div className="text-[12px] font-bold text-[#92400e] mt-0.5">In Progress</div>
            <div className="text-[11px] text-[#b45309] mt-0.5">
              Pending first app order
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
              No friends have entered your code yet. Share your code to start earning!
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
                        {isRewarded ? `+$${referrerReward} Earned` : 'Installed App • Pending Order'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* How it Works on Mobile App */}
      <div>
        <h3 className="text-[18px] font-black text-[#1a1a1a] mb-5">How the Mobile Referral Program Works</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eadfdb] shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#f4f7f9] flex items-center justify-center mx-auto mb-4">
              <Share2 className="h-5 w-5 text-[#0ea5e9]" />
            </div>
            <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-2">1. Share Your Code</h4>
            <p className="text-[13px] text-[#6b7280]">Send your unique code or app download link to friends and family.</p>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eadfdb] shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#fdf2f2] flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-5 w-5 text-[#ef4444]" />
            </div>
            <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-2">2. Friend Installs App</h4>
            <p className="text-[13px] text-[#6b7280]">
              They install the Lassi Lounge App and apply your code to get ${refereeDiscount} OFF their first order (${refereeMinOrder}+).
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#eadfdb] shadow-sm text-center">
            <div className="w-12 h-12 rounded-full bg-[#f1fae8] flex items-center justify-center mx-auto mb-4">
              <Gift className="h-5 w-5 text-[#65a30d]" />
            </div>
            <h4 className="text-[15px] font-bold text-[#1a1a1a] mb-2">3. You Receive Points</h4>
            <p className="text-[13px] text-[#6b7280]">
              Once their first order is delivered, you automatically receive ${referrerReward} worth of loyalty points in your app!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
