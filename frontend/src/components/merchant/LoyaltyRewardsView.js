import React, { useState, useEffect } from 'react';
import { Search, Crown, ArrowUpRight, ArrowDownRight, Gift, Activity, TrendingUp, Clock, FileText, Star } from 'lucide-react';
import StatCard from './StatCard';
import { loyaltyAPI } from '@/lib/api';
import { showToast, PageLoader } from '@/components/ui';

export default function LoyaltyRewardsView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // setLoading(true);
      const res = await loyaltyAPI.getStats();
      setStats(res?.data);
    } catch (err) {
      console.error('Failed to load loyalty stats', err);
      showToast('Failed to load loyalty data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (msg) => {
    showToast(`${msg} coming soon`, 'info');
  };

  if (loading || !stats) {
    return <PageLoader text="Loading Loyalty Rewards..." />;
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Title Area */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-[#111827]">Loyalty & Rewards</h1>
          <p className="text-sm text-[#6b7280] mt-1">Track customer engagement, points issued, and rewards redeemed.</p>
        </div>
        <div>
          <button onClick={() => handleAction('Edit Program Rules')} className="flex items-center gap-1.5 bg-[#8b0000] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#7f0000] transition-colors shadow-sm">
            <SettingsIcon className="w-4 h-4" /> Manage Program
          </button>
        </div>
      </div>

      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Members" 
          value={stats.totalMembers.toLocaleString()} 
          icon={Crown} 
          iconColor="text-[#ea580c]" 
          iconBg="bg-[#ffedd5]" 
          footer={
            <p className="text-xs font-bold text-[#16a34a] flex items-center gap-1">Active Program</p>
          }
        />
        <StatCard 
          title="Points Issued" 
          value={stats.pointsIssued.toLocaleString()} 
          icon={ArrowUpRight} 
          iconColor="text-[#16a34a]" 
          iconBg="bg-[#dcfce7]" 
          footer={
            <p className="text-xs font-bold text-[#16a34a] flex items-center gap-1">Lifetime</p>
          }
        />
        <StatCard 
          title="Points Redeemed" 
          value={stats.pointsRedeemed.toLocaleString()} 
          icon={ArrowDownRight} 
          iconColor="text-[#dc2626]" 
          iconBg="bg-[#fee2e2]" 
          footer={
            <p className="text-xs font-bold text-[#111827] flex items-center gap-1">{stats.redemptionRate}% Redemption Rate</p>
          }
        />
        <StatCard 
          title="Outstanding Points" 
          value={stats.outstandingPoints.toLocaleString()} 
          icon={Gift} 
          iconColor="text-[#9333ea]" 
          iconBg="bg-[#f3e8ff]" 
          footer={
            <p className="text-xs font-bold text-[#dc2626] flex items-center gap-1">Current Liability</p>
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Col: Main Table */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#8b0000]" /> Recent Activity
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] pointer-events-none" />
              <input type="text" placeholder="Search by customer..." className="bg-white border border-[#e5e7eb] rounded-lg !pl-10 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#8b0000] w-64" />
            </div>
          </div>

          <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm flex flex-col overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Date</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Customer</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Type</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider">Description</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider text-right">Points</th>
                    <th className="px-5 py-3 text-xs font-extrabold text-[#6b7280] uppercase tracking-wider text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f9fafb]">
                  {stats.recentTransactions?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-5 py-10 text-center text-[12px] font-bold text-[#9ca3af]">No recent loyalty activity found.</td>
                    </tr>
                  ) : (
                    stats.recentTransactions?.map((txn, idx) => (
                      <tr key={txn._id || idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                           <p className="text-xs font-bold text-[#111827]">{new Date(txn.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}</p>
                           <p className="text-xs text-[#6b7280]">{new Date(txn.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-5 py-3">
                           <p className="text-xs font-bold text-[#111827]">{txn.userId?.name || 'Unknown User'}</p>
                           <p className="text-xs text-[#6b7280]">{txn.userId?.email || ''}</p>
                        </td>
                        <td className="px-5 py-3">
                          {txn.type === 'earned' || txn.type === 'bonus' ? (
                            <span className="text-xs font-bold px-2 py-1 rounded bg-[#dcfce7] text-[#16a34a] uppercase flex items-center gap-1 w-max">
                              <ArrowUpRight className="w-3 h-3" /> {txn.type}
                            </span>
                          ) : (
                            <span className="text-xs font-bold px-2 py-1 rounded bg-[#fee2e2] text-[#dc2626] uppercase flex items-center gap-1 w-max">
                              <ArrowDownRight className="w-3 h-3" /> {txn.type}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs text-[#374151] max-w-[200px] truncate">{txn.description}</p>
                          {txn.reward?.couponId && (
                            <p className="text-xs font-bold text-[#8b0000] mt-0.5">Coupon Generated: {txn.reward.couponId.code}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`text-[12px] font-black ${txn.points > 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>
                            {txn.points > 0 ? '+' : ''}{txn.points}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="text-[12px] font-bold text-[#374151]">{txn.balanceAfter}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Program Details */}
        <div className="xl:col-span-1 space-y-6 pt-9">
          
          <div className="bg-white border border-[#e5e7eb] rounded-[16px] shadow-sm p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Gift className="w-24 h-24" />
            </div>
            
            <h3 className="text-[14px] font-bold text-[#111827] mb-4 relative z-10">Current Program Rules</h3>
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#dcfce7] text-[#16a34a] flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111827]">Order Purchases</h4>
                  <p className="text-xs text-[#6b7280]">Earn 1 point per $1 spent on all delivered orders.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#eff6ff] text-[#3b82f6] flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111827]">Daily Login</h4>
                  <p className="text-xs text-[#6b7280]">Earn 5 points once per day just for opening the app.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-[#f3e8ff] text-[#9333ea] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#111827]">Reviews</h4>
                  <p className="text-xs text-[#6b7280]">Earn 20 points for reviewing a completed order.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-5 border-t border-gray-100 relative z-10">
              <h3 className="text-[14px] font-bold text-[#111827] mb-3">Redemption Rules</h3>
              <div className="flex items-center justify-between p-3 bg-[#fff1f2] rounded-lg border border-[#fecdd3] mb-2">
                 <span className="text-xs font-bold text-[#9f1239] flex items-center gap-1.5"><Gift className="w-4 h-4" /> Exchange Rate</span>
                 <span className="text-[12px] font-black text-[#9f1239]">10 Points = $1</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                 <span className="text-xs font-bold text-[#374151] flex items-center gap-1.5">Min/Max Redemption</span>
                 <span className="text-xs font-bold text-[#374151]">50 - 500 Points</span>
              </div>
              <p className="text-xs text-[#6b7280] text-center mt-3 italic">
                Settings are currently hardcoded to industry standards. Custom rules engine coming soon.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

// Inline fallback for missing icon
function SettingsIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
