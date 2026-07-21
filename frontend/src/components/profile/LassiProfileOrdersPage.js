'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bell, ChevronLeft, ChevronRight, CreditCard, Filter, Gift, Grid2X2, Heart,
  Loader2, LogOut, MapPin, PackageCheck, ReceiptText, RotateCcw, Search,
  ShieldCheck, ShoppingCart, Truck, User, Users, XCircle, UtensilsCrossed,
  CheckCircle2, Clock, DollarSign, X, Edit3, Lock, Plus, Trash2, Award,
  ArrowRight, Printer, Star, AlertCircle
} from 'lucide-react';
import { orderAPI, authAPI, loyaltyAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { showToast, Modal, Button, Input } from '@/components/ui';

// ── Dish Image Fallback Mapper ──────────────────────────────────────────────
const getDishImage = (itemName = '') => {
  const name = String(itemName).toLowerCase();
  if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
  if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
  if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
  if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
  if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
  if (name.includes('lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
  if (name.includes('roll') || name.includes('spring')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
  if (name.includes('naan') || name.includes('bread')) return 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=300&q=80';
  if (name.includes('chole') || name.includes('bhature')) return 'https://images.unsplash.com/photo-1617692855027-33b14f061079?auto=format&fit=crop&w=300&q=80';
  if (name.includes('kebab') || name.includes('hara')) return 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=300&q=80';
  if (name.includes('raita')) return 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=300&q=80';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
};

// ── Sidebar Navigation Items ────────────────────────────────────────────────
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Grid2X2 },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'addresses', label: 'My Addresses', icon: MapPin },
  { id: 'orders', label: 'My Orders', icon: ShoppingCart },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'payments', label: 'Payment Methods', icon: CreditCard },
  { id: 'loyalty', label: 'Loyalty Points', icon: Gift, badge: '120' },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'refer', label: 'Refer & Earn', icon: Users },
  { id: 'logout', label: 'Logout', icon: LogOut },
];

