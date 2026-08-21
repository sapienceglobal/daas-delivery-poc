'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useBrand } from './BrandContext';

const CmsContext = createContext();

export const CmsProvider = ({ children }) => {
  const [cmsData, setCmsData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { brand, loading: brandLoading } = useBrand();
  const currentRestaurant = brand;

  useEffect(() => {
    // Attempt to fetch CMS data on load
    const fetchCms = async () => {
      try {
        // If single restaurant mode, get it by the known restaurant ID or simply pass a generic query
        // The backend `getCmsConfig` currently requires `restaurantId`. 
        // If `currentRestaurant._id` is available, use it. Otherwise, we can provide a default.
        if (!currentRestaurant?._id) return;
        
        const res = await api.get(`/api/cms?restaurantId=${currentRestaurant._id}`);
        if (res.data) {
          setCmsData(res.data);
        }
      } catch (err) {
        console.error('Failed to load CMS data:', err);
      } finally {
        setLoading(false);
      }
    };
    if (brandLoading) return; // Wait for brand context

    if (currentRestaurant?._id) {
      fetchCms();
    } else {
      setLoading(false); // No restaurant to fetch for, so stop loading
    }
  }, [currentRestaurant, brandLoading]);

  return (
    <CmsContext.Provider value={{ cmsData, loadingCms: loading }}>
      {children}
    </CmsContext.Provider>
  );
};

export const useCms = () => useContext(CmsContext);
