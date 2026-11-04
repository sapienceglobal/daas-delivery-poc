import { Check } from 'lucide-react';

const STEPS = [
  { num: 1, label: 'Delivery Information' },
  { num: 2, label: 'Payment Method' },
  { num: 3, label: 'Review Order' },
  { num: 4, label: 'Order Confirmed' },
];

export default function CheckoutStepper({ step }) {
  return (
    <div className="py-4 sm:py-6 lg:py-8 bg-[#ffffff] border-b border-[#e5e7eb]">
      <div className="mx-auto max-w-[900px] px-3 sm:px-4">
        <div className="flex items-center justify-between relative">
          {STEPS.map((s, idx) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;

            return (
              <div key={s.num} className="flex-1 flex flex-col items-center relative z-10">
                <div
                  className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-[15px] transition-all shadow-sm ${
                    isActive || isCompleted
                      ? 'bg-[#7a0b10] text-[#ffffff] font-bold'
                      : 'bg-[#ffffff] border border-[#a3a3a3] text-[#1a1a1a] font-medium'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#ffffff]" strokeWidth={3} />
                  ) : (
                    s.num
                  )}
                </div>
                <span
                  className={`text-[10px] sm:text-[13px] mt-1.5 sm:mt-3 text-center tracking-wide ${
                    isActive
                      ? 'text-[#1a1a1a] font-bold'
                      : 'text-[#4b5563] font-medium'
                  }`}
                >
                  {s.label}
                </span>

                {idx < 3 && (
                  <div
                    className={`absolute top-3.5 sm:top-5 left-[calc(50%+14px)] sm:left-[calc(50%+24px)] right-[calc(-50%+14px)] sm:right-[calc(-50%+24px)] border-t-[2px] border-dotted -z-10 ${
                      isCompleted ? 'border-[#7a0b10]' : 'border-[#d1d5db]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
