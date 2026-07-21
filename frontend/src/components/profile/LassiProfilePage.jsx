'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfileHero from './shared/ProfileHero';
import AccountSidebar from './shared/AccountSidebar';
import TrustStrip from './shared/TrustStrip';
import MyOrdersTab from './tabs/orders/MyOrdersTab';
import DashboardTab from './tabs/DashboardTab';
import MyProfileTab from './tabs/MyProfileTab';
import AddressesTab from './tabs/AddressesTab';
import FavoritesTab from './tabs/FavoritesTab';
import PaymentsTab from './tabs/PaymentsTab';
import LoyaltyTab from './tabs/LoyaltyTab';
import NotificationsTab from './tabs/NotificationsTab';
import ReferTab from './tabs/ReferTab';
import MyReservationsTab from './tabs/MyReservationsTab';

export default function LassiProfilePage({ user, logout, updateUser }) {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('orders');

  const handleNavClick = async (id) => {
    if (id === 'logout') {
      if (logout) await logout();
      router.push('/login');
      return;
    }
    setActiveNav(id);
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#1a1a1a]">
      {/* Hero Section */}
      <ProfileHero activeNav={activeNav} />

      {/* Yaha maine max-w-[1160px] ko hata kar max-w-[1440px] kar diya hai 
          taaki left-right ka space kam ho jaye */}
      <main className="mx-auto max-w-[1440px] px-4 md:px-8 lg:px-12 py-8">
        
        {/* Grid layout jisme left me sidebar (280px) aur right me baaki jagah (1fr) hai */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          
          {/* Left Sidebar */}
          <AccountSidebar
            user={user}
            activeNav={activeNav}
            onNavClick={handleNavClick}
            onOrderNow={() => router.push('/customer/restaurant/lassi-lounge')}
          />

          {/* Right Side Content with Smooth Fade-In Transition */}
          <div key={activeNav} className="min-w-0 min-h-[600px] animate-fadeIn">
            {/* Conditional Rendering for Tabs */}
            {activeNav === 'dashboard' && <DashboardTab user={user} onNavigate={handleNavClick} />}
            {activeNav === 'profile' && <MyProfileTab user={user} updateUser={updateUser} />}
            {activeNav === 'addresses' && <AddressesTab user={user} updateUser={updateUser} />}
            {activeNav === 'orders' && <MyOrdersTab />}
            {activeNav === 'reservations' && <MyReservationsTab />}
            {activeNav === 'favorites' && <FavoritesTab user={user} updateUser={updateUser} />}
            {activeNav === 'payments' && <PaymentsTab user={user} updateUser={updateUser} />}
            {activeNav === 'loyalty' && <LoyaltyTab user={user} />}
            {activeNav === 'notifications' && <NotificationsTab user={user} updateUser={updateUser} />}
            {activeNav === 'refer' && <ReferTab user={user} />}
          </div>
        </div>

        {/* Bottom Trust Strip */}
        <div className="mt-10">
          <TrustStrip />
        </div>
      </main>
    </div>
  );
}