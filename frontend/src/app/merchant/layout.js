'use client';

import React from 'react';
import MerchantSidebar from '@/components/merchant/Sidebar';
import DashboardHeader from '@/components/merchant/DashboardHeader';
import { MerchantProvider, useMerchantContext } from '@/context/MerchantContext';
import { EmptyState } from '@/components/ui';
import { Store } from 'lucide-react';

function MerchantLayoutContent({ children }) {
  const { user, restaurant } = useMerchantContext(); // Access context within provider

  if (!user?.restaurantId) {
    return <EmptyState icon={Store} title="No Restaurant Linked" description="Create a restaurant to get started" />;
  }

  return (
    <div className="flex h-screen bg-[#070707] overflow-hidden text-brand-text font-sans">
      <MerchantSidebar />
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC] custom-scrollbar relative">
        <DashboardHeader user={user} />
        <div className="max-w-7xl mx-auto space-y-8 p-6 relative z-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function MerchantLayout({ children }) {
  return (
    <MerchantProvider>
      <MerchantLayoutContent>
        {children}
      </MerchantLayoutContent>
    </MerchantProvider>
  );
}
