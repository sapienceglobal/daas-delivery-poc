'use client';

import { ShoppingCart, ChevronRight } from 'lucide-react';
import { 
  getStatusMeta, 
  formatOrderId, 
  formatDate, 
  getDishImage 
} from '../../profileUtils';

export default function OrderHistoryCard({ order, onReorder, onViewDetails }) {
  const statusMeta = getStatusMeta(order.status);
  const StatusIcon = statusMeta.icon;
  const stamp = formatDate(order.createdAt);
  const displayItems = order.items?.slice(0, 3) || [];
  const totalItemsCount = order.items?.length || 0;
  const canReorder = order.status !== 'cancelled';

  return (
    <article className="rounded-2xl border border-[#e8dcd8] bg-[#fffdfa] p-5 shadow-sm grid grid-cols-1 xl:grid-cols-[160px_190px_1fr_140px] gap-6 items-center hover:shadow-md transition-shadow duration-300">
      
      {/* Col 1: Order ID & Date/Time */}
      <div className="xl:border-r border-[#e8dcd8] xl:pr-5 h-full flex flex-col justify-center">
        <p className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Order ID</p>
        <h3 className="mt-1 text-[18px] font-black text-[#7a0b10] leading-tight break-words">
          {formatOrderId(order)}
        </h3>
        <div className="mt-4">
          <p className="text-[12px] font-bold text-[#4b5563] leading-snug">{stamp.date}</p>
          <p className="text-[12px] font-bold text-[#4b5563] leading-snug">{stamp.time}</p>
        </div>
      </div>

      {/* Col 2: Status & Address & Total */}
      <div className="xl:border-r border-[#e8dcd8] xl:pr-5 h-full flex flex-col justify-center items-start">
        <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-1 text-[12.5px] font-black tracking-wide ${statusMeta.className}`}>
          <StatusIcon className="h-4 w-4" /> {statusMeta.label}
        </span>

        <p className="mt-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
          {order.orderType === 'pickup' ? 'Pickup from' : 'Delivery to'}
        </p>
        <p className="mt-0.5 text-[13px] font-semibold leading-relaxed text-[#333] line-clamp-2">
          {order.orderType === 'pickup'
            ? order.restaurantAddress || 'Lassi Lounge Restaurant'
            : order.address || '34 Union Avenue, Patiala, NY 11022, USA'}
        </p>

        <p className="mt-4 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">Total Amount</p>
        <p className="text-[20px] font-black text-[#7a0b10] mt-1 leading-none">
          ${Number(order.total || 0).toFixed(2)}
        </p>
      </div>

      {/* Col 3: Items Thumbnails & Breakdown */}
      <div className="h-full flex flex-col justify-center pl-2">
        <h4 className="text-[13px] font-black text-[#1a1a1a] mb-3 tracking-tight">
          {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
        </h4>

        <div className="flex flex-wrap gap-5">
          {displayItems.map((item, idx) => (
            <div key={`${item.menuItemId || item.name}-${idx}`} className="w-[72px]">
              <img
                src={item.image || getDishImage(item.name)}
                alt={item.name}
                className="h-[72px] w-[72px] rounded-2xl object-cover border border-[#e8dcd8] shadow-[0_2px_8px_rgba(0,0,0,0.04)] bg-white"
              />
              <p className="mt-2.5 text-[12px] font-black text-[#1a1a1a] truncate leading-tight">{item.name}</p>
              <p className="mt-0.5 text-[12px] font-bold text-[#6b7280]">x {item.quantity || 1}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Col 4: Action Buttons */}
      <div className="flex xl:flex-col items-center xl:items-stretch justify-center gap-4 h-full pt-4 xl:pt-0">
        {canReorder && (
          <button
            onClick={onReorder}
            className="w-full rounded-xl border border-[#7a0b10] px-4 py-2 text-[14px] font-black text-[#7a0b10] flex items-center justify-center gap-2 hover:bg-[#fffcf9] hover:shadow-sm transition-all"
          >
            <ShoppingCart className="h-4 w-4" /> Reorder
          </button>
        )}

        <button
          onClick={onViewDetails}
          className="w-full text-[13px] font-black text-[#7a0b10] flex items-center justify-center gap-1 hover:underline py-1"
        >
          View Details <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
}