'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell, ChevronLeft, ChevronRight, CreditCard, Filter, Gift, Grid2X2, Heart,
  Loader2, LogOut, MapPin, PackageCheck, ReceiptText, RotateCcw, Search,
  ShieldCheck, ShoppingCart, Truck, User, Users, WalletCards, XCircle,
  UtensilsCrossed
} from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { showToast } from '@/components/ui';

const getDishImage = (itemName = '') => {
  const name = itemName.toLowerCase();
  if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
  if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
  if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
  if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
  if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
  if (name.includes('lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
  if (name.includes('roll') || name.includes('spring')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
  if (name.includes('naan')) return 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=240&q=80';
  if (name.includes('chole') || name.includes('bhature')) return 'https://images.unsplash.com/photo-1617692855027-33b14f061079?auto=format&fit=crop&w=240&q=80';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=240&q=80';
};

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
  if (order.orderNumber) return order.orderNumber.replace(/^ORD-?/i, 'LL');
  return `LL${String(order._id || '').slice(-5).toUpperCase()}`;
};

const formatDate = (value) => {
  if (!value) return { date: 'Today', time: '' };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
};

export default function LassiProfileOrdersPage({ user, logout }) {
  const router = useRouter();
  const { addItem, clearCart } = useCart();
  const [activeNav, setActiveNav] = useState('orders');
  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      setLoading(true);
      try {
        const data = await orderAPI.getMyOrders();
        if (!cancelled) setOrders(data.data || []);
      } catch (err) {
        if (!cancelled) showToast(err.message || 'Failed to load orders', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus =
        activeStatus === 'all' ||
        (activeStatus === 'ongoing' && isOngoingStatus(order.status)) ||
        order.status === activeStatus;
      const matchesSearch =
        !query ||
        formatOrderId(order).toLowerCase().includes(query) ||
        String(order.orderNumber || '').toLowerCase().includes(query) ||
        order.items?.some((item) => item.name?.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [activeStatus, orders, search]);

  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pageOrders = filteredOrders.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [activeStatus, search]);

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
      addItem({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.selectedSize?.price || item.price,
        image: item.image || getDishImage(item.name),
        quantity: item.quantity || 1,
        selectedSize: item.selectedSize || null,
        addOns: item.addOns || [],
        specialInstructions: item.specialInstructions || '',
      }, restaurantData);
    });

    showToast('Items added back to your cart', 'success');
    router.push('/customer/checkout');
  };

  const handleNavClick = async (id) => {
    if (id === 'logout') {
      await logout();
      router.push('/login');
      return;
    }
    setActiveNav(id);
    if (id !== 'orders') {
      showToast('This profile section is being polished next', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#1a1a1a] ll-page-enter">
      <ProfileHero />

      <main className="mx-auto max-w-[1160px] px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6 items-start">
          <AccountSidebar
            user={user}
            activeNav={activeNav}
            onNavClick={handleNavClick}
          />

          <section className="rounded-xl border border-[#eadfdb] bg-white shadow-sm overflow-hidden ll-reveal">
            <OrdersHeader
              activeStatus={activeStatus}
              setActiveStatus={setActiveStatus}
              search={search}
              setSearch={setSearch}
            />

            <div className="p-4 md:p-5 space-y-4">
              {loading ? (
                <OrdersSkeleton />
              ) : pageOrders.length === 0 ? (
                <EmptyOrders activeStatus={activeStatus} />
              ) : (
                <div className="space-y-4 ll-stagger">
                  {pageOrders.map((order) => (
                    <OrderHistoryCard
                      key={order._id}
                      order={order}
                      onReorder={() => handleReorder(order)}
                      onViewDetails={() => router.push(`/customer/orders/${order._id}`)}
                    />
                  ))}
                </div>
              )}

              {!loading && pageOrders.length > 0 && (
                <Pagination page={page} pageCount={pageCount} setPage={setPage} />
              )}
            </div>
          </section>
        </div>

        <TrustStrip />
      </main>
    </div>
  );
}

function ProfileHero() {
  return (
    <section className="relative min-h-[240px] overflow-hidden bg-[#080604]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/branded/lassi-lounge/hero-spread.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/15" />
      <div className="relative mx-auto max-w-[1160px] px-4 md:px-6 py-12 md:py-14">
        <h1 className="font-serif text-[34px] md:text-[44px] font-black text-white leading-tight">My Orders</h1>
        <div className="mt-3 flex items-center gap-3 text-[13px] font-semibold">
          <span className="text-white">Home</span>
          <ChevronRight className="h-4 w-4 text-white/55" />
          <span className="text-white">My Account</span>
          <ChevronRight className="h-4 w-4 text-white/55" />
          <span className="text-[#e8a020]">My Orders</span>
        </div>
        <p className="mt-5 max-w-[350px] text-[15px] leading-relaxed text-white/88">
          Track, view and reorder your favorite meals from Lassi Lounge.
        </p>
      </div>
    </section>
  );
}

function AccountSidebar({ user, activeNav, onNavClick }) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-lg border border-[#eadfdb] bg-white shadow-sm">
        <div className="bg-gradient-to-br from-[#8d0309] to-[#680307] p-5 text-white flex items-center gap-4">
          <div className="h-[64px] w-[64px] rounded-full bg-white flex items-center justify-center text-[#8d0309] shrink-0">
            <User className="h-10 w-10" />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16px] font-black truncate">{user.name || 'Customer'}</h2>
            <p className="text-[12px] text-white/85 truncate">{user.email}</p>
            {user.phone && <p className="text-[12px] text-white/85 mt-1">{user.phone}</p>}
          </div>
        </div>

        <nav className="p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavClick(item.id)}
                className={`w-full flex items-center justify-between gap-3 rounded-md px-4 py-3 text-left text-[14px] font-bold ll-interactive ll-focus-ring ${
                  isActive ? 'bg-[#fff1cf] text-[#7a0b10] shadow-[inset_3px_0_0_#7a0b10]' : 'text-[#333333] hover:bg-[#fff8ed] hover:text-[#7a0b10]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-[#8d1118]" strokeWidth={1.8} />
                  {item.label}
                </span>
                {item.badge && (
                  <span className="rounded-full bg-[#8d0309] px-2 py-0.5 text-[10px] font-black text-white">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="relative overflow-hidden rounded-lg min-h-[300px] p-5 text-white shadow-md">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/branded/lassi-lounge/hero-spread.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#73050a]/95 via-[#4d0205]/75 to-black/25" />
        <div className="relative z-10">
          <h3 className="font-serif text-[22px] font-black leading-tight">
            Craving something <span className="text-[#e8a020]">delicious again?</span>
          </h3>
          <p className="mt-4 text-[13px] leading-relaxed text-white/90">Reorder your favorites in just a few clicks.</p>
          <button className="mt-5 rounded-md bg-[#e8a020] px-5 py-3 text-[12px] font-black uppercase tracking-wider text-[#1a1a1a] ll-interactive ll-focus-ring">
            Order Now
          </button>
        </div>
      </div>
    </aside>
  );
}

function OrdersHeader({ activeStatus, setActiveStatus, search, setSearch }) {
  return (
    <div className="border-b border-[#eadfdb] px-4 md:px-6 pt-5">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <h2 className="font-serif text-[25px] font-black text-[#7a0b10]">Order History</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-[300px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by order ID or item..."
              className="w-full h-10 rounded-md border border-[#eadfdb] bg-white pl-4 pr-11 text-[13px] font-medium text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#7a0b10] focus:outline-none focus:ring-4 focus:ring-[#7a0b10]/10"
            />
            <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8d1118]" />
          </div>
          <button className="h-10 rounded-md border border-[#b47b80] px-5 text-[13px] font-black text-[#7a0b10] flex items-center justify-center gap-2 ll-interactive ll-focus-ring">
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-8">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveStatus(tab.id)}
            className={`relative pb-3 text-[13px] font-black ll-focus-ring ${
              activeStatus === tab.id ? 'text-[#7a0b10]' : 'text-[#4b5563] hover:text-[#7a0b10]'
            }`}
          >
            {tab.label}
            {activeStatus === tab.id && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#7a0b10]" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function OrderHistoryCard({ order, onReorder, onViewDetails }) {
  const statusMeta = getStatusMeta(order.status);
  const StatusIcon = statusMeta.icon;
  const stamp = formatDate(order.createdAt);
  const displayItems = order.items?.slice(0, 3) || [];
  const canReorder = order.status !== 'cancelled';

  return (
    <article className="rounded-lg border border-[#eadfdb] bg-white p-4 shadow-[0_2px_10px_rgba(122,11,16,0.035)] grid grid-cols-1 xl:grid-cols-[110px_145px_1fr_120px] gap-4 items-center ll-interactive">
      <div className="xl:border-r xl:border-[#eadfdb] xl:pr-4">
        <p className="text-[11px] font-bold text-[#6b7280]">Order ID</p>
        <h3 className="mt-1 text-[18px] font-black text-[#7a0b10]">{formatOrderId(order)}</h3>
        <p className="mt-4 text-[12px] font-semibold text-[#4b5563]">{stamp.date}</p>
        <p className="text-[12px] font-semibold text-[#4b5563]">{stamp.time}</p>
      </div>

      <div className="xl:border-r xl:border-[#eadfdb] xl:pr-4">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-black ${statusMeta.className}`}>
          <StatusIcon className="h-4 w-4" /> {statusMeta.label}
        </span>
        <p className="mt-4 text-[11px] font-black text-[#1a1a1a]">{order.orderType === 'pickup' ? 'Pickup from' : 'Delivery to'}</p>
        <p className="mt-1 text-[11px] font-semibold leading-relaxed text-[#4b5563]">
          {order.orderType === 'pickup' ? order.restaurantAddress || 'Lassi Lounge' : order.address || 'Saved address'}
        </p>
        <p className="mt-3 text-[11px] font-black text-[#1a1a1a]">Total Amount</p>
        <p className="text-[18px] font-black text-[#7a0b10]">${Number(order.total || 0).toFixed(2)}</p>
      </div>

      <div>
        <h4 className="text-[13px] font-black text-[#1a1a1a] mb-4">{order.items?.length || 0} Items</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {displayItems.map((item, index) => (
            <div key={`${item.menuItemId || item.name}-${index}`} className="min-w-0">
              <img
                src={item.image || getDishImage(item.name)}
                alt={item.name}
                className="h-[66px] w-[66px] rounded-md object-cover border border-[#eadfdb] shadow-sm"
              />
              <p className="mt-2 text-[12px] font-black text-[#1a1a1a] truncate">{item.name}</p>
              <p className="text-[11px] font-semibold text-[#4b5563]">x {item.quantity || 1}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex xl:flex-col items-center xl:items-stretch justify-between gap-3">
        {canReorder && (
          <button
            onClick={onReorder}
            className="rounded-md border border-[#b47b80] px-4 py-3 text-[13px] font-black text-[#7a0b10] flex items-center justify-center gap-2 ll-interactive ll-focus-ring"
          >
            <ShoppingCart className="h-4 w-4" /> Reorder
          </button>
        )}
        <button
          onClick={onViewDetails}
          className="text-[13px] font-black text-[#7a0b10] flex items-center justify-center gap-2 hover:underline ll-focus-ring"
        >
          View Details <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function Pagination({ page, pageCount, setPage }) {
  return (
    <div className="flex justify-center items-center gap-2 pt-2">
      <button
        disabled={page === 1}
        onClick={() => setPage(1)}
        className="h-8 w-8 rounded-md border border-[#eadfdb] text-[12px] font-black text-[#6b7280] disabled:opacity-40 ll-focus-ring"
      >
        <ChevronLeft className="mx-auto h-3.5 w-3.5" />
      </button>
      {Array.from({ length: pageCount }).slice(0, 4).map((_, index) => {
        const value = index + 1;
        return (
          <button
            key={value}
            onClick={() => setPage(value)}
            className={`h-8 w-8 rounded-md border text-[12px] font-black ll-focus-ring ${
              page === value ? 'bg-[#7a0b10] border-[#7a0b10] text-white' : 'border-[#eadfdb] text-[#4b5563] hover:bg-[#fff8ed]'
            }`}
          >
            {value}
          </button>
        );
      })}
      <button
        disabled={page === pageCount}
        onClick={() => setPage(Math.min(pageCount, page + 1))}
        className="h-8 w-8 rounded-md border border-[#eadfdb] text-[12px] font-black text-[#6b7280] disabled:opacity-40 ll-focus-ring"
      >
        <ChevronRight className="mx-auto h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-[150px] rounded-lg border border-[#eadfdb] bg-[#fbfaf7] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyOrders({ activeStatus }) {
  return (
    <div className="rounded-lg border border-dashed border-[#eadfdb] bg-[#fbfaf7] py-16 text-center">
      <ReceiptText className="mx-auto h-10 w-10 text-[#b47b80]" strokeWidth={1.6} />
      <h3 className="mt-4 text-[18px] font-black text-[#1a1a1a]">No orders found</h3>
      <p className="mt-2 text-[13px] font-medium text-[#6b7280]">
        {activeStatus === 'all' ? 'Your Lassi Lounge order history will appear here.' : `No ${activeStatus} orders yet.`}
      </p>
    </div>
  );
}

function TrustStrip() {
  const items = [
    { icon: Truck, title: 'On-Time Delivery', desc: 'We ensure on-time delivery at your doorstep.' },
    { icon: UtensilsCrossed, title: 'Freshly Prepared', desc: 'Your food is prepared fresh after you place the order.' },
    { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure payment and data protection.' },
    { icon: RotateCcw, title: 'Easy Returns', desc: 'Not satisfied? Get quick refunds with no hassle.' },
  ];

  return (
    <section className="mt-8 rounded-md border border-[#f2e5dc] bg-[#fff8ed] overflow-hidden">
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
