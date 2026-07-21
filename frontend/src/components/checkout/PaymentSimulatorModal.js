import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock } from 'lucide-react';
import StripeProvider from '@/components/payment/StripeProvider';
import CheckoutForm from '@/components/payment/CheckoutForm';

/**
 * PaymentSimulatorModal — secure Stripe Elements modal for online checkout.
 */
export default function PaymentSimulatorModal({ isOpen, onClose, amount, checkoutData, onSuccess }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-[#ffffff] border border-[#e5e7eb] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ll-slide-panel">
        <div className="bg-[#fffcfb] border-b border-[#e5e7eb] px-6 py-4 flex items-center justify-between">
          <h2 className="text-[20px] font-bold font-serif text-[#7a0b10] flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Secure Payment
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-[#9ca3af] hover:text-[#1a1a1a] hover:bg-[#f3f4f6] transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin ll-soft-scroll font-sans bg-[#fdfcfb]">
          <StripeProvider amount={amount} checkoutData={checkoutData}>
            <CheckoutForm amount={amount} onSuccess={onSuccess} onCancel={onClose} />
          </StripeProvider>
        </div>
      </div>
    </div>,
    document.body
  );
}
