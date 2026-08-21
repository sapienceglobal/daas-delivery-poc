'use client';

import React, { useState, useEffect } from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import { analyticsAPI } from '@/lib/api';
import ReportsAnalyticsView from '@/components/merchant/ReportsAnalyticsView';
import { PageLoader, showToast } from '@/components/ui';

export default function MerchantAnalyticsPage() {
  const { roomId, globalLoading, restaurant } = useMerchantContext();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const loadData = async () => {
    try {
      setLoading(true);
      const startStr = startDate ? startDate.toISOString().split('T')[0] : null;
      const endStr = endDate ? endDate.toISOString().split('T')[0] : null;
      
      const res = await analyticsAPI.getSalesAnalytics(roomId, null, startStr, endStr).catch(() => ({ data: null }));
      setAnalyticsData(res.data || null);
    } catch (err) {
      console.error('Analytics Load Error:', err);
      showToast('Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (globalLoading || !roomId) return;
    if (dateRange[0] && !dateRange[1]) return; // Wait for full range
    loadData();
  }, [roomId, globalLoading, dateRange]);

  if (globalLoading || loading) return <PageLoader text="Loading Analytics..." />;

  return (
    <ReportsAnalyticsView
      analyticsData={analyticsData}
      restaurant={restaurant}
      startDate={startDate}
      endDate={endDate}
      onDateRangeChange={(update) => setDateRange(update)}
    />
  );
}

