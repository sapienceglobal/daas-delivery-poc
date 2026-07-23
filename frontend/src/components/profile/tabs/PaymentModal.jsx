'use client';

import { useState, useEffect } from 'react';
import { X, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { authAPI, paymentAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

function SetupForm({ onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      showToast(error.message || 'Card setup failed', 'error');
      setLoading(false);
    } else if (setupIntent && setupIntent.status === 'succeeded') {
      try {
        const paymentMethodId = setupIntent.payment_method;

        // In a real integration, the backend would expand the payment method or you'd fetch it.
        // For simplicity, we just send the ID. The backend will usually use the Stripe API to get the brand/last4.
        // But since our addCard API expects brand and last4, we can extract it if needed, or pass placeholders 
        // and let the backend fix it. However, to stay compatible with the existing API:

        await authAPI.addCard({
          cardId: paymentMethodId,
          title: title.trim() || 'Personal Card',
          brand: 'Card',
          last4: '****',
          expMonth: 12,
          expYear: 2099,
          isDefault: true
        });

        showToast('Card saved successfully!', 'success');
        if (onSuccess) onSuccess();
        if (onCancel) onCancel(); // Close modal
      } catch (err) {
        showToast(err.message || 'Failed to save card to profile', 'error');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto pb-4 px-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="grid md:grid-cols-2 gap-8 mb-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1a1a1a] mb-1.5">Card Nickname (Optional)</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Personal Card, Business..."
                className="w-full border border-[#eadfdb] rounded-xl px-4 py-3 bg-[#fdfcfb] focus:outline-none focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] transition-colors"
              />
              <p className="text-xs text-[#6b7280] mt-1.5">Give this card a name to easily identify it during checkout.</p>
            </div>
            
            <div className="hidden md:block p-4 bg-[#f8f9fa] rounded-xl border border-[#e5e7eb]">
              <h4 className="font-bold text-[#1a1a1a] text-sm mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#7a0b10]" /> Secure Encryption
              </h4>
              <p className="text-xs text-[#6b7280] leading-relaxed">
                Your payment details are encrypted and securely stored by Stripe. We never see or store your full credit card number.
              </p>
            </div>
          </div>
          
          <div className="md:border-l md:border-[#eadfdb] md:pl-8">
            <PaymentElement />
          </div>
        </div>
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
          className="flex-1 bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] font-bold py-3 rounded-lg text-[14px] shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? 'Processing...' : 'Save Card'}
        </button>
      </div>
    </form>
  );
}

export default function PaymentModal({ isOpen, onClose, onSuccess }) {
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setClientSecret('');
      setError('');

      const initSetup = async () => {
        try {
          const res = await paymentAPI.createSetupIntent();
          setClientSecret(res.data?.clientSecret || res.clientSecret);
        } catch (err) {
          setError(err.message || 'Failed to initialize secure connection');
        }
      };
      initSetup();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#7a0b10',
      colorBackground: '#ffffff',
      colorText: '#1a1a1a',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
    },
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#ffffff] rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.15)] border border-[#eadfdb] overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between bg-[#fdfcfb]">
          <h2 className="text-xl font-bold font-serif text-[#7a0b10] flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Secure Card Setup
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-auto bg-[#ffffff]">
          {error ? (
            <div className="text-red-500 bg-red-50 p-4 rounded-lg text-sm">{error}</div>
          ) : !clientSecret ? (
            <div className="text-center text-gray-500 py-8 animate-pulse">Initializing secure connection...</div>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
              <SetupForm onSuccess={onSuccess} onCancel={onClose} />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
}
