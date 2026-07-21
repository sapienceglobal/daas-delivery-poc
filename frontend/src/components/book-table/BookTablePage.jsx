'use client';

import { useState } from 'react';
import BookTableHero from './BookTableHero';
import ReservationForm from './ReservationForm';
import WhyDineWithUs from './WhyDineWithUs';
import MakeItSpecialPromo from './MakeItSpecialPromo';
import BookingTrustStrip from './BookingTrustStrip';
import PerfectSettingGrid from './PerfectSettingGrid';
import { reservationAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function BookTablePage({ restaurantId, initialUser }) {
  const handleReservationSubmit = async (data) => {
    try {
      // Attach restaurant ID
      const payload = {
        ...data,
        restaurantId
      };
      
      const res = await reservationAPI.create(payload);
      if (res.success) {
        showToast('Reservation created successfully!', 'success');
      } else {
        showToast(res.message || 'Failed to create reservation', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#1a1a1a]">
      {/* Hero Section */}
      <BookTableHero />

      {/* Main Content Layout */}
      <main className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 items-start">
          
          {/* Left Column: Form */}
          <div className="w-full">
            <ReservationForm onSubmit={handleReservationSubmit} />
          </div>

          {/* Right Column: Why Dine With Us & Promo */}
          <div className="w-full space-y-6 lg:sticky lg:top-24">
            <WhyDineWithUs />
            <MakeItSpecialPromo />
          </div>
          
        </div>
      </main>

      {/* Trust Strip */}
      <BookingTrustStrip />

      {/* Image Grid Bottom */}
      <PerfectSettingGrid />
    </div>
  );
}
