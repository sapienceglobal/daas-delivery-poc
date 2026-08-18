'use client';

/**
 * /events — Clean SEO URL for Lassi Lounge events page.
 * lassiloungeny.com/events
 */

import { useState, useEffect } from 'react';
import EventsPage from '@/components/events/EventsPage';
import { restaurantAPI } from '@/lib/api';

const BRANDED_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge';

export default function EventsRoute() {
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    restaurantAPI.getById(BRANDED_ID)
      .then(res => { if (res.data?._id) setRestaurantId(res.data._id); })
      .catch(err => console.error('Failed to load restaurant:', err));
  }, []);

  if (!restaurantId) return <div className="min-h-screen bg-white flex items-center justify-center text-[#6b7280]">Loading...</div>;

  return (
    <main className="min-h-screen bg-white">
      <EventsPage restaurantId={restaurantId} />
    </main>
  );
}
