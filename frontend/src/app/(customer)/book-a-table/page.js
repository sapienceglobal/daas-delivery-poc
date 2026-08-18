'use client';

/**
 * /book-a-table — Clean SEO URL for Lassi Lounge table reservations.
 * lassiloungeny.com/book-a-table
 */

import { useState, useEffect } from 'react';
import BookTablePage from '@/components/book-table/BookTablePage';
import { restaurantAPI } from '@/lib/api';
import Loading from '@/app/loading';

const BRANDED_ID = process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID || 'lassi-lounge';

export default function BookATablePage() {
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    restaurantAPI.getById(BRANDED_ID)
      .then(res => { if (res.data?._id) setRestaurantId(res.data._id); })
      .catch(err => console.error('Failed to load restaurant:', err));
  }, []);

  if (!restaurantId) return <Loading />;

  return <BookTablePage restaurantId={restaurantId} />;
}
