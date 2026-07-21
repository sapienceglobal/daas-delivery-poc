'use client';

import { Search, Filter } from 'lucide-react';

const statusTabs = [
  { id: 'all', label: 'All Orders' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function OrdersHeader({ 
  activeStatus, 
  setActiveStatus, 
  search, 
  setSearch, 
  onOpenFilter, 
  filterType 
}) {
  return (
    <div className="border-b-2 border-[#f0e6e2] px-5 md:px-8 pt-6 bg-white rounded-t-xl">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        <h2 className="font-serif text-[28px] md:text-[32px] font-black text-[#7a0b10] tracking-tight drop-shadow-sm ">Order History</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-[320px]">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by order ID or item..."
              className="w-full h-11 rounded-xl border-2 border-[#f0e6e2] bg-[#fbfaf7] text-[14px] font-semibold text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#7a0b10] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#7a0b10]/10 transition-all p-2"
            />
            <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8d1118]" />
          </div>

          {/* Filter Button */}
          <button
            onClick={onOpenFilter}
            className={`h-11 rounded-xl border-2 px-6 text-[14px] font-black flex items-center justify-center gap-2.5 transition-all shadow-sm ${
              filterType !== 'all'
                ? 'bg-[#7a0b10] border-[#7a0b10] text-white'
                : 'border-[#f0e6e2] bg-white text-[#7a0b10] hover:border-[#b47b80] hover:bg-[#fff8ed]'
            }`}
          >
            <Filter className="h-[18px] w-[18px]" /> Filter {filterType !== 'all' && `(${filterType})`}
          </button>
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="mt-6 flex flex-wrap gap-8 border-t-2 border-[#f0e6e2] pt-4">
        {statusTabs.map((tab) => {
          const isActive = activeStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={`relative pb-3.5 text-[15px] font-black tracking-wide transition-colors ${
                isActive ? 'text-[#7a0b10]' : 'text-[#6b7280] hover:text-[#7a0b10]'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute -bottom-[18px] left-0 right-0 h-[3px] bg-[#7a0b10] rounded-t-full shadow-[0_-2px_4px_rgba(122,11,16,0.3)]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}