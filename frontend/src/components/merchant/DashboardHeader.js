'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Menu, ShoppingBag, Bell, HelpCircle, Settings, LogOut,
  ClipboardList, Utensils, CalendarCheck, Users, Ticket, BarChart3,
  ChefHat, Store, X, ArrowRight, Loader2, UserCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMerchantContext } from '@/context/MerchantContext';
import {
  orderAPI, menuAPI, reservationAPI, cateringAPI,
  crmAPI, notificationAPI
} from '@/lib/api';
import { showToast } from '@/components/ui';

const NAV_ACTIONS = [
  { id: 'dashboard', label: 'Dashboard', hint: 'Overview, sales, quick stats', href: '/merchant', icon: Store, keywords: 'home overview today revenue' },
  { id: 'live-orders', label: 'Live Orders', hint: 'Active order pipeline', href: '/merchant/live-orders', icon: ShoppingBag, keywords: 'new pending accepted preparing ready' },
  { id: 'all-orders', label: 'All Orders', hint: 'Order history and refunds', href: '/merchant/all-orders', icon: ClipboardList, keywords: 'orders history cancelled refunded invoice' },
  { id: 'kds', label: 'Kitchen Display', hint: 'Kitchen ticket view', href: '/merchant/kds', icon: ChefHat, keywords: 'kitchen kds prepare tickets' },
  { id: 'menu', label: 'Menu Management', hint: 'Items, categories, availability', href: '/merchant/menu', icon: Utensils, keywords: 'food item category price availability' },
  { id: 'reservations', label: 'Reservations', hint: 'Tables and bookings', href: '/merchant/reservations', icon: CalendarCheck, keywords: 'booking table dine in guest' },
  { id: 'catering', label: 'Catering Enquiries', hint: 'Events and catering leads', href: '/merchant/catering', icon: CalendarCheck, keywords: 'event inquiry catering party' },
  { id: 'crm', label: 'Customers & CRM', hint: 'Customer profiles', href: '/merchant/crm', icon: Users, keywords: 'customer phone email loyalty' },
  { id: 'promotions', label: 'Promotions & Coupons', hint: 'Discount campaigns', href: '/merchant/promotions', icon: Ticket, keywords: 'coupon discount promo offer' },
  { id: 'analytics', label: 'Reports & Analytics', hint: 'Finance and performance', href: '/merchant/analytics', icon: BarChart3, keywords: 'reports revenue sales finance' },
  { id: 'settings', label: 'Restaurant Settings', hint: 'Business settings', href: '/merchant/settings', icon: Settings, keywords: 'profile hours tax payment setup' },
];

const normalize = (value = '') => value.toString().toLowerCase().trim();

