'use client';
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Truck, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { restaurantAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import LassiAddressModal from '../LassiAddressModal';

export default function OrderOnlineHero() {
  const { user, updateUser } = useAuth();
  const [eta, setEta] = useState({ pickup: null, delivery: null, isOutOfRange: false });
  const [loadingEta, setLoadingEta] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Get default address from user or local state
  const defaultAddress = user?.savedAddresses?.find(a => a.isDefault)?.address || 
                         user?.savedAddresses?.[0]?.address || 
                         null;
                         
  const effectiveAddress = selectedAddress || defaultAddress;

  useEffect(() => {
    const fetchEta = async () => {
      setLoadingEta(true);
      try {
        const res = await restaurantAPI.getEta('lassi-lounge', effectiveAddress);
        if (res.success) {
          setEta({
            pickup: res.data.prepTime,
            delivery: res.data.deliveryTime,
            isOutOfRange: res.data.isOutOfRange || false
          });
        }
      } catch (err) {
        console.error('Failed to fetch ETA:', err);
      } finally {
        setLoadingEta(false);
      }
    };

    fetchEta();
  }, [effectiveAddress]);

  const handleAddressSelect = async (addressObj) => {
    setSelectedAddress(addressObj.address);
    setIsAddressModalOpen(false);
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#f8f5f0] flex items-center justify-center min-h-[360px] md:min-h-[420px]">
      
      {/* Background Image on Right */}
      <div 
        className="absolute inset-0 md:left-1/3 bg-cover bg-right bg-no-repeat z-0"
        style={{ backgroundImage: `url('/images/branded/lassi-lounge/hero-spread.jpg')` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#f8f5f0] via-[#f8f5f0]/90 to-transparent z-10" />

      {/* Content Container */}
      <div className="relative z-20 mx-auto max-w-[1550px] px-6 lg:px-12 w-full flex flex-col justify-center">
        
        <div className="max-w-2xl">
          {/* Eyebrow Script */}
          <h2 
            className="text-[#c67a3f] text-3xl md:text-4xl lg:text-5xl mb-2" 
            style={{ fontFamily: "'Dancing Script', cursive" }}
          >
            Craving Something Delicious?
          </h2>
          
          {/* Main Heading */}
          <h1 className="font-sans font-black text-[#4a0b0d] text-5xl md:text-[72px] lg:text-[84px] tracking-tight uppercase leading-[0.9] mb-4">
            Order Online
          </h1>
          
          {/* Subtitle */}
          <p className="text-[#374151] text-[15px] md:text-lg font-medium max-w-[380px] leading-snug mb-8">
            Enjoy your favorite Indian food delivered hot & fresh at your doorstep.
          </p>
          
          {/* Action Buttons / Delivery & Pickup Boxes */}
          <div className="w-full max-w-md">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full">
              
              {/* Delivery Box */}
              <div 
                onClick={() => {
                  if (!effectiveAddress) setIsAddressModalOpen(true);
                }}
                className={`relative flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                  eta.isOutOfRange 
                    ? 'bg-[#374151] border-[#374151] text-white shadow-sm' 
                    : 'bg-[#4a0b0d] border-[#4a0b0d] text-white shadow-md hover:bg-[#5e0c0f]'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Truck className={`w-5 h-5 ${eta.isOutOfRange ? 'text-red-300' : 'text-white'}`} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="font-bold text-[15px] leading-tight tracking-wide">Delivery</span>
                  <span className={`text-[12px] font-medium tracking-wide mt-0.5 ${eta.isOutOfRange ? 'text-red-300 font-semibold' : 'text-white/80'}`}>
                    {loadingEta ? (
                      <span className="inline-block w-12 h-3 bg-white/20 rounded animate-pulse" />
                    ) : eta.isOutOfRange ? (
                      'Out of range'
                    ) : effectiveAddress ? (
                      `${eta.delivery} mins`
                    ) : (
                      'Set Address'
                    )}
                  </span>
                </div>
              </div>

              {/* Pickup Box */}
              <div 
                className="flex items-center gap-3 px-4 sm:px-5 py-3.5 rounded-xl bg-white border border-[#e5e7eb] text-[#1a1a1a] shadow-sm hover:border-[#4a0b0d]/30 transition-all duration-200 select-none"
              >
                <div className="w-10 h-10 rounded-lg bg-[#4a0b0d]/5 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-5 h-5 text-[#4a0b0d]" />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="font-bold text-[15px] leading-tight tracking-wide text-[#1a1a1a]">Pickup</span>
                  <span className="text-[12px] text-[#6b7280] font-medium tracking-wide mt-0.5">
                    {loadingEta ? (
                      <span className="inline-block w-12 h-3 bg-gray-200 rounded animate-pulse" />
                    ) : (
                      `${eta.pickup || 15} mins`
                    )}
                  </span>
                </div>
              </div>

            </div>

            {/* Address Prompt (Rendered BELOW the grid, completely outside the boxes) */}
            <div className="min-h-[24px] mt-2.5 flex items-center">
              {effectiveAddress && eta.isOutOfRange ? (
                <p className="text-[11px] text-red-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping inline-block" />
                  Address is too far for delivery.
                </p>
              ) : !effectiveAddress ? (
                <button 
                  onClick={() => setIsAddressModalOpen(true)}
                  className="text-[11px] text-[#4a0b0d] hover:text-[#c67a3f] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors group"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#c67a3f] group-hover:scale-110 transition-transform" /> 
                  <span>ENTER ADDRESS FOR ETA</span>
                </button>
              ) : (
                <button 
                  onClick={() => setIsAddressModalOpen(true)}
                  className="text-[11px] text-[#6b7280] hover:text-[#4a0b0d] font-medium flex items-center gap-1 transition-colors truncate max-w-full"
                >
                  <MapPin className="w-3 h-3 text-[#c67a3f] shrink-0" />
                  <span className="truncate">Delivering to: <strong className="text-[#1a1a1a] font-semibold">{effectiveAddress}</strong></span>
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      <LassiAddressModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)} 
        onSelect={handleAddressSelect}
      />
    </div>
  );
}
