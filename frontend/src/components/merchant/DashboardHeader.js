'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Search, Menu, ShoppingBag, Bell, HelpCircle, Settings, LogOut,
  ClipboardList, Utensils, CalendarCheck, Users, Ticket, BarChart3,
  ChefHat, Store, X, ArrowRight, Loader2, UserCircle, MessageSquare,
  Layout, Send, Activity, Trash2, AlertCircle, Gift, Sun, Moon, MapPin,
  CheckCheck, BellOff
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useMerchantContext } from '@/context/MerchantContext';
import { useTheme } from '@/context/ThemeContext';
import {
  orderAPI, menuAPI, reservationAPI, cateringAPI,
  crmAPI, notificationAPI, authAPI
} from '@/lib/api';
import { showToast } from '@/components/ui';
import BranchLocationModal from './BranchLocationModal';

const NAV_ACTIONS = [
  { id: 'dashboard', label: 'Dashboard', hint: 'Overview, sales, quick stats', href: '/merchant', icon: Store, keywords: 'home overview today revenue' },
  { id: 'live-orders', label: 'Live Orders', hint: 'Active order pipeline', href: '/merchant/live-orders', icon: ShoppingBag, keywords: 'new pending accepted preparing ready' },
  { id: 'all-orders', label: 'All Orders', hint: 'Order history and refunds', href: '/merchant/all-orders', icon: ClipboardList, keywords: 'orders history cancelled refunded invoice' },
  { id: 'kds', label: 'Kitchen Display', hint: 'Kitchen ticket view', href: '/merchant/kds', icon: ChefHat, keywords: 'kitchen kds prepare tickets' },
  { id: 'menu', label: 'Menu Management', hint: 'Items, categories, availability', href: '/merchant/menu', icon: Utensils, keywords: 'food item category price availability' },
  { id: 'reservations', label: 'Reservations', hint: 'Tables and bookings', href: '/merchant/reservations', icon: CalendarCheck, keywords: 'booking table dine in guest' },
  { id: 'catering', label: 'Catering Enquiries', hint: 'Events and catering leads', href: '/merchant/catering', icon: CalendarCheck, keywords: 'event inquiry catering party' },
  { id: 'crm', label: 'Customers & CRM', hint: 'Customer profiles', href: '/merchant/crm', icon: Users, keywords: 'customer phone email loyalty' },
  { id: 'messages', label: 'Support Messages', hint: 'Customer inquiries and support tickets', href: '/merchant/messages', icon: MessageSquare, keywords: 'message support contact inbox ticket' },
  { id: 'promotions', label: 'Promotions & Coupons', hint: 'Discount campaigns', href: '/merchant/promotions', icon: Ticket, keywords: 'coupon discount promo offer' },
  { id: 'referrals', label: 'Referral Program', hint: 'Referral program & invite stats', href: '/merchant/referrals', icon: Gift, keywords: 'referral invite friend reward program' },
  { id: 'analytics', label: 'Reports & Analytics', hint: 'Finance and performance', href: '/merchant/analytics', icon: BarChart3, keywords: 'reports revenue sales finance' },
  { id: 'settings', label: 'Restaurant Settings', hint: 'Business settings', href: '/merchant/settings', icon: Settings, keywords: 'profile hours tax payment setup' },
  { id: 'cms', label: 'CMS Website Pages', hint: 'Manage website content', href: '/merchant/cms', icon: Layout, keywords: 'cms website pages content' },
  { id: 'push-notifications', label: 'Push Notifications', hint: 'Send alerts to customers', href: '/merchant/push-notifications', icon: Send, keywords: 'push notifications alert send' },
  { id: 'system-logs', label: 'System Logs', hint: 'Audit and error logs', href: '/merchant/system-logs', icon: Activity, keywords: 'system logs audit errors' },
];

const normalize = (value = '') => value.toString().toLowerCase().trim();

