'use client';

import React, { useState, useEffect } from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import { useSocket } from '@/context/SocketContext';
import { orderAPI, reservationAPI, cateringAPI, analyticsAPI, menuAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import DashboardView from '@/components/merchant/DashboardView';
import { PageLoader, showToast } from '@/components/ui';

export default function MerchantOverview() {
  const router = useRouter();
  const { user, restaurant, roomId, globalLoading } = useMerchantContext();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(1);
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  
  // data for the dashboard view
  const [orders, setOrders] = useState([]);
  const [serverStats, setServerStats] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [cateringInquiries, setCateringInquiries] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [menu, setMenu] = useState([]);
  const [stats, setLocalStats] = useState({ todayOrders: 0, todayRevenue: 0, activeOrders: 0 });

  const { on, off } = useSocket();

  const isLiveOrder = (o) => {
    if (!o) return false;
    const s = (o.status || '').toLowerCase().trim();
    if (['completed', 'delivered', 'cancelled', 'refunded', 'failed', 'rejected'].includes(s)) return false;
    if (s === 'picked_up') {
      const type = (o.orderType || o.type || '').toLowerCase();
      return type === 'delivery';
    }
    return ['new', 'pending', 'accepted', 'driver_assigned', 'preparing', 'ready', 'out_for_delivery'].includes(s);
  };

  const fetchDashboardData = async (silent = false) => {
    if (globalLoading || !roomId) return;
    try {
      if (!silent) setLoading(true);
      const [
        menuData, ordersData,
        reservationsData, cateringData, analyticsResp
      ] = await Promise.all([
        menuAPI.getByRestaurant(roomId).catch(() => ({ data: [] })),
        orderAPI.getRestaurantOrders(roomId, 'limit=100').catch(() => ({ data: [] })),
        reservationAPI.getRestaurantReservations ? reservationAPI.getRestaurantReservations(roomId).catch(() => ({ data: [] })) : { data: [] },
        cateringAPI.getRestaurantInquiries ? cateringAPI.getRestaurantInquiries(roomId).catch(() => ({ data: [] })) : { data: [] },
        analyticsAPI.getSalesAnalytics 
          ? analyticsAPI.getSalesAnalytics(
              roomId, 
              timeframe === 'custom' ? null : timeframe, 
              timeframe === 'custom' && customStartDate ? customStartDate.toISOString().split('T')[0] : null, 
              timeframe === 'custom' && (customEndDate || customStartDate) ? (customEndDate || customStartDate).toISOString().split('T')[0] : null
            ).catch(() => ({ data: null })) 
          : { data: null },
      ]);

      const fetchedOrders = ordersData.data || [];
      if (ordersData.stats) setServerStats(ordersData.stats);
      setMenu(menuData.data || []);
      setOrders(fetchedOrders);
      setReservations(reservationsData?.data || []);
      setCateringInquiries(cateringData?.data || []);
      setAnalyticsData(analyticsResp?.data || null);

      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todayOrders = fetchedOrders.filter(o => new Date(o.createdAt) >= today);
      const activeOrdersList = fetchedOrders.filter(isLiveOrder);

      setLocalStats({
        todayOrders: todayOrders.length,
        todayRevenue: todayOrders.reduce((s, o) => s + (o.total || 0), 0),
        activeOrders: ordersData.stats?.active !== undefined ? ordersData.stats.active : activeOrdersList.length,
      });

    } catch (err) {
      console.error('Dashboard Load Error:', err);
      if (!silent) showToast('Failed to load dashboard data', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);
  }, [roomId, globalLoading, restaurant, timeframe, customStartDate, customEndDate]);

  useEffect(() => {
    const handleSilentRefresh = () => {
      fetchDashboardData(true);
    };

    on('new_order', handleSilentRefresh);
    on('order_updated', handleSilentRefresh);
    on('order_status_changed', handleSilentRefresh);
    on('order_cancelled', handleSilentRefresh);
    on('order:dispatch-updated', handleSilentRefresh);

    return () => {
      off('new_order', handleSilentRefresh);
      off('order_updated', handleSilentRefresh);
      off('order_status_changed', handleSilentRefresh);
      off('order_cancelled', handleSilentRefresh);
      off('order:dispatch-updated', handleSilentRefresh);
    };
  }, [on, off, roomId, globalLoading, restaurant, timeframe, customStartDate, customEndDate]);

  if (globalLoading || loading || !restaurant) return <PageLoader text="Loading Dashboard..." />;

  return (
    <DashboardView
      stats={stats}
      serverStats={serverStats}
      orders={orders}
      reservations={reservations}
      cateringInquiries={cateringInquiries}
      restaurant={restaurant}
      user={user}
      analyticsData={analyticsData}
      menu={menu}
      timeframe={timeframe}
      onTimeframeChange={setTimeframe}
      customStartDate={customStartDate}
      customEndDate={customEndDate}
      setCustomStartDate={setCustomStartDate}
      setCustomEndDate={setCustomEndDate}
      onViewAll={(route) => router.push(`/merchant/${route}`)}
    />
  );
}
