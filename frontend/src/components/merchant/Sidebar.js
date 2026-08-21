import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMerchantContext } from '@/context/MerchantContext';
import {
  Briefcase, Clock, Store, CalendarCheck, Calendar,
  ClipboardList, ShoppingBag, ChefHat, Truck,
  CheckCircle, XCircle, Wallet, Users, Ticket, Gift, MessageSquare, BarChart, Settings, Activity, Shield, PhoneCall,
  Grid, Utensils, PlusCircle, Sliders, Link as LinkIcon, Eye, Headphones, Megaphone, Globe
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
    ]
  },
  {
    heading: 'MENU MANAGEMENT',
    items: [
      { id: 'menu', label: 'Menu Management', icon: Grid },
    ]
  },
  {
    heading: 'CUSTOMERS',
    items: [
      { id: 'crm', label: 'Customers & CRM', icon: Users },
      { id: 'messages', label: 'Support Messages', icon: MessageSquare },
      { id: 'marketing', label: 'Push Marketing', icon: Megaphone },
      { id: 'promotions', label: 'Promotions & Coupons', icon: Ticket },
      { id: 'loyalty', label: 'Loyalty Rewards', icon: Gift },
    ]
  },
  {
    heading: 'REPORTS & FINANCE',
    items: [
      { id: 'analytics', label: 'Reports & Analytics', icon: BarChart },
      { id: 'audit', label: 'System Logs', icon: Shield },
    ]
  },
  {
    heading: 'SETTINGS & OTHERS',
    items: [
      { id: 'settings', label: 'Restaurant Settings', icon: Settings },
      { id: 'cms', label: 'Website CMS', icon: Globe },
    ]
  }
];

export default function MerchantSidebar() {
  const pathname = usePathname();
  const { stats = {} } = useMerchantContext();
  
  // Helper to determine active state
  const isActiveNav = (id) => {
    if (id === 'dashboard') return pathname === '/merchant';
    const normalizedId = id.replace('_', '-');
    return pathname.startsWith(`/merchant/${normalizedId}`);
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
    <div className="w-[250px] h-screen bg-[#111827] flex flex-col border-r border-[#1f2937] overflow-hidden shrink-0 shadow-2xl z-50">
      {/* Logo Area */}
      <div className="p-6 flex flex-col items-center justify-center shrink-0">
        <div className="mb-6">
          <img
            src="/assets/images/branded/lassi-lounge/logo-email.png"
            alt="Lassi Lounge"
            className="h-11 w-auto object-contain"
          />
        </div>

        {/* Dashboard Button */}
        <Link
          href="/merchant"
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-300
            ${isActiveNav('dashboard') 
              ? 'bg-[#7a0b10] text-white shadow-[0_4px_12px_rgba(122,11,16,0.35)]' 
              : 'text-gray-400 hover:text-white hover:bg-[#1f2937]'
            }`}
        >
          <Briefcase className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Navigation Links - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
        <div className="space-y-6">
          {SIDEBAR_STRUCTURE.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest pl-2">
                {section.heading}
              </h4>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = isActiveNav(item.id);
                  const Icon = item.icon;
                  const badgeCount = getBadgeCount(item.id, item.badge);
                  const normalizedId = item.id.replace('_', '-');
                  
                  return (
                    <Link
                      key={item.id}
                      href={`/merchant/${normalizedId}`}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group
                        ${isActive 
                          ? 'bg-[#1f2937] text-white font-bold' 
                          : 'text-gray-400 hover:text-white hover:bg-[#1f2937] font-medium'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-[#7a0b10]' : 'text-gray-500 group-hover:text-gray-300'}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      
                      {badgeCount > 0 && (
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                          ${item.badgeColor === 'red' ? 'bg-[#7a0b10] text-white' : 
                            item.badgeColor === 'orange' ? 'bg-[#f97316] text-white' : 
                            'bg-gray-700 text-gray-300'}`}
                        >
                          {badgeCount}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Need Help Box */}
      <Link href="/merchant/support">
        <div className="p-5 shrink-0 border-t border-[#1f2937]">
          <div className="bg-[#1f2937] rounded-xl p-4 flex flex-col gap-3 border border-[#374151] hover:border-[#4b5563] cursor-pointer transition-colors group">
            <div className="flex items-center gap-3">
              <div className="bg-[#374151] p-2 rounded-lg group-hover:bg-[#4b5563] transition-colors">
                <Headphones className="w-4 h-4 text-gray-300" />
              </div>
              <div>
                <h4 className="text-gray-200 text-sm font-bold">Need Help?</h4>
                <p className="text-gray-400 text-xs mt-0.5">Contact Support</p>
              </div>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Custom scrollbar styling embedded for this component */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.8);
        }
      `}</style>
    </div>
  );
}