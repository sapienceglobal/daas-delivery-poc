'use client';

import React, { useState, useEffect, useRef } from 'react';
import MerchantSidebar from '@/components/merchant/Sidebar';
import DashboardHeader from '@/components/merchant/DashboardHeader';
import PageHeaderGradient from '@/components/merchant/common/PageHeaderGradient';
import { MerchantProvider, useMerchantContext } from '@/context/MerchantContext';
import { useTheme } from '@/context/ThemeContext';
import { EmptyState } from '@/components/ui';
import { Store } from 'lucide-react';
import { usePathname } from 'next/navigation';

function MerchantLayoutContent({ children }) {
  const { user } = useMerchantContext();
  const { isDark } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const mainRef = useRef(null);

  // Auto-collapse sidebar on tablets/mobile on load
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarCollapsed(true);
    }
  }, []);

  // Smooth scroll to top on route navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [pathname]);

  if (!user?.restaurantId) {
    return <EmptyState icon={Store} title="No Restaurant Linked" description="Create a restaurant to get started" />;
  }

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-admin-bg text-admin-text font-sans select-text ${isDark ? '[color-scheme:dark]' : '[color-scheme:light]'}`}>
      {/* Sidebar with collapse toggle */}
      <MerchantSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden transition-all duration-200 relative">
        <DashboardHeader
          user={user}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main
          ref={mainRef}
          id="main-scroll-container"
          className="flex-1 overflow-y-auto custom-scrollbar relative bg-admin-bg"
        >
          {/* Signature ambient atmospheric gradient matching Salon Management */}
          <PageHeaderGradient height="h-[360px]" />

          <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6 relative z-10 min-h-full">
            {children}
          </div>
        </main>
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
