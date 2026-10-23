'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMerchantContext } from '@/context/MerchantContext';
import {
  Briefcase, Clock, Store, CalendarCheck, Calendar,
  ClipboardList, Users, Ticket, Gift, MessageSquare, BarChart, Settings, Shield,
  Grid, Megaphone, Globe, Share2, Headphones, ChevronRight,
  ChevronLeft, PanelLeftClose, PanelLeft
} from 'lucide-react';

const SIDEBAR_STRUCTURE = [
  {
    heading: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Briefcase, href: '/merchant' },
      { id: 'live_orders', label: 'Live Orders', icon: Clock, badge: 8, badgeColor: 'brand', href: '/merchant/live-orders' },
      { id: 'all_orders', label: 'All Orders & Invoices', icon: ClipboardList, href: '/merchant/all-orders' },
    ]
  },
  {
    heading: 'OPERATIONS',
    items: [
      { id: 'kds', label: 'Kitchen Display', icon: Store, href: '/merchant/kds' },
      { id: 'reservations', label: 'Reservations', icon: CalendarCheck, badge: 5, badgeColor: 'orange', href: '/merchant/reservations' },
      { id: 'catering', label: 'Catering Enquiries', icon: Calendar, badge: 3, badgeColor: 'orange', href: '/merchant/catering' },
      { id: 'menu', label: 'Menu & Inventory', icon: Grid, href: '/merchant/menu' },
    ]
  },
  {
    heading: 'CRM & MARKETING',
    items: [
      { id: 'crm', label: 'Customers & CRM', icon: Users, href: '/merchant/crm' },
      { id: 'messages', label: 'Support Messages', icon: MessageSquare, href: '/merchant/messages' },
      { id: 'promotions', label: 'Promotions & Coupons', icon: Ticket, href: '/merchant/promotions' },
      { id: 'loyalty', label: 'Loyalty Rewards', icon: Gift, href: '/merchant/loyalty' },
      { id: 'referrals', label: 'Referral Program', icon: Share2, href: '/merchant/referrals' },
      { id: 'marketing', label: 'Push Marketing', icon: Megaphone, href: '/merchant/marketing' },
    ]
  },
  {
    heading: 'FINANCE & REPORTS',
    items: [
      { id: 'analytics', label: 'Reports & Analytics', icon: BarChart, href: '/merchant/analytics' },
      { id: 'audit', label: 'System Logs', icon: Shield, href: '/merchant/audit' },
    ]
  },
  {
    heading: 'SETTINGS & WEB',
    items: [
      { id: 'settings', label: 'Restaurant Settings', icon: Settings, href: '/merchant/settings' },
      { id: 'cms', label: 'Website CMS & SEO', icon: Globe, href: '/merchant/cms' },
    ]
  }
];

