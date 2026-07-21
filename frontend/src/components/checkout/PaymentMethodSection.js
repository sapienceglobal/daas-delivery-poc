'use client';
import { CreditCard, Check, HelpCircle, Lock, Smartphone } from 'lucide-react';
import { showToast } from '@/components/ui';

export default function PaymentMethodSection({
  step, setStep,
  paymentMethod, setPaymentMethod,
  cardNo, setCardNo, cardExpiry, setCardExpiry, cardCvv, setCardCvv, cardName, setCardName,
  onBack, onContinue,
  orderType, quoteError, user
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
                  <h4 className={`font-bold text-[14px] leading-tight mb-[10px] capitalize ${paymentMethod === `saved_card_${card._id}` ? 'text-[#1a1a1a]' : 'text-[#4b5563]'}`}>
                    {card.brand} •••• {card.last4}
                  </h4>
                  <p className="text-[12px] text-[#6b7280]">Expires {card.expMonth.toString().padStart(2, '0')}/{card.expYear}</p>
                </div>
              </button>
            ))}

            {/* 1. CREDIT / DEBIT CARD */}
            <button
              type="button"
              onClick={() => setPaymentMethod('credit_card')}
              className={`flex items-start text-left gap-[14px] rounded-xl p-4 border relative overflow-hidden h-[94px] ll-interactive ll-focus-ring ${
                paymentMethod === 'credit_card' ? 'border-[#7a0b10] bg-[#fffaf9]' : 'border-[#e5e7eb] bg-[#ffffff] hover:border-[#d1d5db]'
              }`}
            >
              {/* Checkmark Pin styling matching image */}
              <div className="relative shrink-0 mt-[2px]">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center relative z-10 ${
                  paymentMethod === 'credit_card' ? 'bg-[#7a0b10] text-[#ffffff]' : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#d1d5db]'
                }`}>
                  <Check className="w-3 h-3" strokeWidth={4} />
                </div>
                {paymentMethod === 'credit_card' && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-[#7a0b10]"></div>
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-[14px] leading-tight mb-2 ${paymentMethod === 'credit_card' ? 'text-[#1a1a1a]' : 'text-[#4b5563]'}`}>
                  Credit / Debit Card
                </h4>
                {/* Brand Logos */}
                <div className="flex gap-2 items-center">
                  <div className="bg-[#ffffff] rounded px-1.5 h-5 flex items-center justify-center">
                    <span className="font-black italic text-[13px] text-[#1434CB] tracking-tighter leading-none">VISA</span>
                  </div>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-5 w-auto object-contain bg-[#ffffff] rounded px-[2px]" alt="Mastercard" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg" className="h-5 w-auto object-contain bg-[#ffffff] rounded px-[2px]" alt="Amex" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/57/Discover_Card_logo.svg" className="h-4 w-auto object-contain bg-[#ffffff] rounded px-[2px]" alt="Discover" />
                </div>
              </div>
            </button>

            {/* 2. APPLE PAY */}
            <button
              type="button"
              onClick={() => setPaymentMethod('apple_pay')}
              className={`flex items-start text-left gap-[14px] rounded-xl p-4 border relative overflow-hidden h-[94px] ll-interactive ll-focus-ring ${
                paymentMethod === 'apple_pay' ? 'border-[#7a0b10] bg-[#fffaf9]' : 'border-[#e5e7eb] bg-[#ffffff] hover:border-[#d1d5db]'
              }`}
            >
              <div className="relative shrink-0 mt-[2px]">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center relative z-10 ${
                  paymentMethod === 'apple_pay' ? 'bg-[#7a0b10] text-[#ffffff]' : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#d1d5db]'
                }`}>
                  <Check className="w-3 h-3" strokeWidth={4} />
                </div>
                {paymentMethod === 'apple_pay' && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-[#7a0b10]"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-[14px] leading-tight mb-[10px] ${paymentMethod === 'apple_pay' ? 'text-[#1a1a1a]' : 'text-[#4b5563]'}`}>
                  Apple Pay
                </h4>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" className="h-5 w-auto object-contain bg-[#ffffff] rounded px-[2px]" alt="ApplePay" />
              </div>
            </button>

            {/* 3. GOOGLE PAY */}
            <button
              type="button"
              onClick={() => setPaymentMethod('google_pay')}
              className={`flex items-start text-left gap-[14px] rounded-xl p-4 border relative overflow-hidden h-[94px] ll-interactive ll-focus-ring ${
                paymentMethod === 'google_pay' ? 'border-[#7a0b10] bg-[#fffaf9]' : 'border-[#e5e7eb] bg-[#ffffff] hover:border-[#d1d5db]'
              }`}
            >
              <div className="relative shrink-0 mt-[2px]">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center relative z-10 ${
                  paymentMethod === 'google_pay' ? 'bg-[#7a0b10] text-[#ffffff]' : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#d1d5db]'
                }`}>
                  <Check className="w-3 h-3" strokeWidth={4} />
                </div>
                {paymentMethod === 'google_pay' && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-[#7a0b10]"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-[14px] leading-tight mb-[10px] ${paymentMethod === 'google_pay' ? 'text-[#1a1a1a]' : 'text-[#4b5563]'}`}>
                  Google Pay
                </h4>
                <div className="flex gap-[10px] items-center">
                  <Smartphone className="h-4 w-4 text-[#4b5563]" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="h-4 w-auto object-contain bg-[#ffffff] rounded px-[2px]" alt="Google Pay" />
                </div>
              </div>
            </button>

          </div>

          <form 
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              
              if (paymentMethod === 'credit_card') {
                if (!cardNo || cardNo.length < 16) {
                  return showToast('Please enter a valid 16-digit card number', 'error');
                }
                if (!cardExpiry || cardExpiry.length < 5) {
                  return showToast('Please enter a valid expiry date (MM/YY)', 'error');
                }
                if (!cardCvv || cardCvv.length < 3) {
                  return showToast('Please enter a valid CVV', 'error');
                }
                if (!cardName.trim()) {
                  return showToast('Please enter the name on the card', 'error');
                }
              }

              let finalPaymentMethod = paymentMethod;
              // Pass the selected saved card id if one is selected
              if (paymentMethod.startsWith('saved_card_')) {
                const savedCardId = paymentMethod.replace('saved_card_', '');
                finalPaymentMethod = 'saved_card';
                onContinue({ paymentMethod: finalPaymentMethod, savedCardId, cardNo, cardExpiry, cardCvv, cardName });
              } else {
                onContinue({ paymentMethod: finalPaymentMethod, cardNo, cardExpiry, cardCvv, cardName });
              }
            }}
          >
            <div className={`ll-collapsible ${paymentMethod === 'credit_card' ? 'll-collapsible--open' : ''}`} style={paymentMethod === 'credit_card' ? {marginTop: '1rem'} : {}}>
              <div className="overflow-hidden">
                <div className="space-y-4 pb-2 pt-1">
                <div>
                  <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Card Number*</label>
                  <div className="relative">
                    <input
                      type="text" 
                      required 
                      name="cardNo"
                      autoComplete="cc-number"
                      maxLength={19} 
                      value={cardNo}
                      onChange={(e) => setCardNo(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                      placeholder="1234 5678 9012 3456"
                      className="w-full rounded-lg border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#ffffff_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#1a1a1a]"
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                  </div>
                </div>

                {/* 1:1:2 Grid format to match the image precisely */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Expiry Date*</label>
                    <input
                      type="text" 
                      required 
                      name="cardExpiry"
                      autoComplete="cc-exp"
                      maxLength={5} 
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/g, '$1/'))}
                      placeholder="MM / YY"
                      className="w-full rounded-lg border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#ffffff_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#1a1a1a]"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">CVV*</label>
                    <div className="relative">
                      <input
                        type="password" 
                        required 
                        name="cardCvv"
                        autoComplete="cc-csc"
                        maxLength={3} 
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        className="w-full rounded-lg border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#ffffff_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#1a1a1a]"
                      />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 group z-20">
                        <HelpCircle className="w-4 h-4 cursor-help text-[#9ca3af] hover:text-[#1a1a1a] transition-colors" />
                        <div className="absolute right-[-4px] bottom-full mb-2 w-48 p-2.5 bg-[#1a1a1a] text-white text-[11px] leading-tight font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 z-50 text-center">
                          3-digit security code usually found on the back of your card.
                          <div className="absolute top-full right-[8px] -mt-px border-4 border-transparent border-t-[#1a1a1a]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[13px] font-bold text-[#1a1a1a] mb-1.5">Cardholder Name*</label>
                    <input
                      type="text" 
                      required 
                      name="cardName"
                      autoComplete="cc-name"
                      value={cardName} 
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="Name on card"
                      className="w-full rounded-lg border border-[#e5e7eb] bg-[#ffffff] text-[#1a1a1a] placeholder-[#9ca3af] px-4 py-3 text-sm focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#ffffff_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#1a1a1a]"
                    />
                  </div>
                </div>

                {/* Security Banner */}
                <div className="flex items-center gap-2.5 p-3.5 bg-[#f0fdf4] rounded-lg text-[#15803d] text-[13px] font-bold mt-2">
                  <Lock className="h-4 w-4 shrink-0 fill-current" />
                  <span>Your payment information is 100% secure and encrypted.</span>
                </div>
              </div>
            </div>
            </div>

            <div className="flex items-center justify-between pt-6 mt-2 border-t border-[#e5e7eb]">
              <button 
                type="button"
                onClick={onBack} 
                className="font-bold text-[14px] text-[#7a0b10] bg-[#ffffff] border border-[#e5e7eb] hover:bg-[#fffaf9] hover:border-[#7a0b10] py-2.5 px-6 rounded-lg flex items-center gap-2 ll-interactive ll-focus-ring"
              >
                <span>&larr;</span> Back to Cart
              </button>
              {!(orderType === 'delivery' && quoteError) ? (
                <button
                  type="submit"
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
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="text-[14px] font-sans flex items-start justify-between mt-4 animate-in fade-in duration-200">
          <p className="font-medium text-[#1a1a1a] flex items-center gap-2">
            <span className="text-[#6b7280]">Payment Method:</span>
            {paymentMethod.startsWith('saved_card_') 
              ? `Saved Card (${user?.savedCards?.find(c => `saved_card_${c._id}` === paymentMethod)?.brand || 'Card'} •••• ${user?.savedCards?.find(c => `saved_card_${c._id}` === paymentMethod)?.last4 || '****'})`
              : paymentMethod === 'credit_card' 
                ? `Credit / Debit Card (*${cardNo.slice(-4)})` 
                : paymentMethod === 'apple_pay' ? 'Apple Pay' : 'Google Pay'}
          </p>
        </div>
      )}
    </div>
  );
}