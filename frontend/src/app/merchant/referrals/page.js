'use client';

import React from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import ReferralManagementView from '@/components/merchant/ReferralManagementView';
import { PageLoader } from '@/components/ui';

export default function MerchantReferralsPage() {
  const { restaurant, globalLoading } = useMerchantContext();

  if (globalLoading) return <PageLoader text="Loading Referral Program..." />;

  return <ReferralManagementView restaurant={restaurant} />;
}
