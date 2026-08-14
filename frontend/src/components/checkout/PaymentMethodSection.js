'use client';
import { CreditCard, Check, HelpCircle, Lock, Smartphone } from 'lucide-react';
import { showToast } from '@/components/ui';

export default function PaymentMethodSection({
  step, setStep,
  paymentMethod, setPaymentMethod,
  cardNo, setCardNo, cardExpiry, setCardExpiry, cardCvv, setCardCvv, cardName, setCardName,
  onBack, onContinue,
  orderType, quoteError, user,
  appliedCouponData, isPaymentMethodLockedByCoupon
}) {
  return (
    <div className={`rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 shadow-sm ll-interactive ${step === 3 ? 'opacity-85' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[22px] font-bold font-serif flex items-center gap-3 text-[#1a1a1a]">
          <span className="h-11 w-11 rounded-full flex items-center justify-center bg-[#fcedec] text-[#7a0b10]">
            <CreditCard className="w-5 h-5" />
          </span>
          2. Payment Method
        </h2>
        {step === 3 && (
          <button onClick={() => setStep(2)} className="text-[13px] font-bold text-[#7a0b10] hover:underline">
            Change
          </button>
        )}
      </div>

      {step < 3 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* SAVED CARDS */}
            {user?.savedCards?.map((card) => (
              <button
                key={card._id}
                type="button"
                onClick={() => setPaymentMethod(`saved_card_${card._id}`)}
                className={`flex items-start text-left gap-[14px] rounded-xl p-4 border relative overflow-hidden h-[94px] ll-interactive ll-focus-ring ${
                  paymentMethod === `saved_card_${card._id}` ? 'border-[#7a0b10] bg-[#fffaf9]' : 'border-[#e5e7eb] bg-[#ffffff] hover:border-[#d1d5db]'
                }`}
              >
                <div className="relative shrink-0 mt-[2px]">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center relative z-10 ${
                    paymentMethod === `saved_card_${card._id}` ? 'bg-[#7a0b10] text-[#ffffff]' : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#d1d5db]'
                  }`}>
                    <Check className="w-3 h-3" strokeWidth={4} />
                  </div>
                  {paymentMethod === `saved_card_${card._id}` && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-[#7a0b10]"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold text-[14px] leading-tight mb-[6px] truncate ${paymentMethod === `saved_card_${card._id}` ? 'text-[#1a1a1a]' : 'text-[#4b5563]'}`}>
                    {card.title || 'Personal Card'}
                  </h4>
                  <p className="text-[12px] text-[#6b7280] capitalize mb-[2px]">{card.brand} •••• {card.last4}</p>
                  <p className="text-[12px] text-[#6b7280]">Expires {card.expMonth.toString().padStart(2, '0')}/{card.expYear}</p>
                </div>
              </button>
            ))}

            {/* 1. SECURE STRIPE CHECKOUT */}
            <button
              type="button"
              onClick={() => setPaymentMethod('stripe_online')}
              className={`flex items-start text-left gap-[14px] rounded-xl p-4 border relative overflow-hidden h-[94px] ll-interactive ll-focus-ring ${
                paymentMethod === 'stripe_online' ? 'border-[#7a0b10] bg-[#fffaf9]' : 'border-[#e5e7eb] bg-[#ffffff] hover:border-[#d1d5db]'
              }`}
            >
              <div className="relative shrink-0 mt-[2px]">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center relative z-10 ${
                  paymentMethod === 'stripe_online' ? 'bg-[#7a0b10] text-[#ffffff]' : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#d1d5db]'
                }`}>
                  <Check className="w-3 h-3" strokeWidth={4} />
                </div>
                {paymentMethod === 'stripe_online' && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-[#7a0b10]"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-[14px] leading-tight mb-2 ${paymentMethod === 'stripe_online' ? 'text-[#1a1a1a]' : 'text-[#4b5563]'}`}>
                  Pay with Card / Mobile Wallets
                </h4>
                <div className="flex gap-2 items-center">
                  <Lock className="w-3.5 h-3.5 text-[#15803d]" />
                  <span className="text-[12px] text-[#15803d] font-bold">100% Secure via Stripe</span>
                </div>
              </div>
            </button>

          </div>

          {isPaymentMethodLockedByCoupon && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[13px] font-bold mt-4 animate-in slide-in-from-top-2 duration-300">
              <Lock className="h-4 w-4 shrink-0" />
              <span>
                The applied coupon ({appliedCouponData?.code}) is only valid for {appliedCouponData?.allowedPaymentMethods?.join(', ')} payments. Please change your payment method or remove the coupon to continue.
              </span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 mt-4 border-t border-[#e5e7eb]">
            <button 
              type="button"
              onClick={onBack} 
              className="w-full sm:w-auto font-bold text-[14px] text-[#7a0b10] bg-[#ffffff] border border-[#e5e7eb] hover:bg-[#fffaf9] hover:border-[#7a0b10] py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 ll-interactive ll-focus-ring"
            >
              <span>&larr;</span> Back to Cart
            </button>
            <button
              type="button"
              onClick={() => {
                let finalPaymentMethod = paymentMethod;
                let savedCardId = undefined;
                if (paymentMethod.startsWith('saved_card_')) {
                  savedCardId = paymentMethod.replace('saved_card_', '');
                  finalPaymentMethod = 'saved_card';
                }
                onContinue({ paymentMethod: finalPaymentMethod, savedCardId });
              }}
              disabled={(orderType === 'delivery' && quoteError) || isPaymentMethodLockedByCoupon}
              className={`w-full sm:w-auto font-bold text-[14px] text-[#ffffff] py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-sm ${
                (orderType === 'delivery' && quoteError) || isPaymentMethodLockedByCoupon ? 'bg-[#9ca3af] cursor-not-allowed' : 'bg-[#7a0b10] hover:bg-[#5a080c] ll-interactive ll-focus-ring'
              }`}
            >
              Review Order <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-[14px] font-sans flex items-start justify-between mt-4 animate-in fade-in duration-200">
          <p className="font-medium text-[#1a1a1a] flex items-center gap-2">
            <span className="text-[#6b7280]">Payment Method:</span>
            {paymentMethod.startsWith('saved_card_') 
              ? `${user?.savedCards?.find(c => `saved_card_${c._id}` === paymentMethod)?.title || 'Saved Card'} (${user?.savedCards?.find(c => `saved_card_${c._id}` === paymentMethod)?.brand || 'Card'} •••• ${user?.savedCards?.find(c => `saved_card_${c._id}` === paymentMethod)?.last4 || '****'})`
              : paymentMethod === 'stripe_online' 
                ? 'Card / Mobile Wallets (Secure Stripe)' 
                : paymentMethod}
          </p>
        </div>
      )}
    </div>
  );
}