'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import EventsPage from '@/components/events/EventsPage';
import { restaurantAPI } from '@/lib/api';

const SINGLE_MODE = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

function Redirect({ to }) {
  const router = useRouter();
  useEffect(() => { router.replace(to); }, []);
  return null;
}

export default function RestaurantEventsRoute() {
  const { id } = useParams();
  const [restaurantId, setRestaurantId] = useState(null);

  // clean URL: /events (no restaurant slug needed in single mode)
  if (SINGLE_MODE) return <Redirect to="/events" />;

  useEffect(() => {
    restaurantAPI.getById(id)
      .then(data => { if (data.data?._id) setRestaurantId(data.data._id); })
      .catch(err => console.error('Failed to fetch restaurant:', err));
  }, [id]);

  if (!restaurantId) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;

  return (
    <main className="min-h-screen bg-white">
      <EventsPage restaurantId={restaurantId} />
    </main>
  );
}
