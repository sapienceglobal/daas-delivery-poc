import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Phone, CreditCard, ShoppingBag, Receipt, User, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function ReviewOrderSection({
  step,
  t,
  restaurant,
  tip,
  setTip,
  onBack,
  onPlaceOrder,
  total,
  compiledAddress,
  fullName,
  phone,
  paymentMethod,
  items = [],
  subtotal,
  deliveryFee,
  tax,
  platformFee,
  serviceFee,
  packagingFee,
  couponDiscount,
  loyaltyDiscount,
  orderType,
  courierNotes,
  specialInstructions,
  isPlacingOrder,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (step === 3) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [step]);

  if (!mounted || step !== 3) return null;

  const isDelivery = orderType === 'delivery';

  // format payment method text
  const getPaymentLabel = () => {
    switch (paymentMethod) {
      case 'credit_card':
        return 'Credit / Debit Card';
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      default:
        return 'Selected Payment Method';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Modal Container */}
      <div className="w-full max-w-2xl bg-[#ffffff] border border-[#e5e7eb] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ll-slide-panel">
        
        {/* Header */}
        <div className="bg-[#fffcfb] border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between">
          <h2 className="text-[20px] font-bold font-serif text-[#7a0b10] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Review Your Order
          </h2>
          <button 
            onClick={onBack}
            className="p-1.5 rounded-full text-[#9ca3af] hover:text-[#1a1a1a] hover:bg-[#f3f4f6] transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin ll-soft-scroll">
          
          {/* 1. Customer & Location Details Card */}
          <div className="bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-4 space-y-3">
            <h3 className="text-xs uppercase font-extrabold text-[#7a0b10] tracking-wider mb-2 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {isDelivery ? 'Delivery Information' : 'Pickup Information'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block">Customer</span>
                <span className="font-bold text-[#1a1a1a]">{fullName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block">Contact</span>
                <span className="font-bold text-[#1a1a1a] flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#7a0b10]" /> {phone}
                </span>
              </div>
            </div>

            <div className="border-t border-[#e5e7eb] pt-3 mt-1 space-y-1">
              <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block">
                {isDelivery ? 'Delivery Address' : 'Pickup Location'}
              </span>
              <span className="font-bold text-[#1a1a1a] flex items-start gap-1">
                <MapPin className="w-4 h-4 text-[#7a0b10] shrink-0 mt-0.5" />
                {isDelivery ? compiledAddress : 'At Restaurant Address'}
              </span>
            </div>

            {isDelivery && courierNotes && (
              <div className="border-t border-[#e5e7eb] pt-3 mt-1 space-y-1">
                <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block">Courier Instructions</span>
                <span className="text-[13px] text-[#4b5563] italic">"{courierNotes}"</span>
              </div>
            )}

            {specialInstructions && (
              <div className="border-t border-[#e5e7eb] pt-3 mt-1 space-y-1">
                <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block">Kitchen Instructions</span>
                <span className="text-[13px] text-[#7a0b10] italic">"{specialInstructions}"</span>
              </div>
            )}
          </div>

          {/* 2. Payment Method Card */}
          <div className="bg-[#f9fafb] rounded-xl border border-[#e5e7eb] p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#fcedec] text-[#7a0b10] flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#6b7280] uppercase tracking-wider block">Payment Choice</span>
              <span className="font-extrabold text-[14px] text-[#1a1a1a]">{getPaymentLabel()}</span>
            </div>
          </div>

          {/* 3. Items Summary List */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-extrabold text-[#7a0b10] tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Order Items ({items.reduce((sum, i) => sum + i.quantity, 0)})
            </h3>
            
            <div className="border border-[#e5e7eb] rounded-xl divide-y divide-[#e5e7eb] overflow-hidden bg-[#ffffff]">
              {items.map((item, idx) => {
                const basePrice = item.selectedSize?.price ?? item.price;
                const addOnsTotal = item.addOns?.reduce((sum, a) => sum + (a.price || 0), 0) || 0;
                const unitPrice = basePrice + addOnsTotal;

                return (
                  <div key={idx} className="flex justify-between items-start p-3 text-sm">
                    <div>
                      <span className="font-bold text-[#1a1a1a]">{item.quantity}x {item.name}</span>
                      <div className="text-[11px] text-[#6b7280] mt-0.5">
                        {item.selectedSize?.name && <span className="mr-2">Size: {item.selectedSize.name}</span>}
                        {item.addOns && item.addOns.length > 0 && (
                          <span>+ {item.addOns.map(a => a.name).join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-[#7a0b10]">${(unitPrice * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3.5 Tipping Section */}
          {restaurant?.enableTips !== false && (
            <div className="space-y-3">
              <h3 className="text-xs uppercase font-extrabold text-[#7a0b10] tracking-wider flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                Add a Tip
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20].map((percent) => {
                  const tipAmount = (subtotal * percent) / 100;
                  const isSelected = Math.abs(tip - tipAmount) < 0.01;
                  return (
                    <button
                      key={percent}
                      onClick={() => setTip(tipAmount)}
                      className={`py-2 rounded-xl border text-sm font-bold transition-all ${
                        isSelected 
                          ? 'border-[#7a0b10] bg-[#fffcfb] text-[#7a0b10]' 
                          : 'border-[#e5e7eb] bg-[#ffffff] text-[#4b5563] hover:border-[#d1d5db]'
                      }`}
                    >
                      {percent}%
                    </button>
                  );
                })}
                <button
                  onClick={() => setTip(0)}
                  className={`py-2 rounded-xl border text-sm font-bold transition-all ${
                    tip === 0 
                      ? 'border-[#7a0b10] bg-[#fffcfb] text-[#7a0b10]' 
                      : 'border-[#e5e7eb] bg-[#ffffff] text-[#4b5563] hover:border-[#d1d5db]'
                  }`}
                >
                  None
                </button>
              </div>
            </div>
          )}

          {/* 4. Detailed Pricing Breakdown */}
          <div className="border-t border-dashed border-[#d1d5db] pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-[#4b5563]">
              <span>Subtotal</span>
              <span className="font-bold text-[#1a1a1a]">{formatCurrency(subtotal, restaurant?.currency)}</span>
            </div>

            {isDelivery && (
              <div className="flex justify-between text-[#4b5563]">
                <span>Delivery Fee</span>
                <span className="font-bold text-[#1a1a1a]">
                  {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee, restaurant?.currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-[#4b5563]">
              <span>{restaurant?.taxType || 'Taxes'}</span>
              <span className="font-bold text-[#1a1a1a]">{formatCurrency(tax, restaurant?.currency)}</span>
            </div>

            {platformFee > 0 && (
              <div className="flex justify-between text-[#4b5563]">
                <span>Platform Fee</span>
                <span className="font-bold text-[#1a1a1a]">{formatCurrency(platformFee, restaurant?.currency)}</span>
              </div>
            )}

            {serviceFee > 0 && (
              <div className="flex justify-between text-[#4b5563]">
                <span>Service Fee</span>
                <span className="font-bold text-[#1a1a1a]">{formatCurrency(serviceFee, restaurant?.currency)}</span>
              </div>
            )}

            {packagingFee > 0 && (
              <div className="flex justify-between text-[#4b5563]">
                <span>Packaging Fee</span>
                <span className="font-bold text-[#1a1a1a]">{formatCurrency(packagingFee, restaurant?.currency)}</span>
              </div>
            )}

            {tip > 0 && (
              <div className="flex justify-between text-[#4b5563]">
                <span>Tip</span>
                <span className="font-bold text-[#1a1a1a]">{formatCurrency(tip, restaurant?.currency)}</span>
              </div>
            )}

            {couponDiscount > 0 && (
              <div className="flex justify-between text-[#1fae64]">
                <span>Coupon Discount</span>
                <span className="font-bold">-{formatCurrency(couponDiscount, restaurant?.currency)}</span>
              </div>
            )}

            {loyaltyDiscount > 0 && (
              <div className="flex justify-between text-[#1fae64]">
                <span>Loyalty Points Discount</span>
                <span className="font-bold">-{formatCurrency(loyaltyDiscount, restaurant?.currency)}</span>
              </div>
            )}

            <div className="border-t border-[#e5e7eb] pt-3 mt-1 flex justify-between items-center">
              <span className="text-[15px] font-bold text-[#1a1a1a] uppercase tracking-wider">Total Amount</span>
              <span className="text-[22px] font-black text-[#7a0b10]">{formatCurrency(total, restaurant?.currency)}</span>
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-[#f9fafb] border-t border-[#e5e7eb] px-6 py-4 flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-3 border border-[#e5e7eb] hover:bg-[#ffffff] text-[13px] font-bold text-[#4b5563] uppercase tracking-wider rounded-xl ll-interactive ll-focus-ring"
          >
            Cancel / Back
          </button>
          <button
            onClick={onPlaceOrder}
            disabled={isPlacingOrder}
            className={`flex-1 py-3 bg-[#7a0b10] hover:bg-[#5e080c] text-[13px] font-bold text-[#ffffff] uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 ll-interactive ll-focus-ring ${
              isPlacingOrder ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isPlacingOrder ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Confirm & Place Order'
            )}
          </button>
        </div>

      </div>

    </div>,
    document.body
  );
}
