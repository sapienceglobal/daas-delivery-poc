'use client';

import React from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import MarketingView from '@/components/merchant/MarketingView';
import { PageLoader } from '@/components/ui';

export default function MerchantMarketingPage() {
  const { restaurant, roomId, globalLoading } = useMerchantContext();

  if (globalLoading || !restaurant) {
    return <PageLoader />;
  }

  return <MarketingView restaurantId={roomId} />;
}
