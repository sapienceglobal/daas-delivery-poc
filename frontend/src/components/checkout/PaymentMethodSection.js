'use client';
import { CreditCard, Check, HelpCircle, Lock, Smartphone } from 'lucide-react';

export default function PaymentMethodSection({
  step, setStep,
  paymentMethod, setPaymentMethod,
  cardNo, setCardNo, cardExpiry, setCardExpiry, cardCvv, setCardCvv, cardName, setCardName,
  onBack, onContinue,
  orderType, quoteError,
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
            
            {/* 1. CREDIT / DEBIT CARD */}
            <button
              type="button"
              onClick={() => setPaymentMethod('credit_card')}
              className={`flex items-start text-left gap-3.5 rounded-xl p-4 border relative overflow-hidden h-[94px] ll-interactive ll-focus-ring ${
                paymentMethod === 'credit_card' ? 'border-[#7a0b10] bg-[#fffaf9]' : 'border-[#e5e7eb] bg-[#ffffff] hover:border-[#d1d5db]'
              }`}
            >
              {/* Checkmark Pin styling matching image */}
              <div className="relative shrink-0 mt-0.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center relative z-10 ${
                  paymentMethod === 'credit_card' ? 'bg-[#7a0b10] text-[#ffffff]' : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#d1d5db]'
                }`}>
                  <Check className="w-3 h-3" strokeWidth={4} />
                </div>
                {paymentMethod === 'credit_card' && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-[#7a0b10]"></div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-[14px] leading-tight mb-2.5 ${paymentMethod === 'credit_card' ? 'text-[#1a1a1a]' : 'text-[#4b5563]'}`}>
                  Credit / Debit Card
                </h4>
                {/* Brand Logos */}
                <div className="flex gap-2 items-center">
                  <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c.svg" className="h-5 w-auto object-contain bg-[#ffffff] rounded px-0.5" alt="Visa" />
                  <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d88421.svg" className="h-5 w-auto object-contain bg-[#ffffff] rounded px-0.5" alt="Mastercard" />
                  <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a22353c.svg" className="h-5 w-auto object-contain bg-[#ffffff] rounded px-0.5" alt="Amex" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Discover_Card_logo.svg" className="h-5 w-auto object-contain bg-[#ffffff] rounded px-0.5" alt="Discover" />
                </div>
              </div>
            </button>

            {/* 2. APPLE PAY */}
            <button
              type="button"
              onClick={() => setPaymentMethod('apple_pay')}
              className={`flex items-start text-left gap-3.5 rounded-xl p-4 border relative overflow-hidden h-[94px] ll-interactive ll-focus-ring ${
                paymentMethod === 'apple_pay' ? 'border-[#7a0b10] bg-[#fffaf9]' : 'border-[#e5e7eb] bg-[#ffffff] hover:border-[#d1d5db]'
              }`}
            >
              <div className="relative shrink-0 mt-0.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center relative z-10 ${
                  paymentMethod === 'apple_pay' ? 'bg-[#7a0b10] text-[#ffffff]' : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#d1d5db]'
                }`}>
                  <Check className="w-3 h-3" strokeWidth={4} />
                </div>
                {paymentMethod === 'apple_pay' && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-[#7a0b10]"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-[14px] leading-tight mb-2.5 ${paymentMethod === 'apple_pay' ? 'text-[#1a1a1a]' : 'text-[#4b5563]'}`}>
                  Apple Pay
                </h4>
                <div className="flex gap-2.5 items-center">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Apple_Pay_logo.svg" className="h-4 w-auto object-contain bg-[#ffffff] rounded px-0.5" alt="ApplePay" />
                </div>
              </div>
            </button>

            {/* 3. GOOGLE PAY */}
            <button
              type="button"
              onClick={() => setPaymentMethod('google_pay')}
              className={`flex items-start text-left gap-3.5 rounded-xl p-4 border relative overflow-hidden h-[94px] ll-interactive ll-focus-ring ${
                paymentMethod === 'google_pay' ? 'border-[#7a0b10] bg-[#fffaf9]' : 'border-[#e5e7eb] bg-[#ffffff] hover:border-[#d1d5db]'
              }`}
            >
              <div className="relative shrink-0 mt-0.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center relative z-10 ${
                  paymentMethod === 'google_pay' ? 'bg-[#7a0b10] text-[#ffffff]' : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#d1d5db]'
                }`}>
                  <Check className="w-3 h-3" strokeWidth={4} />
                </div>
                {paymentMethod === 'google_pay' && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-[#7a0b10]"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-[14px] leading-tight mb-2.5 ${paymentMethod === 'google_pay' ? 'text-[#1a1a1a]' : 'text-[#4b5563]'}`}>
                  Google Pay
                </h4>
                <div className="flex gap-2.5 items-center">
                  <Smartphone className="h-4 w-4 text-[#4b5563]" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="h-4 w-auto object-contain bg-[#ffffff] rounded px-0.5" alt="Google Pay" />
                </div>
              </div>
            </button>

          </div>

          {paymentMethod === 'credit_card' && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-200">
              <div>
                <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Card Number*</label>
                <div className="relative">
                  <input
                    type="text" required maxLength={19} value={cardNo}
                    onChange={(e) => setCardNo(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                    placeholder="1234 5678 9012 3456"
                    className="w-full rounded-lg border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                  />
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                </div>
              </div>

              {/* 1:1:2 Grid format to match the image precisely */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Expiry Date*</label>
                  <input
                    type="text" required maxLength={5} value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/'))}
                    placeholder="MM / YY"
                    className="w-full rounded-lg border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">CVV*</label>
                  <div className="relative">
                    <input
                      type="password" required maxLength={3} value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      className="w-full rounded-lg border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                    />
                    <HelpCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer text-[#9ca3af]" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Cardholder Name*</label>
                  <input
                    type="text" required value={cardName} onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on card"
                    className="w-full rounded-lg border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
                  />
                </div>
              </div>

              {/* Security Banner */}
              <div className="flex items-center gap-2.5 p-3.5 bg-[#f0fdf4] rounded-lg text-[#15803d] text-[13px] font-bold mt-2">
                <Lock className="h-4 w-4 shrink-0 fill-current" />
                <span>Your payment information is 100% secure and encrypted.</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 mt-2 border-t border-[#e5e7eb]">
            <button 
              onClick={onBack} 
              className="font-bold text-[14px] text-[#7a0b10] bg-[#ffffff] border border-[#e5e7eb] hover:bg-[#fffaf9] hover:border-[#7a0b10] py-2.5 px-6 rounded-lg flex items-center gap-2 ll-interactive ll-focus-ring"
            >
              <span>&larr;</span> Back to Cart
            </button>
            {!(orderType === 'delivery' && quoteError) ? (
              <button
                type="button"
                onClick={() => onContinue({ paymentMethod, cardNo, cardExpiry, cardCvv, cardName })}
                className="font-bold text-[14px] text-[#ffffff] bg-[#7a0b10] hover:bg-[#5e080c] py-2 px-6 rounded-lg shadow-sm flex items-center gap-2 ll-interactive ll-focus-ring"
              >
                Review Order <span>&rarr;</span>
              </button>
            ) : (
              <span className="text-[13px] font-bold text-[#ef4444] bg-[#fef2f2] border border-[#fca5a5] px-4 py-2.5 rounded-lg select-none">
                Delivery Unavailable
              </span>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-[14px] font-sans flex items-start justify-between mt-4 animate-in fade-in duration-200">
          <p className="font-medium text-[#1a1a1a] flex items-center gap-2">
            <span className="text-[#6b7280]">Payment Method:</span>
            {paymentMethod === 'credit_card' ? `Credit / Debit Card (*${cardNo.slice(-4)})` : paymentMethod === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}
          </p>
        </div>
      )}
    </div>
  );
}
