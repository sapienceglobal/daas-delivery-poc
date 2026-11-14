'use client';

import React, { useState, useEffect } from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import { useSocket } from '@/context/SocketContext';
import { orderAPI } from '@/lib/api';
import AllOrdersView from '@/components/merchant/AllOrdersView';
import OrderDetailsView from '@/components/merchant/OrderDetailsView';
import { PageLoader, showToast } from '@/components/ui';

export default function MerchantAllOrdersPage() {
  const { restaurant, roomId, globalLoading } = useMerchantContext();
  const { joinRoom, on, off } = useSocket();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await orderAPI.getRestaurantOrders(roomId, 'limit=100').catch(() => ({ data: [] }));
      const loadedOrders = res.data || [];
      setOrders(loadedOrders);
      if (res.stats) setStats(res.stats);
      if (res.pagination) setPagination(res.pagination);

      if (!silent && typeof window !== 'undefined') {
        const targetOrderId = new URLSearchParams(window.location.search).get('orderId');
        if (targetOrderId) {
          const matched = loadedOrders.find(o => String(o._id) === String(targetOrderId));
          if (matched) {
            setSelectedOrder(matched);
          } else {
            try {
              const singleRes = await orderAPI.getById(targetOrderId);
              if (singleRes?.data) setSelectedOrder(singleRes.data);
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      console.error('Orders Load Error:', err);
      if (!silent) showToast('Failed to load orders', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (globalLoading || !roomId) return;
    loadData();
  }, [roomId, globalLoading]);

  // Real-time socket sync for new orders, status changes, and cancellations
  useEffect(() => {
    if (!roomId) return undefined;
    joinRoom(roomId);

    const handleRealtimeUpdate = () => {
      loadData(true);
    };

    on('new_order', handleRealtimeUpdate);
    on('order_updated', handleRealtimeUpdate);
    on('order_status_changed', handleRealtimeUpdate);
    on('order_cancelled', handleRealtimeUpdate);
    on('order:dispatch-updated', handleRealtimeUpdate);

    return () => {
      off('new_order', handleRealtimeUpdate);
      off('order_updated', handleRealtimeUpdate);
      off('order_status_changed', handleRealtimeUpdate);
      off('order_cancelled', handleRealtimeUpdate);
      off('order:dispatch-updated', handleRealtimeUpdate);
    };
  }, [roomId, joinRoom, on, off]);

  const handleUpdateStatus = async (orderId, status) => {
    try { 
      if (status === 'accepted') {
        try {
          await orderAPI.accept(orderId);
        } catch (e) {
          await orderAPI.updateStatus(orderId, status);
        }
      } else {
        await orderAPI.updateStatus(orderId, status); 
      }
      showToast(`Status → ${status}`, 'success'); 
      loadData(true); 
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  if (globalLoading || loading) return <PageLoader text="Loading Orders..." />;

  if (selectedOrder) {
    return (
      <OrderDetailsView 
        order={selectedOrder}
        onBack={() => {
          setSelectedOrder(null);
          if (typeof window !== 'undefined' && window.location.search.includes('orderId=')) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }}
        onUpdateStatus={handleUpdateStatus}
        onRefresh={() => loadData(true)}
        onViewOriginal={(parentId) => {
          const original = orders.find(o => o._id === parentId);
          if (original) setSelectedOrder(original);
          else showToast('Original order not found in current view', 'error');
        }}
      />
    );
  }

  return (
    <AllOrdersView
      orders={orders}
      stats={stats}
      pagination={pagination}
      restaurant={restaurant}
      onUpdateStatus={handleUpdateStatus}
      onRowClick={(orderId) => setSelectedOrder(orders.find(o => o._id === orderId))}
    />
  );
}
