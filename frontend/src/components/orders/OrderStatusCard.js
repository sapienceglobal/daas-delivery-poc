'use client';

import { Check, ClipboardList, Loader2 } from 'lucide-react';

export default function OrderStatusCard({ order }) {
  if (!order) return null;

  const isDelivery = order.orderType === 'delivery';

  // Define steps dynamically based on order type (Delivery vs Pickup/Dine-in)
  const steps = isDelivery
    ? [
        {
          id: 'received',
          label: 'Order Received',
          desc: "We've received your order and payment.",
          statuses: ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered'],
        },
        {
          id: 'accepted',
          label: 'Order Accepted',
          desc: 'Restaurant has accepted your order.',
          statuses: ['accepted', 'preparing', 'ready', 'picked_up', 'delivered'],
        },
        {
          id: 'preparing',
          label: 'Preparing Your Order',
          desc: 'Our chef is preparing your delicious food.',
          statuses: ['preparing', 'ready', 'picked_up', 'delivered'],
        },
        {
          id: 'ready',
          label: 'Food Ready',
          desc: 'Your food has been prepared.',
          statuses: ['ready', 'picked_up', 'delivered'],
        },
        {
          id: 'transit',
          label: 'Out for Delivery',
          desc: 'Your order is on the way.',
          statuses: ['picked_up', 'delivered'],
        },
        {
          id: 'delivered',
          label: 'Delivered',
          desc: 'Enjoy your meal!',
          statuses: ['delivered'],
        },
      ]
    : [
        {
          id: 'received',
          label: 'Order Received',
          desc: "We've received your order and payment.",
          statuses: ['pending', 'accepted', 'preparing', 'ready', 'delivered'],
        },
        {
          id: 'accepted',
          label: 'Order Accepted',
          desc: 'Restaurant has accepted your order.',
          statuses: ['accepted', 'preparing', 'ready', 'delivered'],
        },
        {
          id: 'preparing',
          label: 'Preparing Your Order',
          desc: 'Our chef is preparing your delicious food.',
          statuses: ['preparing', 'ready', 'delivered'],
        },
        {
          id: 'ready',
          label: order.orderType === 'dine_in' ? 'Served to Table' : 'Ready for Pickup',
          desc: order.orderType === 'dine_in' ? 'Your food is ready and being served.' : 'Your order is ready to be collected.',
          statuses: ['ready', 'delivered'],
        },
        {
          id: 'delivered',
          label: order.orderType === 'dine_in' ? 'Completed' : 'Collected',
          desc: 'We hope you enjoy your meal!',
          statuses: ['delivered'],
        },
      ];

  // Helper to resolve status progress
  const getStepState = (stepIndex) => {
    const currentStatus = order.status;
    
    // Status rank for sequence comparison
    const statusRank = isDelivery
      ? {
          pending: 0,
          accepted: 1,
          preparing: 2,
          ready: 3,
          picked_up: 4,
          delivered: 5,
          cancelled: -1,
        }
      : {
          pending: 0,
          accepted: 1,
          preparing: 2,
          ready: 3,
          delivered: 4,
          cancelled: -1,
        };

    const currentRank = statusRank[currentStatus] ?? 0;

    let isCompleted = false;
    let isActive = false;

    if (currentStatus === 'cancelled') {
      return { isCompleted: false, isActive: false, time: null };
    }

    if (currentRank >= stepIndex) {
      isCompleted = true;
    } else if (currentRank === stepIndex - 1) {
      isActive = true;
    }

    // Attempt to pull timestamp from statusUpdates list
    const stepObj = steps[stepIndex];
    const updateMatch = order.statusUpdates?.find(u => stepObj.statuses.includes(u.status));
    const timestampText = updateMatch
      ? new Date(updateMatch.timestamp || updateMatch.createdAt).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : null;

    return { isCompleted, isActive, time: timestampText };
  };

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm">
      
      {/* Heading */}
      <h2 className="text-[20px] font-bold font-serif flex items-center gap-3 text-[#1a1a1a] mb-6">
        <span className="h-10 w-10 rounded-full flex items-center justify-center bg-[#fcedec] text-[#7a0b10] shrink-0">
          <ClipboardList className="w-5 h-5" />
        </span>
        Order Status
      </h2>

        {/* Steps List */}
        <div className="relative pl-6 space-y-8">

        {steps.map((s, idx) => {
          const { isCompleted, isActive, time } = getStepState(idx);

          return (
            <div key={s.id} className="relative flex items-start gap-4 animate-in fade-in duration-300">
              
              {/* Left connector lines & indicator dots */}
              <div 
                className="absolute -left-[27px] top-0.5 z-10 flex flex-col items-center"
                style={{ bottom: idx < steps.length - 1 ? '-34px' : 'auto' }}
              >
                {isCompleted ? (
                  <div className="w-7 h-7 rounded-full bg-[#1fae64] text-[#ffffff] flex items-center justify-center shadow-sm shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : isActive ? (
                  <div className="w-7 h-7 rounded-full bg-[#ffffff] border-2 border-[#7a0b10] text-[#7a0b10] flex items-center justify-center shadow-sm relative shrink-0">
                    <div className="w-3 h-3 rounded-full bg-[#7a0b10]" />
                    <Loader2 className="w-7 h-7 absolute text-[#7a0b10]/30 animate-spin -z-10" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#ffffff] border-2 border-[#d1d5db] flex items-center justify-center shadow-sm shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#d1d5db]" />
                  </div>
                )}
                
                {/* Connector Line to Next Step */}
                {idx < steps.length - 1 && (
                  <div className={`w-0.5 flex-1 ${isCompleted ? 'bg-[#1fae64]' : 'bg-[#e5e7eb]'} -z-10`} />
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 pl-4">
                <div className="flex justify-between items-baseline gap-2 mb-0.5">
                  <h4 
                    className={`text-[15px] font-bold ${
                      isActive ? 'text-[#7a0b10]' : isCompleted ? 'text-[#1a1a1a]' : 'text-[#9ca3af]'
                    }`}
                  >
                    {s.label}
                  </h4>
                  {time && (
                    <span className="text-[12px] font-medium text-[#6b7280]">
                      {time}
                    </span>
                  )}
                </div>
                <p 
                  className={`text-[13px] leading-relaxed ${
                    isActive ? 'text-[#4b5563]' : isCompleted ? 'text-[#6b7280]' : 'text-[#9ca3af]/80'
                  }`}
                >
                  {s.desc}
                </p>
              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}
