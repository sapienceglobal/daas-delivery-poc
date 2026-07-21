'use client';

import { Gift, ChevronRight, Award, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoyaltyTab({ user }) {
  const router = useRouter();
  const points = user?.loyaltyPoints || 0;
  
  // Calculate tier and next reward
  let tier = 'Bronze';
  let nextTier = 'Silver';
  let pointsToNext = 500 - points;
  let progress = (points / 500) * 100;

  if (points >= 1500) {
    tier = 'Gold';
    nextTier = 'Platinum';
    pointsToNext = 3000 - points;
    progress = ((points - 1500) / 1500) * 100;
  } else if (points >= 500) {
    tier = 'Silver';
    nextTier = 'Gold';
    pointsToNext = 1500 - points;
    progress = ((points - 500) / 1000) * 100;
  }

  // Mock transactions for UI presentation
  const mockTransactions = [
    { id: 1, type: 'earned', amount: 45, date: '2026-07-15T14:30:00Z', desc: 'Order #ORD-8821' },
    { id: 2, type: 'earned', amount: 120, date: '2026-07-02T19:15:00Z', desc: 'Order #ORD-7193' },
    { id: 3, type: 'redeemed', amount: -200, date: '2026-06-28T12:00:00Z', desc: 'Redeemed $10 off' },
  ];

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[24px] font-black text-[#1a1a1a]">Loyalty Points</h2>
        <p className="text-[14px] text-[#6b7280]">Earn points with every order and redeem them for rewards.</p>
      </div>

      {/* Main Points Card */}
      <div className="bg-[#600508] rounded-3xl p-8 md:p-10 text-white relative overflow-hidden shadow-lg border border-[#7a0b10]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#7a0b10] rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <p className="text-[14px] font-bold text-white/80 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Award className="h-5 w-5 text-[#f5a623]" />
              {tier} Member
            </p>
            <h3 className="text-[48px] font-black leading-none mb-2">{points}</h3>
            <p className="text-[15px] text-white/90 font-medium">Available Points</p>
          </div>

          <div className="flex-1 max-w-sm bg-black/20 rounded-2xl p-5 border border-white/10 backdrop-blur-md">
            <div className="flex justify-between items-end mb-2">
              <p className="text-[13px] font-bold text-white/90">
                <span className="text-[#f5a623]">{pointsToNext} points</span> to {nextTier}
              </p>
              <p className="text-[12px] font-bold text-white/60 uppercase tracking-wider">{nextTier}</p>
            </div>
            <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#f5a623] to-[#ffcb52] rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div>
        <h3 className="text-[18px] font-black text-[#1a1a1a] mb-4">Recent History</h3>
        
        {points === 0 ? (
          <div className="bg-white rounded-2xl border border-[#eadfdb] p-8 text-center shadow-sm">
            <p className="text-[14px] text-[#6b7280] mb-4">You don't have any points history yet.</p>
            <button
              onClick={() => router.push('/customer/restaurant/lassi-lounge')}
              className="h-11 px-6 rounded-lg bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors"
            >
              Order Now to Earn
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#eadfdb] shadow-sm overflow-hidden">
            <ul className="divide-y divide-[#eadfdb]">
              {mockTransactions.map((tx) => (
                <li key={tx.id} className="p-5 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      tx.type === 'earned' ? 'bg-[#f1fae8] text-[#65a30d]' : 'bg-[#fdf2f2] text-[#ef4444]'
                    }`}>
                      {tx.type === 'earned' ? <Gift className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-[#1a1a1a]">{tx.desc}</p>
                      <p className="text-[13px] text-[#6b7280] mt-0.5">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <div className={`text-[16px] font-black ${
                    tx.type === 'earned' ? 'text-[#65a30d]' : 'text-[#ef4444]'
                  }`}>
                    {tx.type === 'earned' ? '+' : ''}{tx.amount}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