export default function DashboardHeader({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { roomId, stats = {}, restaurant } = useMerchantContext();

  const [query, setQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchData, setSearchData] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [headerCounts, setHeaderCounts] = useState({ activeOrders: 0 });
  const headerRef = useRef(null);
  const searchRef = useRef(null);
  const searchWrapRef = useRef(null);

  const activeOrders = headerCounts.activeOrders || stats.activeOrders || stats.newOrders || 0;
  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  useEffect(() => {
    const handleShortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setNotificationOpen(false);
        setProfileOpen(false);
        setMobileNavOpen(false);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setIsSearchOpen(false);
        setNotificationOpen(false);
        setProfileOpen(false);
        setMobileNavOpen(false);
        return;
      }

      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    notificationAPI.getMyNotifications()
      .then((res) => setNotifications((res.data || res.notifications || []).slice(0, 8)))
      .catch(() => setNotifications([]));
  }, [pathname]);

  useEffect(() => {
    if (!roomId) return;
    orderAPI.getRestaurantOrders(roomId)
      .then((res) => {
        const orders = res.data || [];
        const active = orders.filter((order) => ['pending', 'accepted', 'preparing', 'ready'].includes(order.status)).length;
        setHeaderCounts({ activeOrders: active });
      })
      .catch(() => setHeaderCounts({ activeOrders: 0 }));
  }, [roomId, pathname]);

  const buildSearchIndex = async () => {
    if (!roomId || isSearchLoading || searchData.length > 0) return;
    setIsSearchLoading(true);
    try {
      const [ordersRes, menuRes, reservationsRes, cateringRes, customersRes] = await Promise.all([
        orderAPI.getRestaurantOrders(roomId).catch(() => ({ data: [] })),
        menuAPI.getByRestaurant(roomId).catch(() => ({ data: [] })),
        reservationAPI.getRestaurantReservations?.(roomId).catch(() => ({ data: [] })) || Promise.resolve({ data: [] }),
        cateringAPI.getRestaurantInquiries?.(roomId).catch(() => ({ data: [] })) || Promise.resolve({ data: [] }),
        crmAPI?.getCustomers?.(roomId).catch(() => ({ data: [] })) || Promise.resolve({ data: [] }),
      ]);

      const orders = (ordersRes.data || []).slice(0, 60).map((order) => ({
        type: 'Order',
        label: order.orderNumber || `Order ${order._id?.slice(-6)}`,
        hint: `${order.customerName || 'Customer'} • ${order.status || 'pending'} • $${Number(order.total || 0).toFixed(2)}`,
        href: '/merchant/all-orders',
        icon: ClipboardList,
        keywords: `${order.orderNumber} ${order.customerName} ${order.customerPhone} ${order.customerEmail} ${order.status} ${order._id}`,
      }));

      const menuItems = (menuRes.data || []).flatMap((category) => {
        if (category.items) {
          return category.items.map((item) => ({ ...item, categoryName: category.name }));
        }
        return [category];
      }).slice(0, 80).map((item) => ({
        type: 'Menu',
        label: item.name || 'Menu item',
        hint: `${item.categoryName || item.category || 'Menu'} • $${Number(item.price || 0).toFixed(2)}${item.isAvailable === false ? ' • unavailable' : ''}`,
        href: '/merchant/menu',
        icon: Utensils,
        keywords: `${item.name} ${item.description} ${item.categoryName} ${item.category}`,
      }));

      const reservations = (reservationsRes.data || []).slice(0, 40).map((reservation) => ({
        type: 'Reservation',
        label: reservation.customerName || 'Reservation',
        hint: `${reservation.customerPhone || reservation.customerEmail || 'Guest'} • ${reservation.status || 'pending'}`,
        href: '/merchant/reservations',
        icon: CalendarCheck,
        keywords: `${reservation.customerName} ${reservation.customerPhone} ${reservation.customerEmail} ${reservation.status}`,
      }));

      const catering = (cateringRes.data || []).slice(0, 40).map((inquiry) => ({
        type: 'Catering',
        label: inquiry.customerName || inquiry.eventType || 'Catering enquiry',
        hint: `${inquiry.eventType || 'Event'} • ${inquiry.status || 'new'}`,
        href: '/merchant/catering',
        icon: CalendarCheck,
        keywords: `${inquiry.customerName} ${inquiry.customerPhone} ${inquiry.customerEmail} ${inquiry.eventType} ${inquiry.status}`,
      }));

      const customers = (customersRes.data || customersRes.customers || []).slice(0, 60).map((customer) => ({
        type: 'Customer',
        label: customer.name || customer.customerName || 'Customer',
        hint: `${customer.phone || customer.email || 'CRM profile'}${customer.totalOrders ? ` • ${customer.totalOrders} orders` : ''}`,
        href: '/merchant/crm',
        icon: Users,
        keywords: `${customer.name} ${customer.customerName} ${customer.phone} ${customer.email} ${customer.customerId}`,
      }));

      setSearchData([...orders, ...menuItems, ...reservations, ...catering, ...customers]);
    } finally {
      setIsSearchLoading(false);
    }
  };

  const suggestions = useMemo(() => {
    const navItems = NAV_ACTIONS.map((item) => ({ ...item, type: 'Go to' }));
    const allItems = [...navItems, ...searchData];
    const q = normalize(query);
    if (!q) return allItems.slice(0, 8);

    return allItems
      .map((item) => {
        const haystack = normalize(`${item.label} ${item.hint} ${item.type} ${item.keywords}`);
        const label = normalize(item.label);
        let score = 0;
        if (label === q) score += 100;
        if (label.startsWith(q)) score += 60;
        if (haystack.includes(q)) score += 30;
        q.split(/\s+/).forEach((part) => {
          if (part && haystack.includes(part)) score += 8;
        });
        return { ...item, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [query, searchData]);

  const openSearch = () => {
    setIsSearchOpen(true);
    buildSearchIndex();
  };

  const selectSuggestion = (item) => {
    if (!item) return;
    setQuery('');
    setIsSearchOpen(false);
    setActiveIndex(0);
    router.push(item.href);
  };

  const handleSearchKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((idx) => Math.min(idx + 1, suggestions.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((idx) => Math.max(idx - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex] || suggestions[0] || NAV_ACTIONS.find((item) => item.href === '/merchant/all-orders'));
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  const markNotificationRead = async (notification) => {
    if (!notification?._id) return;
    try {
      await notificationAPI.markAsRead(notification._id);
      setNotifications((items) => items.map((item) => item._id === notification._id ? { ...item, isRead: true, read: true } : item));
    } catch {
      showToast('Could not update notification', 'error');
    }
  };

  return (
    <header ref={headerRef} className="bg-white h-[72px] min-h-[72px] border-b border-[#e5e7eb] flex items-center justify-between px-6 sticky top-0 z-[9000] shadow-sm overflow-visible">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          onClick={() => { setMobileNavOpen((open) => !open); setNotificationOpen(false); setProfileOpen(false); }}
          className="text-[#9ca3af] hover:text-[#111827] md:hidden transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-6 h-6" />
        </button>

        {mobileNavOpen && (
          <div className="absolute left-4 top-[calc(100%+8px)] w-72 bg-white rounded-2xl border border-[#e5e7eb] shadow-2xl overflow-hidden z-[9100] md:hidden">
            <div className="px-4 py-3 border-b border-[#f3f4f6]">
              <p className="text-sm font-extrabold text-[#111827]">Merchant Navigation</p>
              <p className="text-xs text-[#6b7280]">{restaurant?.name || 'Workspace'}</p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto py-2">
              {NAV_ACTIONS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setMobileNavOpen(false); router.push(item.href); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left ${isActive ? 'bg-[#fff7ed] text-[#8b0000]' : 'text-[#374151] hover:bg-[#f9fafb]'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div ref={searchWrapRef} className="relative max-w-xl w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af]" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onFocus={openSearch}
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); openSearch(); }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search orders, menu, customers, reservations..."
            className="w-full pl-10 pr-24 py-2.5 bg-[#f9fafb] border border-[#e5e7eb] rounded-xl text-sm text-[#111827] font-medium focus:outline-none focus:ring-2 focus:ring-[#8b0000]/20 focus:border-[#8b0000]/50 transition-all placeholder:text-[#9ca3af]"
            aria-label="Search merchant workspace"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {query && (
              <button onClick={() => setQuery('')} className="p-1 text-[#9ca3af] hover:text-[#111827]" aria-label="Clear search">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-[10px] font-bold text-[#6b7280] bg-white border border-[#e5e7eb] px-1.5 py-0.5 rounded shadow-sm">
              Ctrl K
            </span>
          </div>

          {isSearchOpen && (
            <div className="absolute top-[calc(100%+10px)] left-0 right-0 bg-white border border-[#e5e7eb] rounded-2xl shadow-2xl overflow-hidden z-[9200]">
              <div className="px-4 py-2.5 border-b border-[#f3f4f6] flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#6b7280] uppercase tracking-wide">Merchant Search</span>
                {isSearchLoading && <Loader2 className="w-4 h-4 animate-spin text-[#8b0000]" />}
              </div>
              <div className="max-h-[390px] overflow-y-auto py-2">
                {suggestions.length > 0 ? suggestions.map((item, idx) => {
                  const Icon = item.icon || Search;
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={`${item.type}-${item.label}-${idx}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSuggestion(item)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${active ? 'bg-[#fff7ed]' : 'hover:bg-[#f9fafb]'}`}
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${active ? 'bg-[#8b0000] text-white' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#111827] truncate">{item.label}</span>
                          <span className="text-[10px] font-extrabold text-[#8b0000] bg-[#fee2e2] px-1.5 py-0.5 rounded">{item.type}</span>
                        </span>
                        <span className="block text-xs text-[#6b7280] truncate mt-0.5">{item.hint}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#9ca3af]" />
                    </button>
                  );
                }) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-bold text-[#111827]">No matches found</p>
                    <p className="text-xs text-[#6b7280] mt-1">Try an order number, customer phone, menu item, or page name.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.push('/merchant/live-orders')}
          className="hidden md:flex items-center gap-2 text-[#4b5563] hover:text-[#111827] hover:bg-[#f9fafb] px-3 py-2 rounded-lg transition-colors border border-transparent hover:border-[#e5e7eb]"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-sm font-bold">Live Orders</span>
          {activeOrders > 0 && <span className="bg-[#8b0000] text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1 shadow-sm">{activeOrders}</span>}
        </button>

        <div className="flex items-center gap-2 border-l border-[#e5e7eb] pl-4 relative">
          <button
            onClick={() => { setNotificationOpen((open) => !open); setProfileOpen(false); }}
            className="relative text-[#6b7280] hover:text-[#111827] p-2 hover:bg-[#f9fafb] rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && <span className="absolute top-1 right-1 bg-[#8b0000] text-white min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center">{unreadCount}</span>}
          </button>

          {notificationOpen && (
            <div className="absolute right-10 top-[calc(100%+12px)] w-80 bg-white rounded-2xl border border-[#e5e7eb] shadow-2xl overflow-hidden z-[9200]">
              <div className="px-4 py-3 border-b border-[#f3f4f6] flex items-center justify-between">
                <span className="text-sm font-extrabold text-[#111827]">Notifications</span>
                <button onClick={() => router.push('/merchant/live-orders')} className="text-xs font-bold text-[#8b0000]">View orders</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? notifications.map((notification) => (
                  <button
                    key={notification._id || notification.createdAt}
                    onClick={() => markNotificationRead(notification)}
                    className="w-full px-4 py-3 text-left hover:bg-[#f9fafb] border-b border-[#f3f4f6]"
                  >
                    <p className="text-sm font-bold text-[#111827] line-clamp-1">{notification.title || 'Notification'}</p>
                    <p className="text-xs text-[#6b7280] line-clamp-2 mt-1">{notification.message || notification.body || 'New merchant update'}</p>
                  </button>
                )) : (
                  <div className="px-4 py-8 text-center text-sm text-[#6b7280]">No notifications yet.</div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => router.push('/merchant/settings')}
            className="text-[#6b7280] hover:text-[#111827] p-2 hover:bg-[#f9fafb] rounded-lg transition-colors hidden sm:block"
            aria-label="Help and settings"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="relative border-l border-[#e5e7eb] pl-4 h-10 flex items-center">
          <button
            onClick={() => { setProfileOpen((open) => !open); setNotificationOpen(false); }}
            className="flex items-center gap-3 group h-10"
          >
            <div className="rounded-full bg-[#f3f4f6] overflow-hidden border border-[#e5e7eb] group-hover:border-[#8b0000]/30 transition-all flex items-center justify-center w-9 h-9 max-w-9 max-h-9 shrink-0">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'Merchant')}`}
                alt={user?.name || 'Merchant'}
                width="36"
                height="36"
                className="block w-9 h-9 max-w-9 max-h-9 object-cover rounded-full"
              />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-bold text-[#111827] leading-none group-hover:text-[#8b0000] transition-colors">{user?.name || 'Merchant'}</p>
              <p className="text-[11px] text-[#6b7280] font-bold mt-1">{restaurant?.name || 'Restaurant Workspace'}</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-64 bg-white rounded-2xl border border-[#e5e7eb] shadow-2xl overflow-hidden z-[9200]">
              <div className="px-4 py-3 border-b border-[#f3f4f6]">
                <p className="text-sm font-extrabold text-[#111827]">{user?.name || 'Merchant'}</p>
                <p className="text-xs text-[#6b7280] truncate">{user?.email || restaurant?.name || 'Merchant account'}</p>
              </div>
              <button onClick={() => router.push('/merchant/settings')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#374151] hover:bg-[#f9fafb]">
                <Settings className="w-4 h-4" /> Restaurant settings
              </button>
              <button onClick={() => router.push('/merchant/crm')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#374151] hover:bg-[#f9fafb]">
                <UserCircle className="w-4 h-4" /> Customer workspace
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#b91c1c] hover:bg-[#fef2f2] border-t border-[#f3f4f6]">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
