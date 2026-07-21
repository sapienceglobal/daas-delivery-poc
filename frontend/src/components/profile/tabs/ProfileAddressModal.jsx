'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function ProfileAddressModal({ isOpen, onClose, addressToEdit, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    label: 'Home',
    address: '',
    isDefault: false
  });

  useEffect(() => {
    if (addressToEdit) {
      setFormData({
        label: addressToEdit.label || 'Home',
        address: addressToEdit.address || '',
        isDefault: addressToEdit.isDefault || false
      });
    } else {
      setFormData({
        label: 'Home',
        address: '',
        isDefault: false
      });
    }
  }, [addressToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const addr = formData.address.trim();
      if (!addr || addr.length < 10) {
        return showToast('Address must be at least 10 characters long', 'error');
      }
      if (!/\d/.test(addr)) {
        return showToast('Please include a street number in your address', 'error');
      }
      if (addressToEdit) {
        await authAPI.editAddress(addressToEdit._id, formData);
        showToast('Address updated successfully', 'success');
      } else {
        await authAPI.addAddress(formData);
        showToast('Address added successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save address', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.15)] border-2 border-[#eadfdb] ring-4 ring-[#eadfdb]/30 overflow-hidden animate-scale-in">
        <div className="px-6 py-4 border-b border-[#eadfdb] flex items-center justify-between">
          <h2 className="text-[20px] font-black text-[#1a1a1a]">
            {addressToEdit ? 'Edit Address' : 'Add New Address'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          <div>
            <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Label</label>
            <div className="flex gap-2">
              {['Home', 'Work', 'Other'].map(lbl => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setFormData({ ...formData, label: lbl })}
                  className={`px-4 h-10 rounded-lg text-[13px] font-bold transition-colors ${
                    formData.label === lbl
                      ? 'bg-[#7a0b10] text-white'
                      : 'bg-[#f9f9f9] text-[#6b7280] border border-[#eadfdb] hover:border-[#b47b80]'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Full Address</label>
            <textarea
              required
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full p-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-[#f9f9f9] outline-none resize-none"
              placeholder="123 Main St, Apt 4B, New York, NY 10001"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-5 h-5 rounded border-[#eadfdb] text-[#7a0b10] focus:ring-[#7a0b10]"
            />
            <span className="text-[13px] font-bold text-[#4b5563]">Set as default address</span>
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
              Save Address
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
