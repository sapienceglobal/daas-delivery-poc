'use client';

import { MapPin, Phone, MessageSquare, Clock, ShieldAlert, Navigation, Truck } from 'lucide-react';
import LiveCourierTrackingCard from './LiveCourierTrackingCard';

export default function DeliveryInfoCard({ order }) {
  if (!order) return null;

  const isDelivery = order.orderType === 'delivery';

  const getEtaRange = () => {
    if (order.deliveryTime) {
      const etaDate = new Date(order.deliveryTime);
      const startEta = new Date(etaDate.getTime() - 10 * 60 * 1000);

      const formatTime = (d) => d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return `${formatTime(startEta)} - ${formatTime(etaDate)}`;
    }

    const createdDate = new Date(order.createdAt);
    const startEta = new Date(createdDate.getTime() + 30 * 60 * 1000);
    const endEta = new Date(createdDate.getTime() + 45 * 60 * 1000);

    const formatTime = (d) => d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return `${formatTime(startEta)} - ${formatTime(endEta)}`;
  };

  const hasCourierLocation = typeof order.dasherLat === 'number' && typeof order.dasherLng === 'number';
  const progressPercent = {
    pending: 8,
    accepted: 18,
    preparing: 32,
    ready: 46,
    picked_up: hasCourierLocation ? 68 : 58,
    delivered: 100,
  }[order.status] ?? 20;

  const isCancelled = order.status === 'cancelled';

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm space-y-6">
      <h2 className="text-[20px] font-bold font-serif flex items-center gap-3 text-[#1a1a1a]">
        <span className="h-10 w-10 rounded-full flex items-center justify-center bg-[#fcedec] text-[#7a0b10] shrink-0">
          <Truck className="w-5 h-5" />
        </span>
        Delivery Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[14px] pt-2">
        <div className="space-y-6">
          <div className="flex justify-between items-center pr-4 md:pr-12">
            <span className="text-[14px] font-bold text-[#1a1a1a]">Delivery Type</span>
            <span className="text-[14px] font-medium text-[#4b5563] capitalize">{order.orderType || 'Delivery'}</span>
          </div>

          <div>
            <span className="text-[14px] font-bold text-[#1a1a1a] block mb-1.5">
              {isDelivery ? 'Delivery Address' : 'Pickup Address'}
            </span>
            <span className="text-[14px] font-medium text-[#4b5563] leading-relaxed block">
              {isDelivery ? order.address : order.restaurantAddress || 'At Restaurant location'}
            </span>
          </div>

          <div>
            <span className="text-[14px] font-bold text-[#1a1a1a] block mb-1.5">Phone Number</span>
            <span className="text-[14px] font-medium text-[#4b5563]">
              {order.customerPhone || 'N/A'}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <span className="text-[14px] font-bold text-[#1a1a1a] block mb-1.5">Delivery Instructions</span>
            <p className="text-[14px] font-medium text-[#4b5563] leading-relaxed">
              {order.courierNotes || 'No special instructions provided.'}
            </p>
          </div>

          <div>
            <span className="text-[14px] font-bold text-[#1a1a1a] block mb-2">Estimated Delivery Time</span>
            <span className="font-bold text-[18px] text-[#7a0b10] block mb-2">{getEtaRange()}</span>
            <span className="inline-block bg-[#fcedec] text-[#7a0b10] text-[12px] font-bold px-3 py-1.5 rounded-lg">
              30-45 mins
            </span>
          </div>
        </div>
      </div>

      {/* Desktop-only rendering of Live Tracking inside the Delivery Info card to preserve original design */}
      <div className="hidden lg:block">
        {isDelivery && order.status !== 'delivered' && (
          <div className="border-t border-[#e5e7eb] pt-6 mt-4">
            <LiveCourierTrackingCard order={order} isNaked={true} />
          </div>
        )}
      </div>

    </div>
  );
}