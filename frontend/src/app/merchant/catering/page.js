'use client';

import React, { useState, useEffect } from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import { cateringAPI } from '@/lib/api';
import CateringEnquiriesView from '@/components/merchant/CateringEnquiriesView';
import { PageLoader, showToast } from '@/components/ui';

export default function MerchantCateringPage() {
  const { roomId, globalLoading } = useMerchantContext();
  const [loading, setLoading] = useState(true);
  const [cateringInquiries, setCateringInquiries] = useState([]);

  const loadData = async () => {
    try {

      if (!cateringAPI.getRestaurantInquiries) {
        setLoading(false);
        return;
      }
      const res = await cateringAPI.getRestaurantInquiries(roomId).catch(() => ({ data: [] }));
      setCateringInquiries(res.data || []);
    } catch (err) {
      console.error('Catering Load Error:', err);
      showToast('Failed to load catering inquiries', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (globalLoading || !roomId) return;
    loadData();
  }, [roomId, globalLoading]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await cateringAPI.updateStatus(id, status);
      showToast(`Status updated to ${status}`, 'success');
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  if (globalLoading || loading) return <PageLoader text="Loading Catering Enquiries..." />;

  return (
    <CateringEnquiriesView
      inquiries={cateringInquiries}
      onUpdateStatus={handleUpdateStatus}
    />
  );
}
