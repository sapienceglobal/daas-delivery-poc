const fs = require('fs');

const path = 'src/components/checkout/PaymentMethodSection.js';
let content = fs.readFileSync(path, 'utf8');

// Replace the 3 buttons with stripe_online button
const newButton = `
            {/* SECURE STRIPE CHECKOUT */}
            <button
              type="button"
              onClick={() => setPaymentMethod('stripe_online')}
              className={\`flex items-start text-left gap-[14px] rounded-xl p-4 border relative overflow-hidden h-[94px] ll-interactive ll-focus-ring \${
                paymentMethod === 'stripe_online' ? 'border-[#7a0b10] bg-[#fffaf9]' : 'border-[#e5e7eb] bg-[#ffffff] hover:border-[#d1d5db]'
              }\`}
            >
              <div className="relative shrink-0 mt-[2px]">
                <div className={\`w-5 h-5 rounded-full flex items-center justify-center relative z-10 \${
                  paymentMethod === 'stripe_online' ? 'bg-[#7a0b10] text-[#ffffff]' : 'bg-[#f9fafb] border border-[#e5e7eb] text-[#d1d5db]'
                }\`}>
                  <Check className="w-3 h-3" strokeWidth={4} />
                </div>
                {paymentMethod === 'stripe_online' && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[2px] h-8 bg-[#7a0b10]"></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className={\`font-bold text-[14px] leading-tight mb-2 \${paymentMethod === 'stripe_online' ? 'text-[#1a1a1a]' : 'text-[#4b5563]'}\`}>
                  Pay with Card / Mobile Wallets
                </h4>
                <div className="flex gap-2 items-center">
                  <Lock className="w-3.5 h-3.5 text-[#15803d]" />
                  <span className="text-[12px] text-[#15803d] font-bold">100% Secure via Stripe</span>
                </div>
              </div>
            </button>
`;

const buttonsStart = content.indexOf('{/* 1. CREDIT / DEBIT CARD */}');
const buttonsEnd = content.indexOf('</div>', content.indexOf('{/* 3. GOOGLE PAY */}')) + 6;

content = content.substring(0, buttonsStart) + newButton + content.substring(buttonsEnd);

// Replace form with simple button logic
const formStart = content.indexOf('<form');
const step3Index = content.indexOf('{step === 3 && (');
const formEndIndex = content.lastIndexOf('</form>', step3Index);

const newFormReplacement = `
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
              className={\`w-full sm:w-auto font-bold text-[14px] text-[#ffffff] py-2 px-6 rounded-lg flex items-center justify-center gap-2 shadow-sm \${
                (orderType === 'delivery' && quoteError) || isPaymentMethodLockedByCoupon ? 'bg-[#9ca3af] cursor-not-allowed' : 'bg-[#7a0b10] hover:bg-[#5a080c] ll-interactive ll-focus-ring'
              }\`}
            >
              Review Order <span>&rarr;</span>
            </button>
          </div>
`;

content = content.substring(0, formStart) + newFormReplacement + '\n        </div>\n      )}\n\n      ' + content.substring(step3Index);

// Replace the step 3 text
content = content.replace(
  "paymentMethod === 'credit_card' \n                ? `Credit / Debit Card (*${cardNo.slice(-4)})` \n                : paymentMethod === 'apple_pay' ? 'Apple Pay' : 'Google Pay'",
  "paymentMethod === 'stripe_online' ? 'Card / Mobile Wallets (Secure Stripe)' : paymentMethod"
);

fs.writeFileSync(path, content);
console.log('PaymentMethodSection patched successfully');
