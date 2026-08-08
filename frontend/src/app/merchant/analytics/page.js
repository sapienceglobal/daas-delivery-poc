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

  const loadData = async () => {
    try {
      setLoading(true);
      if (!analyticsAPI.getSalesAnalytics) {
        setLoading(false);
        return;
      }
      const res = await analyticsAPI.getSalesAnalytics(roomId, 30).catch(() => ({ data: null }));
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
    loadData();
  }, [roomId, globalLoading]);

  if (globalLoading || loading) return <PageLoader text="Loading Analytics..." />;

  return (
    <ReportsAnalyticsView
      analyticsData={analyticsData}
      restaurant={restaurant}
    />
  );
}

