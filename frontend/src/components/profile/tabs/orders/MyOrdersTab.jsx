'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { showToast } from '@/components/ui';
import { isOngoingStatus, formatOrderId, getDishImage } from '../../profileUtils';

import OrdersHeader from './OrdersHeader';
import OrderHistoryCard from './OrderHistoryCard';
import FilterModal from './FilterModal';
import { ReceiptText, ChevronLeft, ChevronRight } from 'lucide-react';

export default function MyOrdersTab() {
  const router = useRouter();
  const { addItem, clearCart } = useCart();

  const [activeStatus, setActiveStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    let isCancelled = false;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await orderAPI.getMyOrders();
        if (!isCancelled) setOrders(res?.data || []);
      } catch (err) {
        if (!isCancelled) showToast(err.message || 'Failed to load order history', 'error');
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };
    fetchOrders();
    return () => { isCancelled = true; };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus =
        activeStatus === 'all' ||
        (activeStatus === 'ongoing' && isOngoingStatus(order.status)) ||
        order.status === activeStatus;

      const matchesType = filterType === 'all' || order.orderType === filterType;

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

  useEffect(() => { setPage(1); }, [activeStatus, search, filterType]);

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
    showToast('Items added back to your cart!', 'success');
    router.push('/customer/checkout');
  };

  return (
    <section className="rounded-2xl border border-[#e8dcd8] bg-white shadow-sm overflow-hidden flex flex-col h-full">
      <OrdersHeader
        activeStatus={activeStatus}
        setActiveStatus={setActiveStatus}
        search={search}
        setSearch={setSearch}
        onOpenFilter={() => setFilterModalOpen(true)}
        filterType={filterType}
      />

      <div className="p-4 md:p-6 space-y-4 bg-white">
        {loading ? (
          <div key="loading" className="space-y-5 animate-fadeIn">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[210px] rounded-2xl border border-[#e8dcd8] bg-white animate-pulse" />
            ))}
          </div>
        ) : pageOrders.length === 0 ? (
          <div key="empty" className="rounded-2xl border border-dashed border-[#eadfdb] bg-white py-24 text-center flex flex-col items-center justify-center animate-fadeIn">
            <div className="h-20 w-20 rounded-full bg-[#fbfaf7] flex items-center justify-center border border-[#f0e6e2] mb-5">
              <ReceiptText className="h-10 w-10 text-[#b47b80]" strokeWidth={1.5} />
            </div>
            <h3 className="text-[22px] font-black text-[#1a1a1a]">No orders found</h3>
            <p className="mt-2.5 text-[14px] font-medium text-[#6b7280] max-w-sm mx-auto leading-relaxed">
              {search 
                ? `No orders matching "${search}"` 
                : activeStatus === 'all' 
                ? 'Your Lassi Lounge order history will appear here after you place an order.' 
                : `No ${activeStatus} orders found in your history.`}
            </p>
          </div>
        ) : (
          <div key={`${page}-${activeStatus}-${filterType}-${search}`} className="space-y-5 animate-fadeIn">
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

        {/* Pagination Inline */}
        {!loading && pageOrders.length > 0 && (
          <div className="flex justify-center items-center gap-2 pt-8 pb-4">
            <button disabled={page === 1} onClick={() => setPage(1)} className="h-9 w-9 rounded-lg border border-[#e8dcd8] bg-white text-[14px] font-black text-[#6b7280] disabled:opacity-40 hover:border-[#b47b80] hover:text-[#7a0b10] flex items-center justify-center transition-all">«</button>
            <button disabled={page === 1} onClick={() => setPage(Math.max(1, page - 1))} className="h-9 w-9 rounded-lg border border-[#e8dcd8] bg-white text-[14px] font-black text-[#6b7280] disabled:opacity-40 hover:border-[#b47b80] hover:text-[#7a0b10] flex items-center justify-center transition-all"><ChevronLeft className="h-4 w-4" /></button>
            {Array.from({ length: pageCount }).slice(0, 5).map((_, index) => {
              const value = index + 1;
              return (
                <button key={value} onClick={() => setPage(value)} className={`h-9 w-9 rounded-lg border text-[14px] font-black transition-all ${page === value ? 'bg-[#7a0b10] border-[#7a0b10] text-white shadow-sm' : 'border-[#e8dcd8] bg-white text-[#4b5563] hover:border-[#b47b80] hover:text-[#7a0b10]'}`}>
                  {value}
                </button>
              );
            })}
            <button disabled={page === pageCount} onClick={() => setPage(Math.min(pageCount, page + 1))} className="h-9 w-9 rounded-lg border border-[#e8dcd8] bg-white text-[14px] font-black text-[#6b7280] disabled:opacity-40 hover:border-[#b47b80] hover:text-[#7a0b10] flex items-center justify-center transition-all"><ChevronRight className="h-4 w-4" /></button>
            <button disabled={page === pageCount} onClick={() => setPage(pageCount)} className="h-9 w-9 rounded-lg border border-[#e8dcd8] bg-white text-[14px] font-black text-[#6b7280] disabled:opacity-40 hover:border-[#b47b80] hover:text-[#7a0b10] flex items-center justify-center transition-all">»</button>
          </div>
        )}
      </div>

      {filterModalOpen && <FilterModal filterType={filterType} setFilterType={setFilterType} onClose={() => setFilterModalOpen(false)} />}
    </section>
  );
}