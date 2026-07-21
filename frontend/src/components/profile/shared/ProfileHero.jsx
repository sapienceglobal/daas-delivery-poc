'use client';

import { ChevronRight } from 'lucide-react';

export default function ProfileHero({ activeNav }) {
  const titles = {
    orders: 'My Orders',
    dashboard: 'Dashboard',
    profile: 'My Profile',
    addresses: 'My Addresses',
    favorites: 'My Favorites',
    payments: 'Payment Methods',
    loyalty: 'Loyalty Points',
    notifications: 'Notifications',
    refer: 'Refer & Earn',
  };

  const currentTitle = titles[activeNav] || 'My Account';

  return (
    <section className="relative min-h-[220px] overflow-hidden bg-[#080604]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/branded/lassi-lounge/hero-spread.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/30" />
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-8 lg:px-12 py-12 md:py-16 lg:py-20">
        <h1 className="font-serif text-[38px] md:text-[48px] lg:text-[56px] font-black text-white leading-tight drop-shadow-md">
          {currentTitle}
        </h1>
        <div className="mt-4 flex items-center gap-2.5 text-[14px] font-bold tracking-wide">
          <span className="text-white hover:text-[#e8a020] transition-colors cursor-pointer">Home</span>
          <ChevronRight className="h-4 w-4 text-white/60" />
          <span className="text-white hover:text-[#e8a020] transition-colors cursor-pointer">My Account</span>
          <ChevronRight className="h-4 w-4 text-white/60" />
          <span className="text-[#e8a020] font-black drop-shadow-sm">{currentTitle}</span>
        </div>
        <p className="mt-5 max-w-[480px] text-[15px] md:text-[16px] leading-relaxed text-white drop-shadow-sm font-medium">
          Track, view and reorder your favorite meals from Lassi Lounge.
        </p>
      </div>
    </section>
  );
}