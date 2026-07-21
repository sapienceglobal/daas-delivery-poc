'use client';

import { MapPin, Phone, MessageSquare, Clock, ShieldAlert, Navigation, Truck } from 'lucide-react';

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

      {isDelivery && order.status !== 'delivered' && (
        <div className="border-t border-[#e5e7eb] pt-6 mt-4 space-y-4">
          {isCancelled ? (
            <>
              <div>
                <h3 className="text-[14px] font-bold text-[#1a1a1a] uppercase tracking-wider">Live Courier Tracking</h3>
                <p className="text-[12px] text-[#6b7280] mt-0.5">Tracking unavailable — this order was cancelled.</p>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] p-4">
                <span className="h-10 w-10 rounded-full bg-[#fee2e2] text-[#ef4444] flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-[14px] font-bold text-[#ef4444]">Order Cancelled</h4>
                  <p className="text-[12px] text-[#6b7280] mt-0.5">No courier was assigned for this order.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] pt-2">
                <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-2 shadow-sm">
                  <span className="font-bold text-[#6b7280] block mb-1">Courier Partner</span>
                  <span className="font-bold text-[#ef4444]">—</span>
                </div>
                <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-2 shadow-sm">
                  <span className="font-bold text-[#6b7280] block mb-1">Contact Number</span>
                  <span className="font-bold text-[#ef4444]">—</span>
                </div>
                <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-2 shadow-sm">
                  <span className="font-bold text-[#6b7280] block mb-1">Dasher Status</span>
                  <span className="font-bold text-[#ef4444]">—</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-[#1a1a1a] uppercase tracking-wider">Live Courier Tracking</h3>
                  <p className="text-[12px] text-[#6b7280] mt-0.5">
                    {hasCourierLocation
                      ? `Last GPS: ${order.dasherLat.toFixed(5)}, ${order.dasherLng.toFixed(5)}`
                      : 'Awaiting DoorDash driver allocation and GPS update.'}
                      
                  </p>
                </div>
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[13px] font-bold text-[#7a0b10] hover:underline flex items-center gap-1"
                  >
                    DoorDash Link <span>&rarr;</span>
                  </a>
                )}
              </div>

              <div className="relative h-44 overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f9fafb]">
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage:
                      'linear-gradient(#fcedec 1.5px, transparent 1.5px), linear-gradient(90deg, #fcedec 1.5px, transparent 1.5px)',
                    backgroundSize: '24px 24px',
                  }}
                />
                <div className="absolute left-[15%] top-1/2 h-1 w-[70%] -translate-y-1/2 rounded-full bg-[#e5e7eb]" />
                <div
                  className="absolute left-[15%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#7a0b10]"
                  style={{ width: `${Math.min(progressPercent, 88) * 0.7}%` }}
                />

                <div className="absolute left-[10%] top-1/2 -translate-y-1/2 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#7a0b10]/20 bg-[#fcedec]">
                    <MapPin className="h-4 w-4 text-[#7a0b10]" />
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-[#6b7280]">Restaurant</p>
                </div>

                <div className="absolute right-[10%] top-1/2 -translate-y-1/2 text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-[#15803d]/20 bg-[#e6f7ec]">
                    <MapPin className="h-4 w-4 text-[#15803d]" />
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-[#6b7280]">Dropoff</p>
                </div>

                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
                  style={{ left: `${Math.max(15, Math.min(progressPercent, 85))}%` }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#e8a020] bg-[#ffffff] shadow-md">
                    <Navigation className="h-5 w-5 text-[#e8a020] rotate-45 fill-current" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] pt-2">
                <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-2 shadow-sm">
                  <span className="font-bold text-[#6b7280] block mb-1">Courier Partner</span>
                  <span className="font-bold text-[#1a1a1a]">{order.dasherName || 'Awaiting assignment'}</span>
                </div>
                <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-2 shadow-sm">
                  <span className="font-bold text-[#6b7280] block mb-1">Contact Number</span>
                  <span className="font-bold text-[#1a1a1a]">{order.dasherPhone || 'Awaiting allocation'}</span>
                </div>
                <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-2 shadow-sm">
                  <span className="font-bold text-[#6b7280] block mb-1">Dasher Status</span>
                  <span className="font-bold text-[#1a1a1a] capitalize">{order.status?.replace('_', ' ')}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}