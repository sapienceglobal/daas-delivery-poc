'use client';

import React, { useState, useEffect } from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import { orderAPI } from '@/lib/api';
import AllOrdersView from '@/components/merchant/AllOrdersView';
import OrderDetailsView from '@/components/merchant/OrderDetailsView';
import { PageLoader, showToast } from '@/components/ui';

export default function MerchantAllOrdersPage() {
  const { restaurant, roomId, globalLoading } = useMerchantContext();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const handleUpdateStatus = async (orderId, status) => {
    try { 
      await orderAPI.updateStatus(orderId, status); 
      showToast(`Status → ${status}`, 'success'); 
      loadData(); 
    } catch (err) { showToast(err.message || 'Failed', 'error'); }
  };

  if (globalLoading || loading) return <PageLoader text="Loading Orders..." />;

  if (selectedOrder) {
    return (
      <OrderDetailsView 
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        onRefresh={loadData}
      />
    );
  }

  return (
    <AllOrdersView
      orders={orders}
      restaurant={restaurant}
      onUpdateStatus={handleUpdateStatus}
      onRowClick={(orderId) => setSelectedOrder(orders.find(o => o._id === orderId))}
    />
  );
}