export default function MerchantSidebar({ collapsed = false, onToggle }) {
  const pathname = usePathname();
  const { stats = {}, restaurant } = useMerchantContext();

  const isItemActive = (href) => {
    if (href === '/merchant') {
      return pathname === '/merchant';
    }
    return pathname.startsWith(href);
  };

  const getBadgeCount = (id, defaultBadge = 0) => {
    switch (id) {
      case 'live_orders': return Number(stats?.activeOrders ?? defaultBadge ?? 0);
      case 'new_orders': return Number(stats?.newOrders ?? defaultBadge ?? 0);
      case 'preparing': return Number(stats?.preparingOrders ?? defaultBadge ?? 0);
      case 'reservations': return Number(stats?.pendingReservations ?? defaultBadge ?? 0);
      case 'catering': return Number(stats?.pendingCatering ?? defaultBadge ?? 0);
      default: return Number(defaultBadge ?? 0);
    }
  };

  return (
    <aside
      className={`sticky top-0 left-0 h-screen shrink-0 bg-[#090D16] border-r border-white/[0.08] flex flex-col z-30 transition-all duration-200 select-none overflow-hidden text-[#f1f5f9] [color-scheme:dark] ${collapsed ? 'w-[80px]' : 'w-[260px]'
        }`}
      style={{
        width: collapsed ? '80px' : '260px',
        minWidth: collapsed ? '80px' : '260px',
        maxWidth: collapsed ? '80px' : '260px',
        colorScheme: 'dark',
        color: '#f1f5f9',
      }}
    >
      {/* --- Top Brand Header --- */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 min-h-[70px] shrink-0 border-b border-white/[0.08]">
        {!collapsed ? (
          <div className="flex items-center justify-between w-full">
            <Link href="/merchant" className="flex items-center gap-2.5 group">
              <img
                src="/assets/images/branded/lassi-lounge/logo-email.png"
                alt="Lassi Lounge"
                className="h-11 sm:h-12 w-auto max-w-[175px] object-contain group-hover:scale-105 transition-transform drop-shadow"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <div className="logo-fallback hidden flex flex-col">
                <span className="font-heading font-black text-sm tracking-wider text-white">LASSI LOUNGE</span>
                <span className="text-[9px] font-bold text-brand uppercase tracking-widest">Admin Workspace</span>
              </div>
            </Link>

            {onToggle && (
              <button
                type="button"
                onClick={onToggle}
                className="w-7 h-7 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 flex items-center justify-center text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full">
            <button
              type="button"
              onClick={onToggle}
              className="w-12 h-12 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-brand/40 flex items-center justify-center p-2 cursor-pointer hover:scale-105 transition-all shadow-sm group"
              title="Expand Sidebar"
              aria-label="Expand Sidebar"
            >
              <img
                src="/assets/images/branded/lassi-lounge/Lassi-Lounge-icon.png"
                alt="Lassi Lounge"
                className="w-full h-full object-contain filter drop-shadow group-hover:scale-110 transition-transform"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.collapsed-fallback');
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <span className="collapsed-fallback hidden font-heading font-black text-xs text-brand">LL</span>
            </button>
          </div>
        )}
      </div>

      {/* --- Navigation Items --- */}
      <div className="flex-1 overflow-y-auto px-2.5 pb-6 pt-3 custom-scrollbar">
        {SIDEBAR_STRUCTURE.map((group) => (
          <div key={group.heading} className="mb-2">
            {/* Section Header with Gradient Divider */}
            {!collapsed ? (
              <div className="flex items-center gap-2.5 px-2.5 pt-3 pb-1.5 text-[10px] font-black tracking-[0.16em] text-[#94a3b8] uppercase">
                <span className="shrink-0">{group.heading}</span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-700/80 to-transparent" />
              </div>
            ) : (
              <div className="w-6 h-[1px] bg-slate-700/80 mx-auto my-1.5" />
            )}

            {/* Section Items */}
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isItemActive(item.href);
                const Icon = item.icon;
                const badgeCount = getBadgeCount(item.id, item.badge);
                const hasBadge = Boolean(badgeCount && badgeCount > 0);
                const badgeText = hasBadge ? (badgeCount > 99 ? '99+' : String(badgeCount)) : '';

                if (collapsed) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`relative flex items-center justify-center p-2 rounded-xl transition-all duration-150 group ${active
                          ? 'bg-gradient-to-r from-brand to-rose-600 text-white shadow-[0_4px_14px_rgba(205,19,27,0.35)]'
                          : 'hover:bg-white/[0.04]'
                        }`}
                      title={item.label}
                    >
                      {active && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/80 rounded-r-md" />
                      )}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${active
                            ? 'bg-white/20 text-white shadow-inner'
                            : 'bg-[#141A28]/80 border border-slate-800/80 text-slate-400 group-hover:text-white group-hover:border-slate-700'
                          }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#cbd5e1] group-hover:text-white'}`} />
                      </div>
                      {hasBadge && (
                        <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-white ring-2 ring-[#090D16]" />
                      )}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`relative flex items-center justify-between px-2.5 py-2 rounded-xl text-[13px] transition-all duration-150 group ${active
                        ? 'bg-gradient-to-r from-brand to-rose-600 text-white font-bold shadow-[0_4px_14px_rgba(205,19,27,0.35)]'
                        : 'text-[#cbd5e1] hover:text-white hover:bg-white/[0.04] font-medium'
                      }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white/80 rounded-r-md" />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${active
                            ? 'bg-white/20 text-white shadow-inner'
                            : 'bg-[#141A28]/80 border border-slate-800/80 text-slate-400 group-hover:text-white group-hover:border-slate-700'
                          }`}
                      >
                        <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#cbd5e1] group-hover:text-white'}`} />
                      </div>
                      <span className="flex-1 truncate tracking-tight">
                        {item.label}
                      </span>
                    </div>

                    {hasBadge && (
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10.5px] font-bold leading-tight ${active
                            ? 'bg-white text-brand'
                            : item.badgeColor === 'brand'
                              ? 'bg-brand/20 text-brand border border-brand/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                      >
                        {badgeText}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* --- Need Help / Support Box at Bottom --- */}
      {!collapsed ? (
        <div className="p-3 shrink-0 border-t border-white/[0.08]">
          <Link
            href="/merchant/support"
            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all group cursor-pointer ${
              pathname.startsWith('/merchant/support')
                ? 'bg-gradient-to-r from-brand to-rose-600 text-white font-bold shadow-[0_4px_14px_rgba(205,19,27,0.35)]'
                : 'bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-brand/40 text-[#cbd5e1] hover:text-white'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                pathname.startsWith('/merchant/support')
                  ? 'bg-white/20 text-white shadow-inner'
                  : 'bg-white/[0.06] group-hover:bg-brand/20 border border-white/10 group-hover:border-brand/40 text-[#cbd5e1] group-hover:text-brand'
              }`}
            >
              <Headphones className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white group-hover:text-rose-200 transition-colors truncate">
                Help & Support
              </div>
              <div className="text-[10px] text-[#94a3b8] truncate mt-0.5">
                Contact Assistant
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      ) : (
        <div className="p-3 shrink-0 border-t border-white/[0.08] flex justify-center">
          <Link
            href="/merchant/support"
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              pathname.startsWith('/merchant/support')
                ? 'bg-gradient-to-r from-brand to-rose-600 text-white shadow-[0_4px_14px_rgba(205,19,27,0.35)]'
                : 'bg-white/[0.04] hover:bg-brand/20 border border-white/10 hover:border-brand/40 text-[#cbd5e1] hover:text-brand'
            }`}
            title="Help & Support"
          >
            <Headphones className="w-4 h-4" />
          </Link>
        </div>
      )}
    </aside>
  );
}