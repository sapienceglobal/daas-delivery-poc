import { Modal } from '@/components/ui';
import StripeProvider from '@/components/payment/StripeProvider';
import CheckoutForm from '@/components/payment/CheckoutForm';

/**
 * PaymentSimulatorModal — secure Stripe Elements modal for online checkout.
 */
export default function PaymentSimulatorModal({ isOpen, onClose, amount, checkoutData, onSuccess }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Secure Payment">
      <div className="py-2 font-sans">
        {isOpen && (
          <StripeProvider amount={amount} checkoutData={checkoutData}>
            <CheckoutForm amount={amount} onSuccess={onSuccess} onCancel={onClose} />
          </StripeProvider>
        )}
      </div>
    </Modal>
  );
}
