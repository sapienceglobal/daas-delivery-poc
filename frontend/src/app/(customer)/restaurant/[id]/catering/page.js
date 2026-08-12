'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import CateringPage from '@/components/catering/CateringPage';
import { restaurantAPI } from '@/lib/api';

export default function CateringRoute() {
  const { id } = useParams();
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await restaurantAPI.getById(id);
        if (data.data && data.data._id) {
          setRestaurantId(data.data._id);
        }
      } catch (err) {
        console.error('Failed to fetch restaurant:', err);
      }
    };
    fetchRestaurant();
  }, [id]);

  if (!restaurantId) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  // Passing the restaurantId down to the CateringPage component
  return (
    <CateringPage restaurantId={restaurantId} />
  );
}
