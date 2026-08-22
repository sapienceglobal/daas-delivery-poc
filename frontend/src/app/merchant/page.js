'use client';

import React, { useState, useEffect } from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import { orderAPI, reservationAPI, cateringAPI, analyticsAPI, menuAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import DashboardView from '@/components/merchant/DashboardView';
import { PageLoader, showToast } from '@/components/ui';

export default function MerchantOverview() {
  const router = useRouter();
  const { user, restaurant, roomId, globalLoading } = useMerchantContext();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(30);
  
  // data for the dashboard view
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [cateringInquiries, setCateringInquiries] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [menu, setMenu] = useState([]);
  const [stats, setLocalStats] = useState({ todayOrders: 0, todayRevenue: 0, activeOrders: 0 });

  useEffect(() => {
    if (globalLoading || !roomId) return;
    
    const loadData = async () => {
      try {
        // setLoading(true);
        const [
          menuData, ordersData,
          reservationsData, cateringData, analyticsResp
        ] = await Promise.all([
          menuAPI.getByRestaurant(roomId).catch(() => ({ data: [] })),
          orderAPI.getRestaurantOrders(roomId).catch(() => ({ data: [] })),
          reservationAPI.getRestaurantReservations ? reservationAPI.getRestaurantReservations(roomId).catch(() => ({ data: [] })) : { data: [] },
          cateringAPI.getRestaurantInquiries ? cateringAPI.getRestaurantInquiries(roomId).catch(() => ({ data: [] })) : { data: [] },
          analyticsAPI.getSalesAnalytics ? analyticsAPI.getSalesAnalytics(roomId, timeframe).catch(() => ({ data: null })) : { data: null },
        ]);

        const fetchedOrders = ordersData.data || [];
        setMenu(menuData.data || []);
        setOrders(fetchedOrders);
        setReservations(reservationsData?.data || []);
        setCateringInquiries(cateringData?.data || []);
        setAnalyticsData(analyticsResp?.data || null);

        const today = new Date(); today.setHours(0, 0, 0, 0);
        const todayOrders = fetchedOrders.filter(o => new Date(o.createdAt) >= today);
        const activeOrdersList = fetchedOrders.filter(o => ['pending', 'accepted', 'preparing', 'ready'].includes(o.status));

        setLocalStats({
          todayOrders: todayOrders.length,
          todayRevenue: todayOrders.reduce((s, o) => s + (o.total || 0), 0),
          activeOrders: activeOrdersList.length,
        });

      } catch (err) {
        console.error('Dashboard Load Error:', err);
        showToast('Failed to load dashboard data', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [roomId, globalLoading, restaurant, timeframe]);

  if (globalLoading || loading || !restaurant) return <PageLoader text="Loading Dashboard..." />;

  return (
    <DashboardView
      stats={stats}
      orders={orders}
      reservations={reservations}
      cateringInquiries={cateringInquiries}
      restaurant={restaurant}
      user={user}
      analyticsData={analyticsData}
      menu={menu}
      timeframe={timeframe}
      onTimeframeChange={setTimeframe}
      onViewAll={(route) => router.push(`/merchant/${route}`)}
    />
  );
}
