import React from 'react';
import Image from 'next/image';
import {
  Briefcase, Clock, Store, CalendarCheck, Calendar,
  ClipboardList, ShoppingBag, ChefHat, Truck,
  CheckCircle, XCircle, Wallet, Users, Ticket, Gift, MessageSquare, BarChart, Settings, Activity, Shield, PhoneCall,
  Grid, Utensils, PlusCircle, Sliders, Link as LinkIcon, Eye, Headphones
} from 'lucide-react';

const SIDEBAR_STRUCTURE = [
  {
    heading: 'LIVE OPERATIONS',
    items: [
      { id: 'live_orders', label: 'Live Orders', icon: Clock, badge: 8, badgeColor: 'red' },
      { id: 'kds', label: 'Kitchen Display', icon: Store },
      { id: 'reservations', label: 'Reservations', icon: CalendarCheck, badge: 5, badgeColor: 'orange' },
      { id: 'catering', label: 'Catering Enquiries', icon: Calendar, badge: 3, badgeColor: 'orange' },
    ]
  },
  {
    heading: 'ORDERS',
    items: [
      { id: 'all_orders', label: 'All Orders', icon: ClipboardList },
      { id: 'new_orders', label: 'New Orders', icon: Truck, badge: 8, badgeColor: 'red' }, // Truck matching image for new orders
      { id: 'preparing', label: 'Preparing', icon: ChefHat, badge: 12, badgeColor: 'orange' },
      { id: 'out_delivery', label: 'Out for Delivery', icon: Truck, badge: 6, badgeColor: 'orange' },
      { id: 'completed', label: 'Completed Orders', icon: CheckCircle },
      { id: 'cancelled', label: 'Cancelled Orders', icon: XCircle },
      { id: 'refunds', label: 'Refund Requests', icon: Wallet },
    ]
  },
  {
    heading: 'MENU MANAGEMENT',
    items: [
      { id: 'categories', label: 'Categories', icon: Grid },
      { id: 'food_items', label: 'Food Items', icon: Utensils },
      { id: 'addons', label: 'Add-ons', icon: PlusCircle },
      { id: 'variations', label: 'Variations', icon: Sliders },
      { id: 'combo', label: 'Combo Meals', icon: LinkIcon },
      { id: 'availability', label: 'Availability', icon: Eye },
    ]
  },
  {
    heading: 'CUSTOMERS & MARKETING',
    items: [
      { id: 'crm', label: 'Customers & CRM', icon: Users },
      { id: 'promotions', label: 'Promotions & Coupons', icon: Ticket },
      { id: 'loyalty', label: 'Loyalty Rewards', icon: Gift },
      { id: 'reviews', label: 'Reviews', icon: MessageSquare },
    ]
  },
  {
    heading: 'REPORTS & FINANCE',
    items: [
      { id: 'analytics', label: 'Reports & Analytics', icon: BarChart },
      { id: 'finance', label: 'Finance', icon: Wallet },
    ]
  },
  {
    heading: 'SETTINGS & OTHERS',
    items: [
      { id: 'staff', label: 'Staff & Permissions', icon: Shield },
      { id: 'settings', label: 'Restaurant Settings', icon: Settings },
      { id: 'activity_logs', label: 'Activity Logs', icon: Activity },
    ]
  }
];

export default function MerchantSidebar({ activeNav = 'dashboard', onNavChange, stats = {} }) {
  const handleNav = (id) => {
    if (onNavChange) onNavChange(id);
  };

  // Dynamically update badges based on passed stats
  const getBadgeCount = (id, defaultBadge) => {
    switch (id) {
      case 'live_orders': return stats.activeOrders ?? defaultBadge;
      case 'new_orders': return stats.newOrders ?? defaultBadge;
      case 'preparing': return stats.preparingOrders ?? defaultBadge;
      case 'reservations': return stats.pendingReservations ?? defaultBadge;
      case 'catering': return stats.pendingCatering ?? defaultBadge;
      default: return defaultBadge;
    }
  };

  return (
    <div className="w-[280px] h-screen bg-[#070707] flex flex-col border-r border-[#E5B869]/10 overflow-hidden shrink-0">
      {/* Logo Area */}
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="flex items-center justify-center mb-6">
           {/* Fallback to styled text if logo image is missing */}
           <div className="flex flex-col items-center">
             <span className="text-4xl font-serif text-[#C62828] italic font-bold">Lassi</span>
             <span className="text-[#E5B869] text-[13px] font-medium tracking-[0.2em] uppercase mt-[-2px]">Lounge</span>
           </div>
        </div>

        {/* Dashboard Button */}
        <button
          onClick={() => handleNav('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300
            ${activeNav === 'dashboard' 
              ? 'bg-gradient-to-r from-[#8b0000] to-[#4a0000] text-white shadow-[0_0_15px_rgba(139,0,0,0.5)] border border-[#ff0000]/20' 
              : 'text-[#E5B869] hover:bg-white/5'
            }`}
        >
          <Briefcase className="h-5 w-5" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Navigation Links - Scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pb-8 custom-scrollbar">
        <div className="space-y-7">
          {SIDEBAR_STRUCTURE.map((section, idx) => (
            <div key={idx} className="space-y-3">
              <h4 className="text-[11px] font-bold text-[#E5B869] uppercase tracking-wider opacity-80 pl-2">
                {section.heading}
              </h4>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = activeNav === item.id;
                  const Icon = item.icon;
                  const badgeCount = getBadgeCount(item.id, item.badge);
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group
                        ${isActive 
                          ? 'bg-gradient-to-r from-[#8b0000] to-[#4a0000] text-white shadow-lg border border-[#ff0000]/20' 
                          : 'text-[#E5B869] hover:text-[#FFDF99] hover:bg-[#E5B869]/10'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-white' : 'text-[#E5B869] group-hover:text-[#FFDF99]'}`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      
                      {badgeCount > 0 && (
                        <div className={`h-[22px] min-w-[22px] px-1.5 flex items-center justify-center rounded-full text-[11px] font-bold text-white
                          ${item.badgeColor === 'red' ? 'bg-[#C62828] shadow-[0_0_8px_rgba(198,40,40,0.6)]' : 'bg-[#E65100] shadow-[0_0_8px_rgba(230,81,0,0.6)]'}`}
                        >
                          {badgeCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Need Help Box */}
      <div className="p-5 shrink-0">
        <div className="bg-gradient-to-r from-[#8b0000] to-[#4a0000] rounded-xl p-4 flex items-center gap-3 border border-[#ff0000]/20 shadow-lg cursor-pointer hover:shadow-xl transition-shadow">
          <div className="bg-white/10 p-2 rounded-full">
            <Headphones className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-white text-sm font-bold">Need Help?</h4>
            <p className="text-[#FFDF99] text-xs mt-0.5">Contact Support Team</p>
          </div>
        </div>
      </div>
      
      {/* Custom scrollbar styling embedded for this component */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(229, 184, 105, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(229, 184, 105, 0.4);
        }
      `}</style>
    </div>
  );
}
