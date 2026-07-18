'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { restaurantAPI } from '@/lib/api';

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const isSingleRestaurantMode = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

  useEffect(() => {
    if (!isSingleRestaurantMode) {
      setLoading(false);
      return;
    }

    const loadBrandInfo = async () => {
      try {
        const res = await restaurantAPI.getAll();
        const lassiLounge = res.data?.find(r => r.name.toLowerCase().includes('lassi lounge'));
        if (lassiLounge) {
          setBrand(lassiLounge);
        }
      } catch (err) {
        console.error('Failed to load brand context metadata:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBrandInfo();
  }, [isSingleRestaurantMode]);

  return (
    <BrandContext.Provider value={{ isSingleRestaurantMode, brand, loading }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}
