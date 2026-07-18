'use client';

import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Minus, Plus } from 'lucide-react';
import { useCart } from '@/context/CartContext';

/**
 * ItemCustomizationModal — Premium Lassi Lounge UI
 * Uses React Portal to prevent CSS transform scrolling bugs.
 */
export default function ItemCustomizationModal({ item, onClose }) {
  const { addItem } = useCart();
  const [mounted, setMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState(item.sizes?.[0] ?? null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [quantity, setQuantity] = useState(1);

  // Mount logic for Portal
  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const totalPrice = useMemo(() => {
    const base = selectedSize?.price ?? (item.price || 0);
    const addOnsTotal = selectedAddOns.reduce((sum, addOn) => sum + (addOn.price || 0), 0);
    return (base + addOnsTotal) * quantity;
  }, [item, selectedSize, selectedAddOns, quantity]);

  function toggleAddOn(addOn) {
    setSelectedAddOns((prev) =>
      prev.some((a) => a.id === addOn.id) ? prev.filter((a) => a.id !== addOn.id) : [...prev, addOn]
    );
  }

  function handleConfirm() {
    addItem({
      ...item,
      qty: quantity,
      selectedSize,
      selectedAddOns,
      finalPrice: totalPrice,
    });
    onClose();
  }

  // Next.js hydration safety - Portal target tabhi milega jab component mount hoga
  if (!mounted) return null;

  // Use createPortal to break out of all parent CSS transforms and stack contexts
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 select-none">
      
      {/* Dark Blur Overlay */}
      <div 
        className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-lg bg-[#ffffff] border border-[#e5e7eb] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Image & Close Button */}
        <div className="relative h-44 sm:h-52 w-full bg-[#f3f4f6] shrink-0">
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-[#ffffff]/90 backdrop-blur-sm rounded-full text-[#1a1a1a] hover:bg-[#ffffff] hover:text-[#7a0b10] transition-colors shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (Details, Sizes, Add-ons) */}
        <div className="p-5 sm:p-6 overflow-y-auto">
          <h3 className="font-serif font-bold text-[22px] text-[#1a1a1a] leading-tight">{item.name}</h3>
          <p className="text-[13.5px] text-[#6b7280] mt-1.5 leading-relaxed">{item.description}</p>

          {/* Sizes Options */}
          {item.sizes?.length > 0 && (
            <div className="mt-6">
              <h4 className="text-[14px] font-bold text-[#1a1a1a] mb-3">Choose Size</h4>
              <div className="flex flex-col gap-2.5">
                {item.sizes.map((size) => {
                  const isSelected = selectedSize?.id === size.id;
                  return (
                    <label
                      key={size.id}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-[13px] border shadow-sm transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#fcedec] text-[#7a0b10] border-[#7a0b10]/40 font-bold' 
                          : 'bg-[#ffffff] text-[#4b5563] border-[#e5e7eb] hover:border-[#7a0b10]/30 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="size"
                          checked={isSelected}
                          onChange={() => setSelectedSize(size)}
                          className="sr-only"
                        />
                        {/* Custom Radio Button UI */}
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#7a0b10]' : 'border-[#d1d5db]'}`}>
                          {isSelected && <div className="w-2 h-2 bg-[#7a0b10] rounded-full" />}
                        </div>
                        <span>{size.label}</span>
                      </div>
                      <span className={isSelected ? 'text-[#7a0b10]' : 'text-[#6b7280]'}>
                        ${size.price.toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons Options */}
          {item.addOns?.length > 0 && (
            <div className="mt-6">
              <h4 className="text-[14px] font-bold text-[#1a1a1a] mb-3">Add Extras</h4>
              <div className="flex flex-col gap-2.5">
                {item.addOns.map((addOn) => {
                  const isSelected = selectedAddOns.some((a) => a.id === addOn.id);
                  return (
                    <label
                      key={addOn.id}
                      className={`flex items-center justify-between rounded-xl px-4 py-3 text-[13px] border shadow-sm transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#fcedec] text-[#7a0b10] border-[#7a0b10]/40 font-bold' 
                          : 'bg-[#ffffff] text-[#4b5563] border-[#e5e7eb] hover:border-[#7a0b10]/30 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAddOn(addOn)}
                          className="sr-only"
                        />
                        {/* Custom Checkbox UI */}
                        <div className={`w-4 h-4 rounded-[4px] border-2 flex items-center justify-center ${isSelected ? 'border-[#7a0b10] bg-[#7a0b10]' : 'border-[#d1d5db] bg-[#ffffff]'}`}>
                          {isSelected && <svg className="w-3 h-3 text-[#ffffff]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <span>{addOn.label}</span>
                      </div>
                      <span className={isSelected ? 'text-[#7a0b10]' : 'text-[#6b7280]'}>
                        +${addOn.price.toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer (Quantity & Add to Cart) */}
        <div className="p-4 sm:p-5 border-t border-[#e5e7eb] bg-[#ffffff] shrink-0 flex items-center justify-between gap-4">
          
          {/* Quantity Controls */}
          <div className="flex items-center border border-[#e5e7eb] rounded-lg h-11 bg-[#ffffff] shadow-sm overflow-hidden shrink-0">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))} 
              className="px-3 sm:px-4 text-[#7a0b10] hover:bg-[#f9fafb] h-full flex items-center justify-center transition-colors" 
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <div className="w-px h-full bg-[#e5e7eb]"></div>
            <span className="text-[14px] font-bold text-[#1a1a1a] w-10 sm:w-12 text-center">{quantity}</span>
            <div className="w-px h-full bg-[#e5e7eb]"></div>
            <button 
              onClick={() => setQuantity(quantity + 1)} 
              className="px-3 sm:px-4 text-[#7a0b10] hover:bg-[#f9fafb] h-full flex items-center justify-center transition-colors" 
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button 
            onClick={handleConfirm}
            className="flex-1 bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] font-bold h-11 px-4 sm:px-6 rounded-lg shadow-md text-[12px] sm:text-[13px] tracking-wider uppercase flex items-center justify-center transition-colors whitespace-nowrap"
          >
            Add To Cart — ${totalPrice.toFixed(2)}
          </button>
          
        </div>
      </div>
    </div>,
    document.body // createPortal attaches modal here safely!
  );
}