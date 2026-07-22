import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button, showToast } from '@/components/ui';

export default function CheckoutForm({ amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Avoids automatic redirect to allow SPA navigation
    });

    if (error) {
      showToast(error.message || 'Payment failed', 'error');
      setLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      showToast('Payment successful!', 'success');
      if (onSuccess) onSuccess(paymentIntent.id);
    } else {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto scrollbar-thin ll-soft-scroll pb-4">
        <PaymentElement />
      </div>
      <div className="flex gap-3 pt-5 mt-2 border-t border-[#e5e7eb] shrink-0">
        <button 
          type="button" 
          onClick={onCancel} 
          className="flex-1 bg-[#ffffff] text-[#7a0b10] border border-[#7a0b10] hover:bg-[#fffaf9] font-bold py-3 rounded-lg text-[14px] transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={!stripe || loading} 
          className="flex-1 bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] font-bold py-3 rounded-lg text-[14px] shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
}
