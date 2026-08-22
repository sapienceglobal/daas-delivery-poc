'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { restaurantAPI } from '@/lib/api';
import { PageLoader } from '@/components/ui';
import { showToast } from '@/components/ui';

const MerchantContext = createContext();

export function MerchantProvider({ children }) {
  const { user, isMerchant, isAdmin, isAuthenticated, loading: authLoading, backendVerified } = useAuth();
  const { joinRoom, on, off } = useSocket();
  const router = useRouter();

  const [restaurant, setRestaurant] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [stats, setStats] = useState({
    activeOrders: 0,
    newOrders: 0,
    preparingOrders: 0,
    pendingReservations: 0,
    pendingCatering: 0
  });

  useEffect(() => {
    if (authLoading) return;
    if (!backendVerified) return;
    if (!isAuthenticated) { router.push('/restaurant-panel'); return; }
    if (!isMerchant && !isAdmin) { router.push('/'); return; }
    
    initMerchantData();
  }, [isAuthenticated, isMerchant, isAdmin, authLoading, backendVerified]);

  const initMerchantData = async () => {
    try {
      setGlobalLoading(true);
      if (!user?.restaurantId) {
        setInitialLoading(false);
        setGlobalLoading(false);
        return;
      }
      const rid = user.restaurantId;
      setRoomId(rid);
      
      const restData = await restaurantAPI.getMyRestaurant().catch(() => null);
      if (restData && restData.data) {
        setRestaurant(restData.data);
      }
    } catch (error) {
      console.error("Failed to load merchant context:", error);
    } finally {
      setInitialLoading(false);
      setGlobalLoading(false);
    }
  };

  // global Realtime Notifications
  useEffect(() => {
    if (!roomId) return undefined;
    joinRoom(roomId);
    
    const handleRealtimeOrder = (data) => {
      // play a sound could be added here
      showToast('🔔 New Order Update received!', 'info');
      // you can also increment newOrders stat if needed
    };

    on('new_order', handleRealtimeOrder);
    
    return () => {
      off('new_order', handleRealtimeOrder);
    };
  }, [roomId, joinRoom, on, off]);

  const value = {
    user,
    restaurant,
    roomId,
    globalLoading,
    stats,
    setStats,
    refreshRestaurant: initMerchantData
  };

  if (authLoading || !backendVerified || initialLoading) {
    return (
      <div className="flex h-screen bg-[#070707] w-full text-brand-text font-sans">
        <div className="w-[250px] h-screen bg-[#111827] border-r border-[#1f2937] shrink-0" />
        <div className="flex-1 p-6 bg-[#F8FAFC]"><PageLoader text="Loading Workspace..." /></div>
      </div>
    );
  }

  return (
    <MerchantContext.Provider value={value}>
      {children}
    </MerchantContext.Provider>
  );
}

export function useMerchantContext() {
  const context = useContext(MerchantContext);
  if (!context) {
    throw new Error('useMerchantContext must be used within a MerchantProvider');
  }
  return context;
}
