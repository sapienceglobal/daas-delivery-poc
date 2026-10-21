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
  const [activePreset, setActivePreset] = useState('all'); // 'all', 'today', 'yesterday', '7d', '30d', 'this_month', 'custom'
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  const toLocalDateString = (d) => {
    if (!d) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadData = async (presetOverride = activePreset, customRange = dateRange) => {
    try {
      setLoading(true);
      let daysParam = null;
      let startStr = null;
      let endStr = null;

      const [sDate, eDate] = customRange;

      if (presetOverride === 'today') {
        daysParam = 1;
      } else if (presetOverride === 'yesterday') {
        daysParam = 'yesterday';
      } else if (presetOverride === '7d') {
        daysParam = 7;
      } else if (presetOverride === '30d') {
        daysParam = 30;
      } else if (presetOverride === 'this_month') {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        startStr = toLocalDateString(firstDay);
        endStr = toLocalDateString(now);
      } else if (presetOverride === 'custom') {
        if (sDate && eDate) {
          startStr = toLocalDateString(sDate);
          endStr = toLocalDateString(eDate);
        } else if (sDate) {
          startStr = toLocalDateString(sDate);
          endStr = toLocalDateString(sDate);
        }
      } else {
        // 'all' / lifetime
        daysParam = null;
      }

      const res = await analyticsAPI.getSalesAnalytics(roomId, daysParam, startStr, endStr).catch(() => ({ data: null }));
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
    loadData(activePreset, dateRange);
  }, [roomId, globalLoading, activePreset, dateRange]);

  const handleSelectPreset = (presetKey) => {
    setActivePreset(presetKey);
    if (presetKey !== 'custom') {
      setDateRange([null, null]);
    }
  };

  const handleCustomDateChange = (update) => {
    setDateRange(update);
    if (update && update[0]) {
      setActivePreset('custom');
    } else {
      setActivePreset('all');
    }
  };

  if (globalLoading || loading) return <PageLoader text="Loading Analytics..." />;

  return (
    <ReportsAnalyticsView
      analyticsData={analyticsData}
      restaurant={restaurant}
      startDate={startDate}
      endDate={endDate}
      activePreset={activePreset}
      onSelectPreset={handleSelectPreset}
      onDateRangeChange={handleCustomDateChange}
    />
  );
}