// ── Status Tabs ─────────────────────────────────────────────────────────────
const statusTabs = [
  { id: 'all', label: 'All Orders' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

const isOngoingStatus = (status) => ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(status);

const getStatusMeta = (status) => {
  if (status === 'delivered') {
    return { label: 'Delivered', icon: PackageCheck, className: 'bg-[#dff4df] text-[#2f8a42]' };
  }
  if (status === 'cancelled') {
    return { label: 'Cancelled', icon: XCircle, className: 'bg-[#ffe4ea] text-[#b4233a]' };
  }
  if (status === 'picked_up' || status === 'out_for_delivery') {
    return { label: 'Out for Delivery', icon: Truck, className: 'bg-[#fff2d8] text-[#c27611]' };
  }
  return { label: 'Preparing', icon: UtensilsCrossed, className: 'bg-[#fff2d8] text-[#c27611]' };
};

const formatOrderId = (order) => {
  if (order?.orderNumber) return order.orderNumber.replace(/^ORD-?/i, 'LL');
  return `LL${String(order?._id || '').slice(-5).toUpperCase()}`;
};

const formatDate = (value) => {
  if (!value) return { date: 'Today', time: '' };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
};

// ── Main Exported Component ─────────────────────────────────────────────────
export default function LassiProfileOrdersPage({ user, logout, updateUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const { addItem, clearCart } = useCart();

  const [activeNav, setActiveNav] = useState(tabParam || 'dashboard');

  useEffect(() => {
    setActiveNav(tabParam || 'dashboard');
  }, [tabParam]);
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all', 'delivery', 'pickup'

  // Fetch orders from backend DB
  useEffect(() => {
    let isCancelled = false;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await orderAPI.getMyOrders();
        if (!isCancelled) {
          setOrders(res?.data || []);
        }
      } catch (err) {
        if (!isCancelled) {
          showToast(err.message || 'Failed to load order history', 'error');
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchOrders();
    return () => {
      isCancelled = true;
    };
  }, []);

  // Filtered orders logic
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      // Filter by status tab
      const matchesStatus =
        activeStatus === 'all' ||
        (activeStatus === 'ongoing' && isOngoingStatus(order.status)) ||
        order.status === activeStatus;

      // Filter by order type (Filter Modal)
      const matchesType = filterType === 'all' || order.orderType === filterType;

      // Filter by Search Query (Order ID or dish item name)
      const matchesSearch =
        !query ||
        formatOrderId(order).toLowerCase().includes(query) ||
        String(order.orderNumber || '').toLowerCase().includes(query) ||
        order.items?.some((item) => String(item.name).toLowerCase().includes(query));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [activeStatus, filterType, orders, search]);

  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pageOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [activeStatus, search, filterType]);

  // Handle Reorder
  const handleReorder = (order) => {
    const restaurantData = {
      _id: order.restaurantId,
      name: order.restaurantName || 'Lassi Lounge',
      address: order.restaurantAddress || order.address || '',
      phone: order.restaurantPhone || '',
      deliveryFee: order.deliveryFee || 0,
      taxRate: order.taxRate,
    };

    clearCart();
    order.items?.forEach((item) => {
      addItem(
        {
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.selectedSize?.price || item.price,
          image: item.image || getDishImage(item.name),
          quantity: item.quantity || 1,
          selectedSize: item.selectedSize || null,
          addOns: item.addOns || [],
          specialInstructions: item.specialInstructions || '',
        },
        restaurantData
      );
    });

    showToast('Items added back to your cart!', 'success');
    router.push('/customer/checkout');
  };

  const handleNavClick = async (id) => {
    if (id === 'logout') {
      if (logout) await logout();
      router.push('/login');
      return;
    }
    setActiveNav(id);
    router.push(`/customer/profile?tab=${id}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#1a1a1a]">
      {/* Hero Banner Header */}
      <ProfileHero activeNav={activeNav} />

      <main className="mx-auto max-w-[1160px] px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* Account Sidebar */}
          <AccountSidebar
            user={user}
            activeNav={activeNav}
            onNavClick={handleNavClick}
            onOrderNow={() => router.push('/customer/restaurant/lassi-lounge')}
          />

          {/* Right Main Section depending on selected sidebar tab */}
          <div className="min-w-0">
            {activeNav === 'orders' && (
              <section className="rounded-xl border border-[#eadfdb] bg-white shadow-sm overflow-hidden">
                <OrdersHeader
                  activeStatus={activeStatus}
                  setActiveStatus={setActiveStatus}
                  search={search}
                  setSearch={setSearch}
                  onOpenFilter={() => setFilterModalOpen(true)}
                  filterType={filterType}
                />

                <div className="p-4 md:p-6 space-y-4">
                  {loading ? (
                    <OrdersSkeleton />
                  ) : pageOrders.length === 0 ? (
                    <EmptyOrders activeStatus={activeStatus} search={search} />
                  ) : (
                    <div className="space-y-4">
                      {pageOrders.map((order) => (
                        <OrderHistoryCard
                          key={order._id}
                          order={order}
                          onReorder={() => handleReorder(order)}
                          onViewDetails={() => setSelectedOrder(order)}
                        />
                      ))}
                    </div>
                  )}

                  {!loading && pageOrders.length > 0 && (
                    <Pagination page={page} pageCount={pageCount} setPage={setPage} />
                  )}
                </div>
              </section>
            )}

            {activeNav === 'dashboard' && <DashboardSubView user={user} orders={orders} onNavClick={handleNavClick} onReorder={handleReorder} />}
            {activeNav === 'profile' && <MyProfileSubView user={user} updateUser={updateUser} />}
            {activeNav === 'addresses' && <MyAddressesSubView user={user} updateUser={updateUser} />}
            {activeNav === 'loyalty' && <LoyaltySubView user={user} />}
            {activeNav === 'favorites' && <FavoritesSubView user={user} />}
            {activeNav === 'payments' && <PaymentMethodsSubView user={user} />}
            {activeNav === 'notifications' && <NotificationsSubView user={user} />}
            {activeNav === 'refer' && <ReferEarnSubView user={user} />}
          </div>
        </div>

        {/* Bottom Trust Features Banner */}
        <TrustStrip />
      </main>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onReorder={() => {
            const ord = selectedOrder;
            setSelectedOrder(null);
            handleReorder(ord);
          }}
        />
      )}

      {/* Filter Modal */}
      {filterModalOpen && (
        <FilterModal
          filterType={filterType}
          setFilterType={setFilterType}
          onClose={() => setFilterModalOpen(false)}
        />
      )}
    </div>
  );
}

// ── 1. Profile Hero Section ─────────────────────────────────────────────────
function ProfileHero({ activeNav }) {
  const titles = {
    orders: 'My Orders',
    dashboard: 'Dashboard',
    profile: 'My Profile',
    addresses: 'My Addresses',
    favorites: 'My Favorites',
    payments: 'Payment Methods',
    loyalty: 'Loyalty Points',
    notifications: 'Notifications',
    refer: 'Refer & Earn',
  };

  const currentTitle = titles[activeNav] || 'My Account';

  return (
    <section className="relative min-h-[220px] overflow-hidden bg-[#080604]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/branded/lassi-lounge/hero-spread.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/30" />
      <div className="relative mx-auto max-w-[1160px] px-4 md:px-6 py-12">
        <h1 className="font-serif text-[34px] md:text-[42px] font-black text-white leading-tight">
          {currentTitle}
        </h1>
        <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold">
          <span className="text-white/80">Home</span>
          <ChevronRight className="h-3.5 w-3.5 text-white/50" />
          <span className="text-white/80">My Account</span>
          <ChevronRight className="h-3.5 w-3.5 text-white/50" />
          <span className="text-[#e8a020] font-bold">{currentTitle}</span>
        </div>
        <p className="mt-4 max-w-[420px] text-[14px] leading-relaxed text-white/85">
          Track, view and reorder your favorite meals from Lassi Lounge.
        </p>
      </div>
    </section>
  );
}

// ── 2. Account Sidebar ──────────────────────────────────────────────────────
function AccountSidebar({ user, activeNav, onNavClick, onOrderNow }) {
  const points = user?.loyaltyPoints || 120;

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      {/* Top User Profile Header Box */}
      <div className="overflow-hidden rounded-xl border border-[#eadfdb] bg-white shadow-sm">
        <div className="bg-gradient-to-br from-[#73050a] via-[#8d0309] to-[#680307] p-5 text-white flex items-center gap-4">
          <div className="h-[62px] w-[62px] rounded-full bg-white flex items-center justify-center text-[#8d0309] shrink-0 shadow-md">
            <User className="h-9 w-9 text-[#73050a]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-[17px] font-black truncate leading-snug">{user?.name || 'John Smith'}</h2>
            <p className="text-[12px] text-white/80 truncate mt-1">{user?.email || 'johnsmith@gmail.com'}</p>
            <p className="text-[12px] text-white/80 mt-0.5">{user?.phone || '(516) 612-0300'}</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            const badgeValue = item.id === 'loyalty' ? points : item.badge;

            return (
              <button
                key={item.id}
                onClick={() => onNavClick(item.id)}
                className={`w-full flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-left text-[14px] font-bold transition-all ${
                  isActive
                    ? 'bg-[#fff1cf] text-[#7a0b10] shadow-[inset_4px_0_0_#7a0b10]'
                    : 'text-[#333333] hover:bg-[#fff8ed] hover:text-[#7a0b10]'
                }`}
              >
                <span className="flex items-center gap-3.5">
                  <Icon className={`h-5 w-5 ${isActive ? 'text-[#7a0b10]' : 'text-[#8d1118]'}`} strokeWidth={1.8} />
                  {item.label}
                </span>
                {badgeValue !== undefined && badgeValue !== null && (
                  <span className="rounded-full bg-[#8d0309] px-2 py-1 text-[10px] font-black text-white shadow-xs">
                    {badgeValue}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Side Promo Banner */}
      <div className="relative overflow-hidden rounded-xl min-h-[310px] p-6 text-white shadow-md flex flex-col justify-between">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/branded/lassi-lounge/hero-spread.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#73050a]/95 via-[#4d0205]/80 to-black/40" />

        <div className="relative z-10">
          <h3 className="font-serif text-[22px] font-black leading-snug">
            Craving something <span className="text-[#e8a020]">delicious again?</span>
          </h3>
          <p className="mt-3 text-[13px] leading-relaxed text-white/90">
            Reorder your favorites in just a few clicks.
          </p>
          <button
            onClick={onOrderNow}
            className="mt-5 rounded-lg bg-[#e8a020] px-6 py-3 text-[12px] font-black uppercase tracking-wider text-[#1a1a1a] shadow-md hover:bg-[#d4901a] transition-colors"
          >
            ORDER NOW
          </button>
        </div>

        {/* Small Overlay Lassi Glass image */}
        <div className="relative z-10 self-end mt-4">
          <img
            src="/images/branded/lassi-lounge/dishes/mango-lassi.jpg"
            alt="Lassi"
            className="h-20 w-20 rounded-full object-cover border-2 border-[#e8a020] shadow-lg"
          />
        </div>
      </div>
    </aside>
  );
}

// ── 3. Orders Header Toolbar ────────────────────────────────────────────────
function OrdersHeader({ activeStatus, setActiveStatus, search, setSearch, onOpenFilter, filterType }) {
  return (
    <div className="border-b border-[#eadfdb] px-4 md:px-6 pt-5 bg-white">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <h2 className="font-serif text-[26px] font-black text-[#7a0b10]">Order History</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-[320px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by order ID or item..."
              className="w-full h-10 rounded-lg border border-[#eadfdb] bg-white pl-4 pr-11 text-[13px] font-medium text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#7a0b10] focus:outline-none focus:ring-4 focus:ring-[#7a0b10]/10"
            />
            <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d1118]" />
          </div>

          {/* Filter Button */}
          <button
            onClick={onOpenFilter}
            className={`h-10 rounded-lg border px-5 text-[13px] font-black flex items-center justify-center gap-2 transition-colors ${
              filterType !== 'all'
                ? 'bg-[#7a0b10] border-[#7a0b10] text-white'
                : 'border-[#b47b80] text-[#7a0b10] hover:bg-[#fff8ed]'
            }`}
          >
            <Filter className="h-4 w-4" /> Filter {filterType !== 'all' && `(${filterType})`}
          </button>
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="mt-5 flex flex-wrap gap-8 border-t border-[#f3ece8] pt-3">
        {statusTabs.map((tab) => {
          const isActive = activeStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={`relative pb-3 text-[14px] font-black transition-colors ${
                isActive ? 'text-[#7a0b10]' : 'text-[#6b7280] hover:text-[#7a0b10]'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#7a0b10] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 4. Order History Card ───────────────────────────────────────────────────
function OrderHistoryCard({ order, onReorder, onViewDetails }) {
  const statusMeta = getStatusMeta(order.status);
  const StatusIcon = statusMeta.icon;
  const stamp = formatDate(order.createdAt);
  const displayItems = order.items?.slice(0, 3) || [];
  const totalItemsCount = order.items?.length || 0;
  const canReorder = order.status !== 'cancelled';

  return (
    <article className="rounded-xl border border-[#eadfdb] bg-white p-5 shadow-[0_2px_12px_rgba(122,11,16,0.03)] grid grid-cols-1 xl:grid-cols-[130px_160px_1fr_130px] gap-5 items-center hover:border-[#b47b80] transition-all">
      {/* Col 1: Order ID & Date/Time */}
      <div className="xl:border-r xl:border-[#f0e6e2] xl:pr-4">
        <p className="text-[11px] font-bold text-[#6b7280]">Order ID</p>
        <h3 className="mt-1 text-[19px] font-black text-[#7a0b10] tracking-tight">{formatOrderId(order)}</h3>
        <p className="mt-3 text-[12px] font-semibold text-[#4b5563]">{stamp.date}</p>
        <p className="text-[12px] font-semibold text-[#4b5563]">{stamp.time}</p>
      </div>

      {/* Col 2: Status & Address & Total */}
      <div className="xl:border-r xl:border-[#f0e6e2] xl:pr-4">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-black ${statusMeta.className}`}>
          <StatusIcon className="h-3.5 w-3.5" /> {statusMeta.label}
        </span>

        <p className="mt-3 text-[11px] font-black text-[#1a1a1a]">
          {order.orderType === 'pickup' ? 'Pickup from' : 'Delivery to'}
        </p>
        <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-[#4b5563] line-clamp-2">
          {order.orderType === 'pickup'
            ? order.restaurantAddress || 'Lassi Lounge Restaurant'
            : order.address || '34 Union Avenue, Patiala, NY 11022, USA'}
        </p>

        <p className="mt-3 text-[11px] font-black text-[#1a1a1a]">Total Amount</p>
        <p className="text-[19px] font-black text-[#7a0b10]">${Number(order.total || 0).toFixed(2)}</p>
      </div>

      {/* Col 3: Items Thumbnails & Breakdown */}
      <div>
        <h4 className="text-[13px] font-black text-[#1a1a1a] mb-3">
          {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {displayItems.map((item, idx) => (
            <div key={`${item.menuItemId || item.name}-${idx}`} className="min-w-0">
              <img
                src={item.image || getDishImage(item.name)}
                alt={item.name}
                className="h-[68px] w-[68px] rounded-lg object-cover border border-[#eadfdb] shadow-xs"
              />
              <p className="mt-1.5 text-[12px] font-black text-[#1a1a1a] truncate">{item.name}</p>
              <p className="text-[11px] font-bold text-[#6b7280]">x {item.quantity || 1}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Col 4: Action Buttons */}
      <div className="flex xl:flex-col items-center xl:items-stretch justify-between gap-3 pt-2 xl:pt-0">
        {canReorder && (
          <button
            onClick={onReorder}
            className="w-full rounded-lg border border-[#b47b80] px-4 py-2.5 text-[13px] font-black text-[#7a0b10] flex items-center justify-center gap-2 hover:bg-[#fff8ed] transition-colors"
          >
            <ShoppingCart className="h-4 w-4" /> Reorder
          </button>
        )}

        <button
          onClick={onViewDetails}
          className="w-full text-[13px] font-black text-[#7a0b10] flex items-center justify-center gap-1.5 hover:underline py-1"
        >
          View Details <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

// ── 5. Order Details Modal ──────────────────────────────────────────────────
function OrderDetailsModal({ order, onClose, onReorder }) {
  const statusMeta = getStatusMeta(order.status);
  const StatusIcon = statusMeta.icon;
  const stamp = formatDate(order.createdAt);

  const steps = [
    { key: 'pending', label: 'Placed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const currentStepIdx = steps.findIndex(s => s.key === order.status);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Order #${formatOrderId(order)}`}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        {/* Header Summary */}
        <div className="flex items-center justify-between border-b border-[#eadfdb] pb-4">
          <div>
            <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[13px] font-black ${statusMeta.className}`}>
              <StatusIcon className="h-4 w-4" /> {statusMeta.label}
            </span>
            <p className="text-[12px] font-semibold text-[#6b7280] mt-2">
              Placed on {stamp.date} at {stamp.time}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-[#6b7280]">Total Amount</p>
            <p className="text-[22px] font-black text-[#7a0b10]">${Number(order.total || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Live Status Tracker Stepper (if not cancelled) */}
        {order.status !== 'cancelled' && (
          <div className="rounded-xl border border-[#eadfdb] bg-[#fffaf5] p-4">
            <h4 className="text-[13px] font-black text-[#7a0b10] mb-4">Order Progress</h4>
            <div className="flex items-center justify-between relative">
              {steps.map((step, idx) => {
                const isCompleted = idx <= (currentStepIdx >= 0 ? currentStepIdx : 4);
                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-black ${
                        isCompleted ? 'bg-[#7a0b10] text-white shadow-xs' : 'bg-[#e5e7eb] text-[#6b7280]'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span className="text-[10px] font-bold mt-1.5 text-center text-[#333]">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Itemized Dish Breakdown */}
        <div>
          <h4 className="text-[14px] font-black text-[#1a1a1a] mb-3">Items Ordered</h4>
          <div className="divide-y divide-[#f0e6e2] rounded-xl border border-[#eadfdb] overflow-hidden">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3.5 bg-white">
                <img
                  src={item.image || getDishImage(item.name)}
                  alt={item.name}
                  className="h-14 w-14 rounded-lg object-cover border border-[#eadfdb]"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-[13px] font-black text-[#1a1a1a] truncate">{item.name}</h5>
                  {item.selectedSize?.name && (
                    <p className="text-[11px] font-medium text-[#6b7280]">Size: {item.selectedSize.name}</p>
                  )}
                  {item.addOns?.length > 0 && (
                    <p className="text-[11px] font-medium text-[#6b7280]">
                      Add-ons: {item.addOns.map(a => a.name).join(', ')}
                    </p>
                  )}
                  <p className="text-[11px] font-bold text-[#7a0b10] mt-0.5">${Number(item.price || 0).toFixed(2)} x {item.quantity || 1}</p>
                </div>
                <p className="text-[14px] font-black text-[#1a1a1a]">
                  ${Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address & Customer Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#eadfdb] p-3.5 bg-[#fbfaf7]">
            <h5 className="text-[12px] font-black text-[#7a0b10] mb-1">Delivery Address</h5>
            <p className="text-[12px] font-semibold text-[#333] leading-relaxed">
              {order.address || '34 Union Avenue, Patiala, NY 11022, USA'}
            </p>
            <p className="text-[11px] font-medium text-[#6b7280] mt-1">
              Customer: {order.customerName} ({order.customerPhone})
            </p>
          </div>

          <div className="rounded-xl border border-[#eadfdb] p-3.5 bg-[#fbfaf7]">
            <h5 className="text-[12px] font-black text-[#7a0b10] mb-1">Payment & Receipt</h5>
            <p className="text-[12px] font-semibold text-[#333]">
              Method: <span className="uppercase">{order.paymentMethod || 'Credit Card'}</span>
            </p>
            <p className="text-[12px] font-semibold text-[#333] mt-1">
              Status: <span className="text-[#2f8a42] font-black">PAID</span>
            </p>
          </div>
        </div>

        {/* Bill Summary Breakdown */}
        <div className="rounded-xl border border-[#eadfdb] p-4 space-y-2 bg-[#fff8ed]">
          <div className="flex justify-between text-[12px] font-medium text-[#4b5563]">
            <span>Subtotal</span>
            <span>${Number(order.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[12px] font-medium text-[#4b5563]">
            <span>Delivery Fee</span>
            <span>${Number(order.deliveryFee || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[12px] font-medium text-[#4b5563]">
            <span>Tax</span>
            <span>${Number(order.tax || 0).toFixed(2)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-[12px] font-medium text-[#2f8a42]">
              <span>Discount</span>
              <span>-${Number(order.discount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-[15px] font-black text-[#7a0b10] border-t border-[#eadfdb] pt-2">
            <span>Total</span>
            <span>${Number(order.total || 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {order.status !== 'cancelled' && (
            <button
              onClick={onReorder}
              className="rounded-lg bg-[#7a0b10] px-5 py-2.5 text-[13px] font-black text-white flex items-center gap-2 hover:bg-[#680307] transition-colors shadow-xs"
            >
              <ShoppingCart className="h-4 w-4" /> Reorder All Items
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-[#eadfdb] px-4 py-2.5 text-[13px] font-bold text-[#333] hover:bg-[#f3ece8]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── 6. Filter Modal ─────────────────────────────────────────────────────────
function FilterModal({ filterType, setFilterType, onClose }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Filter Orders">
      <div className="space-y-5">
        <div>
          <label className="text-[13px] font-black text-[#1a1a1a] block mb-2">Order Type</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'delivery', label: 'Delivery' },
              { id: 'pickup', label: 'Pickup' },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                className={`py-2.5 rounded-lg text-[13px] font-bold border transition-colors ${
                  filterType === type.id
                    ? 'bg-[#7a0b10] border-[#7a0b10] text-white'
                    : 'border-[#eadfdb] bg-white text-[#333] hover:bg-[#fff8ed]'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#eadfdb]">
          <button
            onClick={() => {
              setFilterType('all');
              onClose();
            }}
            className="px-4 py-2 text-[13px] font-bold text-[#6b7280] hover:text-[#1a1a1a]"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-[#7a0b10] px-5 py-2 text-[13px] font-black text-white hover:bg-[#680307]"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── 7. Pagination Component ─────────────────────────────────────────────────
function Pagination({ page, pageCount, setPage }) {
  return (
    <div className="flex justify-center items-center gap-2 pt-4">
      <button
        disabled={page === 1}
        onClick={() => setPage(1)}
        className="h-9 w-9 rounded-lg border border-[#eadfdb] bg-white text-[13px] font-black text-[#6b7280] disabled:opacity-40 hover:bg-[#fff8ed] flex items-center justify-center transition-colors"
      >
        «
      </button>

      <button
        disabled={page === 1}
        onClick={() => setPage(Math.max(1, page - 1))}
        className="h-9 w-9 rounded-lg border border-[#eadfdb] bg-white text-[13px] font-black text-[#6b7280] disabled:opacity-40 hover:bg-[#fff8ed] flex items-center justify-center transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {Array.from({ length: pageCount }).slice(0, 5).map((_, index) => {
        const value = index + 1;
        const isActive = page === value;
        return (
          <button
            key={value}
            onClick={() => setPage(value)}
            className={`h-9 w-9 rounded-lg border text-[13px] font-black transition-colors ${
              isActive
                ? 'bg-[#7a0b10] border-[#7a0b10] text-white shadow-xs'
                : 'border-[#eadfdb] bg-white text-[#4b5563] hover:bg-[#fff8ed]'
            }`}
          >
            {value}
          </button>
        );
      })}

      <button
        disabled={page === pageCount}
        onClick={() => setPage(Math.min(pageCount, page + 1))}
        className="h-9 w-9 rounded-lg border border-[#eadfdb] bg-white text-[13px] font-black text-[#6b7280] disabled:opacity-40 hover:bg-[#fff8ed] flex items-center justify-center transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <button
        disabled={page === pageCount}
        onClick={() => setPage(pageCount)}
        className="h-9 w-9 rounded-lg border border-[#eadfdb] bg-white text-[13px] font-black text-[#6b7280] disabled:opacity-40 hover:bg-[#fff8ed] flex items-center justify-center transition-colors"
      >
        »
      </button>
    </div>
  );
}

// ── 8. Empty & Skeleton States ──────────────────────────────────────────────
function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-[160px] rounded-xl border border-[#eadfdb] bg-[#fbfaf7] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyOrders({ activeStatus, search }) {
  return (
    <div className="rounded-xl border border-dashed border-[#eadfdb] bg-[#fbfaf7] py-16 text-center">
      <ReceiptText className="mx-auto h-12 w-12 text-[#b47b80]" strokeWidth={1.5} />
      <h3 className="mt-4 text-[19px] font-black text-[#1a1a1a]">No orders found</h3>
      <p className="mt-2 text-[13px] font-medium text-[#6b7280] max-w-sm mx-auto">
        {search
          ? `No orders matching "${search}"`
          : activeStatus === 'all'
          ? 'Your Lassi Lounge order history will appear here after you place an order.'
          : `No ${activeStatus} orders found in your history.`}
      </p>
    </div>
  );
}

// ── 9. Trust Feature Callout Strip ──────────────────────────────────────────
function TrustStrip() {
  const items = [
    { icon: Truck, title: 'On-Time Delivery', desc: 'We ensure on-time delivery at your doorstep.' },
    { icon: UtensilsCrossed, title: 'Freshly Prepared', desc: 'Your food is prepared fresh after you place the order.' },
    { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure payment and data protection.' },
    { icon: RotateCcw, title: 'Easy Returns', desc: 'Not satisfied? Get quick refunds with no hassle.' },
  ];

  return (
    <section className="mt-10 rounded-xl border border-[#f2e5dc] bg-[#fff8ed] overflow-hidden shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#eadfdb]">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-center gap-4 px-6 py-5">
              <Icon className="h-8 w-8 shrink-0 text-[#8d1118]" strokeWidth={1.7} />
              <div>
                <h4 className="text-[13px] font-black text-[#1a1a1a]">{item.title}</h4>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-[#4b5563]">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── 10. Sidebar Tab Sub-views ───────────────────────────────────────────────

function DashboardSubView({ user, orders, onNavClick, onReorder }) {
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const points = user?.loyaltyPoints || 120;
  const recentOrder = orders[0];

  return (
    <div className="space-y-6">
      <h2 className="font-serif text-[24px] font-black text-[#7a0b10]">Dashboard Overview</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#eadfdb] bg-white p-5 shadow-xs">
          <p className="text-[12px] font-bold text-[#6b7280]">Total Orders</p>
          <p className="text-[28px] font-black text-[#7a0b10] mt-1">{totalOrders}</p>
          <p className="text-[11px] text-[#2f8a42] font-semibold mt-1">{deliveredOrders} Delivered</p>
        </div>

        <div className="rounded-xl border border-[#eadfdb] bg-white p-5 shadow-xs">
          <p className="text-[12px] font-bold text-[#6b7280]">Total Spent</p>
          <p className="text-[28px] font-black text-[#7a0b10] mt-1">${totalSpent.toFixed(2)}</p>
          <p className="text-[11px] text-[#6b7280] font-semibold mt-1">Across all orders</p>
        </div>

        <div className="rounded-xl border border-[#eadfdb] bg-white p-5 shadow-xs">
          <p className="text-[12px] font-bold text-[#6b7280]">Loyalty Points</p>
          <p className="text-[28px] font-black text-[#7a0b10] mt-1">{points} pts</p>
          <p className="text-[11px] text-[#2f8a42] font-semibold mt-1">Value: ${(points / 100).toFixed(2)}</p>
        </div>
      </div>

      {/* Recent Order Quick Card */}
      {recentOrder && (
        <div className="rounded-xl border border-[#eadfdb] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#eadfdb] pb-3 mb-4">
            <h3 className="text-[15px] font-black text-[#1a1a1a]">Recent Order</h3>
            <button
              onClick={() => onNavClick('orders')}
              className="text-[12px] font-bold text-[#7a0b10] hover:underline"
            >
              View All Orders →
            </button>
          </div>
          <OrderHistoryCard
            order={recentOrder}
            onReorder={() => onReorder(recentOrder)}
            onViewDetails={() => onNavClick('orders')}
          />
        </div>
      )}
    </div>
  );
}

function MyProfileSubView({ user, updateUser }) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile({ name, phone });
      if (updateUser && res?.data) updateUser(res.data);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#eadfdb] bg-white p-6 shadow-sm space-y-6">
      <h2 className="font-serif text-[24px] font-black text-[#7a0b10]">My Profile Settings</h2>

      <form onSubmit={handleSave} noValidate className="space-y-4 max-w-lg">
        <div>
          <label className="block text-[13px] font-black text-[#1a1a1a] mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-11 rounded-lg border border-[#eadfdb] px-4 text-[13px] font-medium text-[#1a1a1a] focus:border-[#7a0b10] focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-[13px] font-black text-[#1a1a1a] mb-1">Email Address</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full h-11 rounded-lg border border-[#eadfdb] bg-[#f9f9f9] px-4 text-[13px] font-medium text-[#6b7280]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-black text-[#1a1a1a] mb-1">Phone Number</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-11 rounded-lg border border-[#eadfdb] px-4 text-[13px] font-medium text-[#1a1a1a] focus:border-[#7a0b10] focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#7a0b10] px-6 py-3 text-[13px] font-black text-white hover:bg-[#680307] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving Changes...' : 'Save Profile Changes'}
        </button>
      </form>
    </div>
  );
}

function MyAddressesSubView({ user, updateUser }) {
  const addresses = user?.addresses || [
    { _id: '1', street: '34 Union Avenue', city: 'Patiala', state: 'NY', zip: '11022', country: 'USA', isDefault: true }
  ];

  return (
    <div className="rounded-xl border border-[#eadfdb] bg-white p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-[#eadfdb] pb-4">
        <h2 className="font-serif text-[24px] font-black text-[#7a0b10]">Saved Addresses</h2>
        <button
          onClick={() => showToast('Address manager modal ready', 'info')}
          className="rounded-lg bg-[#7a0b10] px-4 py-2 text-[12px] font-black text-white flex items-center gap-1.5 hover:bg-[#680307]"
        >
          <Plus className="h-4 w-4" /> Add New Address
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div key={addr._id} className="rounded-xl border border-[#eadfdb] p-4 bg-[#fffaf5] relative">
            {addr.isDefault && (
              <span className="absolute top-3 right-3 rounded-full bg-[#7a0b10] px-2.5 py-0.5 text-[10px] font-black text-white">
                Default
              </span>
            )}
            <MapPin className="h-5 w-5 text-[#8d1118] mb-2" />
            <p className="text-[13px] font-black text-[#1a1a1a]">{addr.street}</p>
            <p className="text-[12px] font-medium text-[#6b7280]">
              {addr.city}, {addr.state} {addr.zip}, {addr.country}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoyaltySubView({ user }) {
  const points = user?.loyaltyPoints || 120;
  const cashValue = (points / 100).toFixed(2);

  return (
    <div className="rounded-xl border border-[#eadfdb] bg-white p-6 shadow-sm space-y-6">
      <h2 className="font-serif text-[24px] font-black text-[#7a0b10]">Loyalty Points & Rewards</h2>

      <div className="rounded-xl bg-gradient-to-r from-[#73050a] to-[#8d0309] p-6 text-white flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-white/80">Available Loyalty Points</p>
          <h3 className="text-[36px] font-black mt-1">{points} PTS</h3>
          <p className="text-[13px] text-[#e8a020] font-bold mt-1">Cash Value Equivalent: ${cashValue}</p>
        </div>
        <Gift className="h-16 w-16 text-white/20" />
      </div>

      <div className="border-t border-[#eadfdb] pt-4">
        <h4 className="text-[15px] font-black text-[#1a1a1a] mb-2">How it works</h4>
        <ul className="text-[13px] font-medium text-[#4b5563] space-y-2 list-disc pl-5">
          <li>Earn 1 point for every $1 spent on Lassi Lounge orders.</li>
          <li>100 points = $1.00 discount on your next order.</li>
          <li>Points never expire!</li>
        </ul>
      </div>
    </div>
  );
}

function FavoritesSubView() {
  return (
    <div className="rounded-xl border border-[#eadfdb] bg-white p-6 shadow-sm space-y-4 text-center py-12">
      <Heart className="mx-auto h-12 w-12 text-[#b47b80]" />
      <h3 className="text-[19px] font-black text-[#1a1a1a]">My Favorites</h3>
      <p className="text-[13px] text-[#6b7280]">Save your favorite dishes to quickly order them anytime.</p>
    </div>
  );
}

function PaymentMethodsSubView() {
  return (
    <div className="rounded-xl border border-[#eadfdb] bg-white p-6 shadow-sm space-y-4">
      <h2 className="font-serif text-[24px] font-black text-[#7a0b10]">Payment Methods</h2>
      <div className="rounded-xl border border-[#eadfdb] p-4 flex items-center justify-between bg-[#fffaf5]">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-[#7a0b10]" />
          <div>
            <p className="text-[13px] font-black text-[#1a1a1a]">Visa ending in 4242</p>
            <p className="text-[11px] text-[#6b7280]">Expires 12/28</p>
          </div>
        </div>
        <span className="text-[11px] font-black text-[#2f8a42]">Default</span>
      </div>
    </div>
  );
}

function NotificationsSubView() {
  return (
    <div className="rounded-xl border border-[#eadfdb] bg-white p-6 shadow-sm space-y-4">
      <h2 className="font-serif text-[24px] font-black text-[#7a0b10]">Notification Preferences</h2>
      <div className="space-y-3">
        {['Order status updates via Email', 'Promotional offers and discounts', 'SMS delivery updates'].map((label, idx) => (
          <label key={idx} className="flex items-center gap-3 text-[13px] font-bold text-[#333]">
            <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#7a0b10]" />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

function ReferEarnSubView() {
  return (
    <div className="rounded-xl border border-[#eadfdb] bg-white p-6 shadow-sm space-y-4">
      <h2 className="font-serif text-[24px] font-black text-[#7a0b10]">Refer & Earn $10</h2>
      <p className="text-[13px] font-medium text-[#4b5563]">
        Share your code with friends and give them $10 off their first order. You get $10 when they order!
      </p>
      <div className="flex items-center gap-3 max-w-md">
        <input
          value="LASSI100"
          readOnly
          className="h-11 flex-1 rounded-lg border border-[#eadfdb] bg-[#f9f9f9] px-4 font-black text-[#7a0b10]"
        />
        <button
          onClick={() => {
            navigator.clipboard.writeText('LASSI100');
            showToast('Referral code copied to clipboard!', 'success');
          }}
          className="h-11 rounded-lg bg-[#7a0b10] px-5 text-[13px] font-black text-white hover:bg-[#680307]"
        >
          Copy Code
        </button>
      </div>
    </div>
  );
}