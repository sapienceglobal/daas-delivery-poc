'use client';

import { MapPin, ShoppingCart, Gift, CreditCard, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function DashboardTab({ user, onNavigate }) {
  const router = useRouter();
  
  const recentOrdersCount = 0; // Ideally passed down or fetched
  const points = user?.loyaltyPoints || 0;
  const defaultAddress = user?.savedAddresses?.find(a => a.isDefault) || user?.savedAddresses?.[0];
  const savedCardsCount = user?.savedCards?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-black text-[#1a1a1a]">Overview</h2>
          <p className="text-[14px] text-[#6b7280]">Welcome back, {user?.name?.split(' ')[0]}!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Loyalty Points */}
        <div 
          onClick={() => onNavigate('loyalty')}
          className="bg-white rounded-2xl p-6 border border-[#eadfdb] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#b47b80] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#fcf3e3] flex items-center justify-center">
              <Gift className="h-6 w-6 text-[#f5a623]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Loyalty Points</p>
              <p className="text-[24px] font-black text-[#1a1a1a] leading-none">{points}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#9ca3af] group-hover:text-[#7a0b10] transition-colors" />
        </div>

        {/* Orders */}
        <div 
          onClick={() => onNavigate('orders')}
          className="bg-white rounded-2xl p-6 border border-[#eadfdb] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#b47b80] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#f4f7f9] flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-[#0ea5e9]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Total Orders</p>
              <p className="text-[24px] font-black text-[#1a1a1a] leading-none">{recentOrdersCount > 0 ? recentOrdersCount : '--'}</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#9ca3af] group-hover:text-[#7a0b10] transition-colors" />
        </div>

        {/* Default Address */}
        <div 
          onClick={() => onNavigate('addresses')}
          className="bg-white rounded-2xl p-6 border border-[#eadfdb] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#b47b80] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#f1fae8] flex items-center justify-center shrink-0">
              <MapPin className="h-6 w-6 text-[#65a30d]" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Default Address</p>
              {defaultAddress ? (
                <p className="text-[14px] font-bold text-[#1a1a1a] truncate">{defaultAddress.label} - {defaultAddress.address}</p>
              ) : (
                <p className="text-[14px] font-bold text-[#9ca3af]">No address saved</p>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#9ca3af] group-hover:text-[#7a0b10] transition-colors shrink-0" />
        </div>

        {/* Payment Methods */}
        <div 
          onClick={() => onNavigate('payments')}
          className="bg-white rounded-2xl p-6 border border-[#eadfdb] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#b47b80] transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#fdf2f2] flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-[#ef4444]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#6b7280] uppercase tracking-wider mb-0.5">Payment Methods</p>
              <p className="text-[14px] font-bold text-[#1a1a1a] leading-none">{savedCardsCount} Saved Cards</p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-[#9ca3af] group-hover:text-[#7a0b10] transition-colors" />
        </div>
      </div>
    </div>
  );
}
