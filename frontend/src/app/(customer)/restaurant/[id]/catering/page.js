'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CateringPage from '@/components/catering/CateringPage';
import { restaurantAPI } from '@/lib/api';

const SINGLE_MODE = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

function Redirect({ to }) {
  const router = useRouter();
  useEffect(() => { router.replace(to); }, []);
  return null;
}

export default function CateringRoute() {
  const { id } = useParams();
  const [restaurantId, setRestaurantId] = useState(null);

  // Clean URL: /catering (no restaurant slug needed in single mode)
  if (SINGLE_MODE) return <Redirect to="/catering" />;

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await restaurantAPI.getById(id);
        if (data.data && data.data._id) setRestaurantId(data.data._id);
      } catch (err) {
        console.error('Failed to fetch restaurant:', err);
      }
    };
    fetchRestaurant();
  }, [id]);

  if (!restaurantId) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;

  return <CateringPage restaurantId={restaurantId} />;
}