export default function DashboardHeader({ user, onToggleSidebar }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { roomId, stats = {}, restaurant } = useMerchantContext();
  const { isDark, toggleTheme } = useTheme();

  const [todayDate, setTodayDate] = useState('');
  useEffect(() => {
    try {
      setTodayDate(format(new Date(), 'EEE, d MMM yyyy'));
    } catch (_) {}
  }, []);

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteReason, setDeleteReason] = useState('closing_business');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const headerRef = useRef(null);
  const searchRef = useRef(null);
  const searchWrapRef = useRef(null);

  const activeOrders = headerCounts.activeOrders || stats.activeOrders || stats.newOrders || 0;
  const unreadCount = notifications.filter((n) => !n.isRead && !n.read).length;

  const handleDeleteMerchantAccount = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (!deletePassword) {
      setDeleteError('Please enter your account password to verify identity.');
      return;
    }

    if (deleteConfirmation.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE in capital letters to confirm.');
      return;
    }

    setIsDeleting(true);
    try {
      const res = await authAPI.deleteAccount({
        password: deletePassword,
        confirmation: deleteConfirmation.trim().toUpperCase(),
        reason: deleteReason,
      });

      if (res && (res.success || res.message)) {
        showToast.success('Merchant account permanently deleted.');
        setIsDeleteModalOpen(false);
        try { await logout(); } catch (_) {}
        router.push('/restaurant-panel');
      } else {
        setDeleteError(res?.message || 'Failed to delete account.');
      }
    } catch (err) {
      setDeleteError(err?.message || 'Incorrect password or verification failed.');
    } finally {
      setIsDeleting(false);
    }
  };

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
        let score = 0;
        if (haystack.startsWith(q)) score += 100;
        if (haystack.includes(q)) score += 50;
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
      .slice(0, 8);
  }, [query, searchData]);

  const openSearch = () => {
    setIsSearchOpen(true);
    buildSearchIndex();
  };

  const selectSuggestion = (item) => {
    setIsSearchOpen(false);
    setQuery('');
    router.push(item.href);
  };

  const handleSearchKeyDown = (event) => {
    if (!isSearchOpen || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const selected = suggestions[activeIndex];
      if (selected) selectSuggestion(selected);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'Recently';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (_) {
      return 'Recently';
    }
  };

  const getNotificationIcon = (item) => {
    const text = `${item?.title || ''} ${item?.message || ''} ${item?.body || ''} ${item?.type || ''}`.toLowerCase();
    if (text.includes('order')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-2xs">
          <ShoppingBag className="w-4 h-4" />
        </div>
      );
    }
    if (text.includes('reservation') || text.includes('table') || text.includes('booking')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-2xs">
          <CalendarCheck className="w-4 h-4" />
        </div>
      );
    }
    if (text.includes('catering') || text.includes('party')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-2xs">
          <Utensils className="w-4 h-4" />
        </div>
      );
    }
    if (text.includes('message') || text.includes('support') || text.includes('ticket')) {
      return (
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-2xs">
          <MessageSquare className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand dark:text-rose-400 border border-brand/20 flex items-center justify-center shrink-0 shadow-2xs">
        <Bell className="w-4 h-4" />
      </div>
    );
  };

  const markNotificationRead = async (notification) => {
    try {
      if (notification._id) {
        await notificationAPI.markAsRead(notification._id);
        setNotifications((prev) => prev.map((item) => (item._id === notification._id ? { ...item, isRead: true, read: true } : item)));
      }
    } catch (_) {}
    if (notification.actionUrl) {
      setNotificationOpen(false);
      router.push(notification.actionUrl);
    } else if (
      notification.type === 'order' ||
      (notification.title && notification.title.toLowerCase().includes('order')) ||
      (notification.message && notification.message.toLowerCase().includes('order'))
    ) {
      setNotificationOpen(false);
      router.push('/merchant/live-orders');
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationAPI.markAsRead('all');
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true, read: true })));
    } catch (_) {}
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/restaurant-panel');
    } catch (err) {
      showToast('Logout failed', 'error');
    }
  };

  const userInitials = (user?.name || 'Admin')
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'LL';

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-[500] flex items-center justify-between px-4 sm:px-7 h-[70px] bg-admin-surface/90 backdrop-blur-md border-b border-admin-border transition-colors duration-200"
    >
      {/* Left: Sidebar Toggle & Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-2xl">
        {/* Sidebar Toggle Hamburger (Desktop & Mobile) */}
        <button
          onClick={onToggleSidebar || (() => setMobileNavOpen((open) => !open))}
          className="text-xl text-admin-text-secondary p-2 rounded-xl hover:text-admin-text hover:bg-admin-surface-light transition-all duration-150 cursor-pointer shrink-0"
          aria-label="Toggle sidebar"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Box */}
        <div ref={searchWrapRef} className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-admin-text-muted" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onFocus={openSearch}
            onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); openSearch(); }}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search orders, menu, customers, reservations..."
            className="w-full pl-10 pr-20 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text font-medium focus:outline-none focus:border-brand/60 focus:ring-1 focus:ring-brand/20 transition-all placeholder:text-admin-text-muted"
            aria-label="Search merchant workspace"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="pointer-events-auto p-1 text-admin-text-muted hover:text-admin-text"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-[10px] font-bold text-admin-text-muted bg-admin-card border border-admin-border px-1.5 py-0.5 rounded shadow-2xs">
              Ctrl K
            </span>
          </div>

          {/* Search Dropdown Popover */}
          {isSearchOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-admin-surface border border-admin-border rounded-2xl shadow-2xl overflow-hidden z-[9200] animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-admin-border flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-admin-text-muted uppercase tracking-wider">Workspace Search</span>
                {isSearchLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />}
              </div>
              <div className="max-h-[380px] overflow-y-auto py-1.5 custom-scrollbar">
                {suggestions.length > 0 ? suggestions.map((item, idx) => {
                  const Icon = item.icon || Search;
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={`${item.type}-${item.label}-${idx}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectSuggestion(item)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                        active ? 'bg-admin-surface-light text-admin-text' : 'hover:bg-admin-surface-light/60 text-admin-text-secondary'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-brand/20 text-brand' : 'bg-admin-surface-light text-admin-text-muted'}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-bold text-sm text-admin-text truncate">{item.label}</span>
                          <span className="text-[10px] font-extrabold text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded">{item.type}</span>
                        </span>
                        <span className="block text-xs text-admin-text-muted truncate mt-0.5">{item.hint}</span>
                      </span>
                      <ArrowRight className="w-4 h-4 text-admin-text-muted" />
                    </button>
                  );
                }) : (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm font-bold text-admin-text">No matches found</p>
                    <p className="text-xs text-admin-text-muted mt-1">Try an order number, customer phone, menu item, or page name.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Actions: Dark/Light Mode Toggle, Notifications, Date, Location, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Live Orders Quick Indicator */}
        <button
          onClick={() => router.push('/merchant/live-orders')}
          className="hidden md:flex items-center gap-2 text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface-light px-3 py-1.5 rounded-full transition-colors border border-admin-border cursor-pointer shadow-2xs"
          title="Live Orders"
        >
          <ShoppingBag className="w-4 h-4 text-brand" />
          <span className="text-xs font-semibold">Live Orders</span>
          {activeOrders > 0 && (
            <span className="bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
              {activeOrders}
            </span>
          )}
        </button>

        {/* ── THEME TOGGLE BUTTON (Matching Salon Management) ── */}
        <button
          onClick={toggleTheme}
          className="relative p-2.5 rounded-full hover:bg-admin-surface-light text-admin-text-secondary hover:text-admin-text transition-all duration-200 group cursor-pointer"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            {/* Sun Icon — visible in dark mode (click to go light) */}
            <Sun
              className={`w-5 h-5 absolute inset-0 text-amber-400 transition-all duration-300 ${
                isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50 pointer-events-none'
              }`}
            />
            {/* Moon Icon — visible in light mode (click to go dark) */}
            <Moon
              className={`w-5 h-5 absolute inset-0 text-indigo-400 transition-all duration-300 ${
                isDark ? 'opacity-0 -rotate-90 scale-50 pointer-events-none' : 'opacity-100 rotate-0 scale-100'
              }`}
            />
          </div>
        </button>

        {/* ── NOTIFICATIONS BUTTON & POPOVER ── */}
        <div className="relative">
          <button
            onClick={() => { setNotificationOpen((open) => !open); setProfileOpen(false); }}
            className={`relative p-2.5 rounded-full transition-all cursor-pointer ${
              notificationOpen
                ? 'bg-brand/10 text-brand ring-2 ring-brand/20'
                : 'hover:bg-admin-surface-light text-admin-text-secondary hover:text-admin-text'
            }`}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-[18px] h-[18px] bg-brand text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover: 100% Solid & Fully Opaque in both Light & Dark Mode */}
          {notificationOpen && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-[360px] sm:w-[420px] max-w-[calc(100vw-24px)] bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.9)] overflow-hidden z-[9200] animate-fadeIn select-none">
              {/* Popover Header */}
              <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#111a2e] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand/10 dark:bg-rose-500/20 text-brand dark:text-rose-400 flex items-center justify-center shadow-2xs">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white font-heading">Notifications</span>
                      {unreadCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand text-white shadow-xs">
                          {unreadCount} new
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Caught up
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Real-time store activity & orders</p>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="px-2.5 py-1 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark read</span>
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar bg-white dark:bg-[#0c1322]">
                {notifications.length > 0 ? (
                  notifications.map((notification, idx) => {
                    const isUnread = !notification.isRead && !notification.read;
                    return (
                      <button
                        key={notification._id || notification.createdAt || idx}
                        onClick={() => markNotificationRead(notification)}
                        className={`w-full p-3.5 text-left transition-all duration-150 flex items-start gap-3 cursor-pointer ${
                          isUnread
                            ? 'bg-rose-50/50 dark:bg-rose-500/[0.08] hover:bg-rose-50 dark:hover:bg-rose-500/[0.14]'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Type Icon */}
                        {getNotificationIcon(notification)}

                        {/* Title, Message, Time */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className={`text-xs truncate ${isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                              {notification.title || 'Store Notification'}
                            </p>
                            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 shrink-0">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                          <p className={`text-xs mt-1 leading-relaxed line-clamp-2 ${isUnread ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                            {notification.message || notification.body || 'New merchant activity recorded'}
                          </p>
                        </div>

                        {/* Unread indicator bullet */}
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-brand dark:bg-rose-400 shrink-0 mt-1.5 ring-4 ring-brand/20 animate-pulse" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-6 py-10 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                      <BellOff className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white font-heading">All Caught Up!</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                      You have no new alerts. New orders, bookings and alerts will appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Popover Footer */}
              <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#111a2e] flex items-center justify-between">
                <button
                  onClick={() => { setNotificationOpen(false); router.push('/merchant/live-orders'); }}
                  className="text-xs font-bold text-brand hover:text-brand-dark dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
                >
                  <span>View Live Kitchen Orders</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                  Live updates
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── DATE PILL BADGE (Matching Salon Management) ── */}
        {todayDate && (
          <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-admin-text-secondary px-3.5 py-1.5 bg-admin-surface-light rounded-full border border-admin-border select-none shadow-2xs">
            <span>📅</span>
            <span>{todayDate}</span>
          </div>
        )}

        {/* ── RESTAURANT BRANCH PILL BADGE (Matching Salon Management) ── */}
        <button
          type="button"
          onClick={() => setLocationModalOpen(true)}
          className="hidden sm:flex items-center gap-2 text-xs font-semibold text-admin-text-secondary px-3.5 py-1.5 bg-admin-surface-light rounded-full border border-admin-border hover:border-brand hover:text-admin-text transition-colors duration-150 cursor-pointer shadow-2xs truncate max-w-[200px]"
          title="94-08 118th St, South Richmond Hill, NY 11419, United States"
        >
          <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
          <span className="truncate">{restaurant?.name || 'Lassi Lounge'}</span>
        </button>

        {/* ── USER PROFILE AVATAR & DROPDOWN ── */}
        <div className="relative border-l border-admin-border pl-2 sm:pl-3">
          <button
            onClick={() => { setProfileOpen((open) => !open); setNotificationOpen(false); }}
            className={`flex items-center gap-2.5 p-1 rounded-xl transition-all group cursor-pointer ${
              profileOpen ? 'bg-admin-surface-light' : 'hover:bg-admin-surface-light'
            }`}
          >
            {/* Avatar Circle: Rich gradient with clear white initials (visible in light and dark mode) */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand to-rose-500 flex items-center justify-center text-white font-black text-xs font-outfit tracking-wider shadow-sm shrink-0 ring-2 ring-brand/20">
              {userInitials}
            </div>
            <div className="hidden xl:block text-left pr-1">
              <p className="text-xs font-bold text-admin-text leading-tight group-hover:text-brand transition-colors truncate max-w-[120px]">
                {user?.name || 'Manager'}
              </p>
              <p className="text-[10px] text-admin-text-muted font-medium truncate mt-0.5">
                Admin Account
              </p>
            </div>
          </button>

          {/* Profile Popover: 100% Solid & Fully Opaque in both Light & Dark Mode */}
          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+12px)] w-64 bg-white dark:bg-[#0c1322] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] overflow-hidden z-[9200] animate-fadeIn select-none">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-[#111a2e] flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand to-rose-500 flex items-center justify-center text-white font-black text-xs font-outfit tracking-wider shrink-0 shadow-sm ring-2 ring-brand/20">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate font-heading">{user?.name || 'Merchant'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user?.email || restaurant?.name || 'Merchant Workspace'}</p>
                </div>
              </div>
              <button
                onClick={() => { setProfileOpen(false); router.push('/merchant/settings'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400 dark:text-slate-400" /> Restaurant Settings
              </button>
              <button
                onClick={() => { setProfileOpen(false); router.push('/merchant/crm'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
              >
                <UserCircle className="w-4 h-4 text-slate-400 dark:text-slate-400" /> Customer Workspace
              </button>
              <button
                onClick={() => { setIsDeleteModalOpen(true); setProfileOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border-t border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-500" /> Delete Merchant Account
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/70 border-t border-slate-100 dark:border-slate-800/80 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Merchant Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-admin-surface rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-admin-border relative text-admin-text">
            <button
              onClick={() => { setIsDeleteModalOpen(false); setDeleteError(''); }}
              className="absolute top-5 right-5 text-admin-text-muted hover:text-admin-text p-1.5 rounded-full hover:bg-admin-surface-light transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mb-4">
              <Trash2 className="w-7 h-7 text-rose-500" />
            </div>

            <h3 className="text-xl font-extrabold text-admin-text mb-1">
              Delete Merchant Account
            </h3>
            <p className="text-xs text-admin-text-muted mb-5 leading-relaxed">
              This will permanently delete your merchant account (<span className="font-bold text-admin-text">{user?.email}</span>), revoke managerial privileges, and unlink your profile from this restaurant.
            </p>

            {deleteError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteMerchantAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-admin-border bg-admin-surface-light text-admin-text text-xs sm:text-sm font-medium outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">
                  Type <span className="font-bold text-rose-500">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-admin-border bg-admin-surface-light text-admin-text text-xs sm:text-sm font-medium outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-admin-text-secondary mb-1">
                  Reason for deleting
                </label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-admin-border bg-admin-surface-light text-admin-text text-xs sm:text-sm font-medium outline-none focus:border-rose-500"
                >
                  <option value="closing_business">Closing restaurant business</option>
                  <option value="switching_platform">Switching to another platform</option>
                  <option value="too_complex">Platform is too complex</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-admin-text-secondary hover:bg-admin-surface-light transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Permanently Delete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RESTAURANT LOCATION MODAL (Google Maps & Branch Details) ── */}
      {locationModalOpen && (
        <BranchLocationModal
          isOpen={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          restaurant={restaurant}
          restaurantName={restaurant?.name || 'Lassi Lounge'}
          address={restaurant?.address || "94-08 118th St, South Richmond Hill, NY 11419, United States"}
          phone={restaurant?.phone || '+1 347-233-3733'}
        />
      )}
    </header>
  );
}
