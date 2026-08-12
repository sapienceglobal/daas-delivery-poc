'use client';

import { MapPin, Navigation, ShieldAlert } from 'lucide-react';

import dynamic from 'next/dynamic';

const OrderTrackingMap = dynamic(() => import('./DynamicOrderTrackingMap'), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full animate-pulse bg-gray-100 rounded-xl" />
});

export default function LiveCourierTrackingCard({ order, isNaked = false, className = '' }) {
  if (!order) return null;

  const isDelivery = order.orderType === 'delivery';
  
  // We only show live tracking for delivery orders that are not delivered yet.
  if (!isDelivery || order.status === 'delivered') return null;

  const isCancelled = order.status === 'cancelled';
  const hasCourierLocation = typeof order.courierLat === 'number' && typeof order.courierLng === 'number';

  const getProviderName = (provider) => {
    if (provider === 'doordash') return 'DoorDash';
    if (provider === 'ubereats') return 'UberEats';
    if (provider === 'grubhub') return 'Grubhub';
    return 'Delivery Partner';
  };

  const wrapperClass = isNaked 
    ? `space-y-4 ${className}` 
    : `rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm space-y-4 ${className}`;

  return (
    <div className={wrapperClass}>
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
              <span className="font-bold text-[#6b7280] block mb-1">Courier Status</span>
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
                  ? `Last GPS: ${order.courierLat.toFixed(5)}, ${order.courierLng.toFixed(5)}`
                  : 'Awaiting delivery partner allocation and GPS update.'}
              </p>
            </div>
            {order.trackingUrl && (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-bold text-[#7a0b10] hover:underline flex items-center gap-1"
              >
                Track via {getProviderName(order.deliveryProvider)} <span>&rarr;</span>
              </a>
            )}
          </div>

          <div className="mt-4">
            <OrderTrackingMap order={order} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] pt-2">
            <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-3 shadow-sm flex items-center justify-between">
              <div>
                <span className="font-bold text-[#6b7280] block mb-1">Courier Partner</span>
                <span className="font-bold text-[#1a1a1a]">{order.courierName || 'Awaiting Assignment'}</span>
              </div>
            </div>
            <div className="rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-3 shadow-sm flex items-center justify-between">
              <div>
                <span className="font-bold text-[#6b7280] block mb-1">Contact Number</span>
                <span className="font-bold text-[#1a1a1a]">{order.courierPhone || 'Awaiting Assignment'}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
