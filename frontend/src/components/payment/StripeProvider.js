import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';
import { paymentAPI } from '@/lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

export default function StripeProvider({ children, amount, orderId, checkoutData }) {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClientSecret = async () => {
      try {
        setError('');
        setClientSecret('');
        const res = await paymentAPI.createIntent(amount, orderId, checkoutData);
        setClientSecret(res.data?.clientSecret || res.clientSecret);
      } catch (err) {
        console.error('Failed to create payment intent:', err);
        setError(err.message || 'Unable to initialize secure payment');
      }
    };

    if (amount > 0) {
      fetchClientSecret();
    }
  }, [amount, orderId, checkoutData]);

  if (error) {
    return (
      <div className="rounded-xl border border-[#fca5a5] bg-[#fef2f2] p-4 text-center text-sm font-bold text-[#ef4444]">
        {error}
      </div>
    );
  }

  if (!clientSecret) {
    return <div className="p-4 text-center text-sm text-[#6b7280]">Loading secure payment portal...</div>;
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#7a0b10',
        colorBackground: '#ffffff',
        colorText: '#1a1a1a',
        colorDanger: '#EF4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '10px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
}
