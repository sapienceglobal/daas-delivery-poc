'use client';

import { useState } from 'react';
import { X, Loader2, CreditCard } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function PaymentModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  
  // Simulated Card Input
  const [formData, setFormData] = useState({
    cardNumber: '',
    expDate: '',
    cvc: '',
    name: '',
    isDefault: false
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.cardNumber || formData.cardNumber.replace(/\D/g, '').length < 16) {
        throw new Error('Please enter a valid 16-digit card number');
      }

      if (!formData.expDate || formData.expDate.length < 5) {
        throw new Error('Please enter a valid expiry date (MM/YY)');
      }

      if (!formData.cvc || formData.cvc.length < 3) {
        throw new Error('Please enter a valid CVV');
      }

      if (!formData.name || formData.name.trim().length === 0) {
        throw new Error('Please enter the name on the card');
      }

      const last4 = formData.cardNumber.replace(/\D/g, '').slice(-4);
      const [expMonth, expYear] = formData.expDate.split('/').map(n => parseInt(n.trim(), 10));

      if (!expMonth || !expYear || expMonth < 1 || expMonth > 12) {
        throw new Error('Invalid expiration month (1-12)');
      }

      // Determine brand based on first digit (mock)
      const firstDigit = formData.cardNumber.charAt(0);
      let brand = 'Visa';
      if (firstDigit === '5') brand = 'Mastercard';
      if (firstDigit === '3') brand = 'Amex';
      if (firstDigit === '6') brand = 'Discover';

      // Send to backend
      await authAPI.addCard({
        cardId: `tok_mock_${Date.now()}`,
        brand,
        last4,
        expMonth,
        expYear,
        isDefault: formData.isDefault
      });

      showToast('Card added successfully', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save card', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.substring(0, 16);
    // Add spaces every 4 digits
    val = val.replace(/(\d{4})(?=\d)/g, '$1 ');
    setFormData({ ...formData, cardNumber: val });
  };

  const handleExpChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    val = val.substring(0, 4);
    if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4);
    }
    setFormData({ ...formData, expDate: val });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-[0_0_40px_rgba(0,0,0,0.15)] border-2 border-[#eadfdb] ring-4 ring-[#eadfdb]/30 overflow-hidden animate-scale-in">
        <div className="px-6 py-4 border-b border-[#eadfdb] flex items-center justify-between">
          <h2 className="text-[20px] font-black text-[#1a1a1a]">Add New Card</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 bg-[#f4f7f9] border-b border-[#eadfdb]">
          <div className="flex items-center gap-3 text-[#0ea5e9]">
            <CreditCard className="h-5 w-5" />
            <p className="text-[13px] font-bold">This is a secure, encrypted mock connection for testing purposes.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          <div>
            <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Name on Card</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-[#f9f9f9] outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Card Number</label>
            <input
              type="text"
              required
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-[#f9f9f9] outline-none font-mono"
              placeholder="0000 0000 0000 0000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Expiration</label>
              <input
                type="text"
                required
                value={formData.expDate}
                onChange={handleExpChange}
                className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-[#f9f9f9] outline-none font-mono"
                placeholder="MM/YY"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#4b5563] mb-1">CVC</label>
              <input
                type="text"
                required
                maxLength="4"
                value={formData.cvc}
                onChange={(e) => setFormData({ ...formData, cvc: e.target.value.replace(/\D/g, '') })}
                className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-[#f9f9f9] outline-none font-mono"
                placeholder="123"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none pt-2">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-5 h-5 rounded border-[#eadfdb] text-[#7a0b10] focus:ring-[#7a0b10]"
            />
            <span className="text-[13px] font-bold text-[#4b5563]">Set as default payment method</span>
          </label>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#eadfdb]">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 h-11 rounded-lg border border-[#eadfdb] text-[#4b5563] text-[13px] font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-8 h-11 rounded-lg bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
