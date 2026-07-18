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
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} disabled={!stripe} className="flex-1">
          Pay ${amount.toFixed(2)}
        </Button>
      </div>
    </form>
  );
}
