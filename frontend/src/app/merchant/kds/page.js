'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChefHat, ChevronLeft, Check, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { orderAPI } from '@/lib/api';
import { Button, showToast, Skeleton } from '@/components/ui';

export default function KDSPage() {
  const router = useRouter();
  const { user, isMerchant, isAdmin, isAuthenticated } = useAuth();
  const { joinRoom, on, off } = useSocket();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!isMerchant && !isAdmin) { router.push('/customer'); return; }
    loadOrders();
    
    if (user?.restaurantId) {
      joinRoom(user.restaurantId);
      on('new_order', handleRealtimeUpdate);
      on('order_updated', handleRealtimeUpdate);
    }

    return () => {
      off('new_order', handleRealtimeUpdate);
      off('order_updated', handleRealtimeUpdate);
    };
  }, [isAuthenticated, isMerchant]);

  const handleRealtimeUpdate = () => {
    loadOrders();
  };

  const loadOrders = async () => {
    try {
      const restaurantId = user?.restaurantId;
      if (!restaurantId) return;

      const res = await orderAPI.getRestaurantOrders(restaurantId);
      // Filter for active kitchen orders: pending, accepted, preparing
      const activeOrders = (res.data || []).filter(o => ['pending', 'accepted', 'preparing'].includes(o.status));
      setOrders(activeOrders);
    } catch (err) {
      showToast('Failed to load KDS orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status);
      showToast(`Order marked as ${status.replace('_', ' ')}`, 'success');
      loadOrders(); // Or optimistic UI update
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const pending = orders.filter(o => o.status === 'pending' || o.status === 'accepted');
  const preparing = orders.filter(o => o.status === 'preparing');

  if (loading) return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;

  const renderOrderCard = (order, isPending) => (
    <div key={order._id} className="bg-brand-card/80 border border-brand-border rounded-xl p-4 flex flex-col gap-3 shadow-lg">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-black text-xl text-brand-text">{order.orderNumber}</h3>
          {order.orderType === 'dine_in' ? (
            <div className="inline-block px-3 py-1 mt-1 bg-brand-cyan/20 border border-brand-cyan text-brand-cyan rounded-lg font-black text-sm">
              TABLE {order.tableNumber}
            </div>
          ) : (
            <p className="text-sm font-bold text-brand-muted">{order.orderType.toUpperCase()}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm text-brand-muted flex items-center gap-1 justify-end">
            <Clock className="h-3 w-3" />
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="flex-1 bg-brand-bg/50 rounded-lg p-3 space-y-2">
        {order.items.map((item, idx) => (
          <div key={idx} className="text-sm">
            <span className="font-black text-brand-cyan">{item.quantity}x</span> <span className="font-bold text-brand-text">{item.name}</span>
            {item.selectedSize && <p className="text-xs text-brand-muted ml-5">Size: {item.selectedSize.name}</p>}
            {item.addOns?.length > 0 && <p className="text-xs text-brand-muted ml-5">Add: {item.addOns.map(a => a.name).join(', ')}</p>}
            {item.specialInstructions && (
              <p className="text-xs text-brand-yellow ml-5 flex items-start gap-1 mt-1">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" /> {item.specialInstructions}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Customer details block */}
      <div className="text-xs bg-white/5 p-3 rounded-lg border border-brand-border/30 space-y-1">
        <p className="font-bold text-brand-text/90 flex items-center gap-1.5">
          <span className="opacity-80">👤</span> {order.customerName || 'Walk-in'}
          {order.customerPhone && <span className="text-brand-muted font-normal ml-1">({order.customerPhone})</span>}
        </p>
        {order.orderType === 'delivery' && order.address && (
          <p className="text-brand-muted flex items-start gap-1.5 mt-1">
            <span className="opacity-80">📍</span>
            <span className="line-clamp-2">{order.address}</span>
          </p>
        )}
      </div>

      <div className="pt-2">
        {isPending ? (
          <Button className="w-full py-5 text-lg" onClick={() => updateStatus(order._id, 'preparing')}>
            Start Preparing
          </Button>
        ) : (
          <Button variant="success" className="w-full py-5 text-lg" onClick={() => updateStatus(order._id, 'ready')}>
            <Check className="h-5 w-5 mr-2" /> Mark Ready
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-bg p-4 flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => router.push('/merchant')}>
          <ChevronLeft className="h-5 w-5 mr-1" /> Dashboard
        </Button>
        <h1 className="text-2xl font-black text-brand-text flex items-center gap-3">
          <ChefHat className="h-7 w-7 text-brand-yellow" /> Kitchen Display System
        </h1>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
        {/* Pending Column */}
        <div className="flex flex-col bg-brand-card/30 rounded-2xl border border-brand-border/50 overflow-hidden">
          <div className="p-4 bg-brand-card border-b border-brand-border">
            <h2 className="text-lg font-black text-brand-text flex items-center justify-between">
              New Orders <span className="bg-brand-red text-white text-xs px-2 py-1 rounded-full">{pending.length}</span>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {pending.length === 0 ? (
              <p className="text-center text-brand-muted mt-10">No new orders</p>
            ) : (
              pending.map(o => renderOrderCard(o, true))
            )}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="flex flex-col bg-brand-card/30 rounded-2xl border border-brand-border/50 overflow-hidden">
          <div className="p-4 bg-brand-card border-b border-brand-border">
            <h2 className="text-lg font-black text-brand-text flex items-center justify-between">
              Preparing <span className="bg-brand-yellow text-brand-bg text-xs px-2 py-1 rounded-full">{preparing.length}</span>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {preparing.length === 0 ? (
              <p className="text-center text-brand-muted mt-10">No orders being prepared</p>
            ) : (
              preparing.map(o => renderOrderCard(o, false))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
