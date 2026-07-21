'use client';

import { useRouter } from 'next/navigation';
import { ShoppingCart, Truck } from 'lucide-react';
import { Modal } from '@/components/ui';
import { getStatusMeta, formatOrderId, formatDate, getDishImage } from '../../profileUtils';

export default function OrderDetailsModal({ order, onClose, onReorder }) {
  const router = useRouter();
  const statusMeta = getStatusMeta(order.status);
  const StatusIcon = statusMeta.icon;
  const stamp = formatDate(order.createdAt);

  const steps = [
    { key: 'pending', label: 'Placed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const currentStepIdx = steps.findIndex(s => s.key === order.status);

  return (
    <Modal isOpen={true} onClose={onClose} title={`Order #${formatOrderId(order)}`}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
        
        {/* Header Summary */}
        <div className="flex items-center justify-between border-b border-[#eadfdb] pb-4">
          <div>
            <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[13px] font-black ${statusMeta.className}`}>
              <StatusIcon className="h-4 w-4" /> {statusMeta.label}
            </span>
            <p className="text-[12px] font-semibold text-[#6b7280] mt-2">
              Placed on {stamp.date} at {stamp.time}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold text-[#6b7280]">Total Amount</p>
            <p className="text-[22px] font-black text-[#7a0b10]">${Number(order.total || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Live Status Tracker Stepper */}
        {order.status !== 'cancelled' && (
          <div className="rounded-xl border border-[#eadfdb] bg-[#fffaf5] p-4">
            <h4 className="text-[13px] font-black text-[#7a0b10] mb-4">Order Progress</h4>
            <div className="flex items-center justify-between relative">
              {steps.map((step, idx) => {
                const isCompleted = idx <= (currentStepIdx >= 0 ? currentStepIdx : 4);
                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-black ${
                        isCompleted ? 'bg-[#7a0b10] text-white shadow-xs' : 'bg-[#e5e7eb] text-[#6b7280]'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span className="text-[10px] font-bold mt-1 text-center text-[#333]">{step.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Itemized Dish Breakdown */}
        <div>
          <h4 className="text-[14px] font-black text-[#1a1a1a] mb-3">Items Ordered</h4>
          <div className="divide-y divide-[#f0e6e2] rounded-xl border border-[#eadfdb] overflow-hidden">
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3.5 bg-white">
                <img
                  src={item.image || getDishImage(item.name)}
                  alt={item.name}
                  className="h-14 w-14 rounded-lg object-cover border border-[#eadfdb]"
                />
                <div className="flex-1 min-w-0">
                  <h5 className="text-[13px] font-black text-[#1a1a1a] truncate">{item.name}</h5>
                  {item.selectedSize?.name && (
                    <p className="text-[11px] font-medium text-[#6b7280]">Size: {item.selectedSize.name}</p>
                  )}
                  {item.addOns?.length > 0 && (
                    <p className="text-[11px] font-medium text-[#6b7280]">
                      Add-ons: {item.addOns.map(a => a.name).join(', ')}
                    </p>
                  )}
                  <p className="text-[11px] font-bold text-[#7a0b10] mt-0.5">${Number(item.price || 0).toFixed(2)} x {item.quantity || 1}</p>
                </div>
                <p className="text-[14px] font-black text-[#1a1a1a]">
                  ${Number((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Address & Bill Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[#eadfdb] p-3.5 bg-[#fbfaf7]">
            <h5 className="text-[12px] font-black text-[#7a0b10] mb-1">Delivery Address</h5>
            <p className="text-[12px] font-semibold text-[#333] leading-relaxed">
              {order.address || '34 Union Avenue, Patiala, NY 11022, USA'}
            </p>
          </div>

          <div className="rounded-xl border border-[#eadfdb] p-4 space-y-2 bg-[#fff8ed]">
            <div className="flex justify-between text-[12px] font-medium text-[#4b5563]">
              <span>Subtotal</span>
              <span>${Number(order.subtotal || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[15px] font-black text-[#7a0b10] border-t border-[#eadfdb] pt-2 mt-2">
              <span>Total</span>
              <span>${Number(order.total || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            onClick={() => {
              onClose();
              router.push(`/customer/orders/${order._id}`);
            }}
            className="rounded-lg bg-[#7a0b10] px-4 py-2.5 text-[13px] font-black text-white flex items-center gap-2 hover:bg-[#680307] transition-colors shadow-xs"
          >
            <Truck className="h-4 w-4" /> Track Live Status
          </button>
          {order.status !== 'cancelled' && (
            <button
              onClick={onReorder}
              className="rounded-lg border border-[#b47b80] px-4 py-2.5 text-[13px] font-black text-[#7a0b10] flex items-center gap-2 hover:bg-[#fff8ed] transition-colors"
            >
              <ShoppingCart className="h-4 w-4" /> Reorder All
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-[#eadfdb] px-4 py-2.5 text-[13px] font-bold text-[#333] hover:bg-[#f3ece8]"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}