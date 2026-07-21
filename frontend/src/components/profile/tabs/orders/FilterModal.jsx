'use client';

import { Modal } from '@/components/ui';

export default function FilterModal({ filterType, setFilterType, onClose }) {
  return (
    <Modal isOpen={true} onClose={onClose} title="Filter Orders">
      <div className="space-y-5">
        <div>
          <label className="text-[13px] font-black text-[#1a1a1a] block mb-2">Order Type</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'delivery', label: 'Delivery' },
              { id: 'pickup', label: 'Pickup' },
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                className={`py-2.5 rounded-lg text-[13px] font-bold border transition-colors ${
                  filterType === type.id
                    ? 'bg-[#7a0b10] border-[#7a0b10] text-white'
                    : 'border-[#eadfdb] bg-white text-[#333] hover:bg-[#fff8ed]'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#eadfdb]">
          <button
            onClick={() => {
              setFilterType('all');
              onClose();
            }}
            className="px-4 py-2 text-[13px] font-bold text-[#6b7280] hover:text-[#1a1a1a]"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-[#7a0b10] px-5 py-2 text-[13px] font-black text-white hover:bg-[#680307]"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </Modal>
  );
}