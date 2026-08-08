'use client';

import React, { useState, useEffect } from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import { orderAPI } from '@/lib/api';
import LiveOrdersView from '@/components/merchant/LiveOrdersView';
import { PageLoader, showToast } from '@/components/ui';
import { useSocket } from '@/context/SocketContext';

export default function MerchantLiveOrdersPage() {
  const { restaurant, roomId, globalLoading } = useMerchantContext();
  const { joinRoom, on, off } = useSocket();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);

  const loadData = async () => {
    try {

      const res = await orderAPI.getRestaurantOrders(roomId).catch(() => ({ data: [] }));
      setOrders(res.data || []);
    } catch (err) {
      console.error('Orders Load Error:', err);
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (globalLoading || !roomId) return;
    loadData();
  }, [roomId, globalLoading]);

  // Socket logic
  useEffect(() => {
    if (!roomId) return undefined;
    joinRoom(roomId);
    
    const handleRealtimeOrder = () => {
      showToast('Order update received!', 'success');
      loadData();
    };

    on('new_order', handleRealtimeOrder);
    on('order_updated', handleRealtimeOrder);

    return () => {
      off('new_order', handleRealtimeOrder);
      off('order_updated', handleRealtimeOrder);
    };
  }, [roomId, joinRoom, on, off]);

  const handleUpdateStatus = async (orderId, status) => {
    try { 
      await orderAPI.updateStatus(orderId, status); 
      showToast(`Status → ${status}`, 'success'); 
      loadData(); 
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  const handleAcceptOrder = async (orderId) => {
    try { await orderAPI.accept(orderId); showToast('Order accepted!', 'success'); loadData(); }
    catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  const handleRejectOrder = async (orderId) => {
    try { await orderAPI.reject(orderId, 'Rejected by restaurant'); showToast('Order rejected', 'info'); loadData(); }
    catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  if (globalLoading || loading) return <PageLoader text="Loading Live Orders..." />;

  return (
    <LiveOrdersView
      orders={orders}
      restaurant={restaurant}
      onUpdateStatus={handleUpdateStatus}
      onAccept={handleAcceptOrder}
      onReject={handleRejectOrder}
    />
  );
}
