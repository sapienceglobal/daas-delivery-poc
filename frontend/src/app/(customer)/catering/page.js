'use client';

/**
 * /catering — Clean SEO URL for Lassi Lounge catering inquiries.
 * lassiloungeny.com/catering
 */

import { useState, useEffect } from 'react';
import CateringPage from '@/components/catering/CateringPage';
import { restaurantAPI } from '@/lib/api';
import Loading from '@/app/loading';

const BRANDED_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge';

export default function CateringRoute() {
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    restaurantAPI.getById(BRANDED_ID)
      .then(res => { if (res.data?._id) setRestaurantId(res.data._id); })
      .catch(err => console.error('Failed to load restaurant:', err));
  }, []);

  if (!restaurantId) return <Loading />;

  return <CateringPage restaurantId={restaurantId} />;
}
