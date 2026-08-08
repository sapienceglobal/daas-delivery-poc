import React, { useState } from 'react';
import { X } from 'lucide-react';
import { couponAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function PromotionModal({ isOpen, onClose, onSuccess, editPromo = null, defaultPromoType = 'Coupon' }) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    promoType: 'Coupon',
    type: 'percentage',
    value: '',
    minCartValue: '',
    minOrdersRequired: '',
    allowedPaymentMethods: 'All',
    endDate: '',
    targetAudience: 'All Users',
    targetGroup: 'Family'
  });

  // Populate data if editing
  React.useEffect(() => {
    if (editPromo && isOpen) {
      setFormData({
        code: editPromo.code || '',
        name: editPromo.name || '',
        description: editPromo.description || '',
        promoType: editPromo.promoType || 'Coupon',
        type: editPromo.type || 'percentage',
        value: editPromo.value || '',
        minCartValue: editPromo.minCartValue || '',
        minOrdersRequired: editPromo.minOrdersRequired || '',
        allowedPaymentMethods: editPromo.allowedPaymentMethods?.[0] || 'All',
        endDate: editPromo.endDate ? new Date(editPromo.endDate).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        code: '', name: '', description: '', promoType: defaultPromoType,
        type: 'percentage', value: '', minCartValue: '', minOrdersRequired: '',
        allowedPaymentMethods: 'All', endDate: '', targetAudience: 'All Users', targetGroup: 'Family'
      });
      setErrors({});
    }
  }, [editPromo, isOpen, defaultPromoType]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Custom Validation
    const newErrors = {};
    if (!formData.code) newErrors.code = "Coupon code is required.";
    if (!formData.value) newErrors.value = "Discount value is required.";
    if (!formData.endDate) newErrors.endDate = "Expiry date is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      const payload = {
        ...formData,
        value: Number(formData.value),
        minCartValue: formData.minCartValue ? Number(formData.minCartValue) : 0,
        minOrdersRequired: formData.minOrdersRequired ? Number(formData.minOrdersRequired) : 0,
        allowedPaymentMethods: formData.allowedPaymentMethods === 'All' ? ['All'] : [formData.allowedPaymentMethods],
        endDate: new Date(formData.endDate).toISOString(),
        targetGroup: formData.targetAudience === 'All Users' ? 'All Users' : formData.targetGroup
      };

      if (editPromo) {
        await couponAPI.update(editPromo._id, payload);
        showToast('Promotion updated successfully!', 'success');
      } else {
        await couponAPI.create(payload);
        showToast('Promotion created successfully!', 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save promotion', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/10 backdrop-blur-[2px] transition-all duration-300" onClick={onClose}>
      <div
        className="bg-white rounded-[24px] w-full max-w-lg overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col max-h-[90vh] border border-[#e5e7eb] transform transition-all duration-300 animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-[#111827]">{editPromo ? 'Edit Promotion' : 'Create Promotion'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="promoForm" onSubmit={handleSubmit} noValidate className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Coupon Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] uppercase outline-none focus:border-[#8b0000]"
                  placeholder="e.g. SUMMER30"
                />
                {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Promo Type</label>
                <select
                  name="promoType"
                  value={formData.promoType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] outline-none focus:border-[#8b0000]"
                >
                  <option value="Coupon">Coupon</option>
                  <option value="Offer">Offer</option>
                  <option value="Seasonal Offer">Seasonal Offer</option>
                  <option value="Combo Offer">Combo Offer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#374151] mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] outline-none focus:border-[#8b0000]"
                placeholder="e.g. Summer Special 30% Off"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Discount Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] outline-none focus:border-[#8b0000]"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Value *</label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] outline-none focus:border-[#8b0000]"
                  placeholder={formData.type === 'percentage' ? 'e.g. 30' : 'e.g. 10'}
                />
                {errors.value && <p className="text-red-500 text-xs mt-1">{errors.value}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Min. Cart Value</label>
                <input
                  type="number"
                  name="minCartValue"
                  value={formData.minCartValue}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] outline-none focus:border-[#8b0000]"
                  placeholder="e.g. 20"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Min. Past Orders</label>
                <input
                  type="number"
                  name="minOrdersRequired"
                  value={formData.minOrdersRequired}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] outline-none focus:border-[#8b0000]"
                  placeholder="e.g. 5 (0 for all)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Required Payment</label>
                <select
                  name="allowedPaymentMethods"
                  value={formData.allowedPaymentMethods}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] outline-none focus:border-[#8b0000]"
                >
                  <option value="All">All Methods</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Expiry Date *</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] outline-none focus:border-[#8b0000]"
                />
                {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#374151] mb-1">Target Audience</label>
                <select 
                  name="targetAudience" 
                  value={formData.targetAudience} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] outline-none focus:border-[#8b0000]"
                >
                  <option value="All Users">All Users</option>
                  <option value="Specific Group">Specific Group</option>
                </select>
              </div>
              {formData.targetAudience === 'Specific Group' && (
                <div>
                  <label className="block text-[12px] font-bold text-[#374151] mb-1">Select Group</label>
                  <select 
                    name="targetGroup" 
                    value={formData.targetGroup} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] outline-none focus:border-[#8b0000]"
                  >
                    <option value="Family">Family</option>
                    <option value="Friends">Friends</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#374151] mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 bg-white border border-[#d1d5db] rounded-lg text-[13px] text-[#1f2937] outline-none focus:border-[#8b0000]"
                placeholder="Brief details about the offer..."
              />
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-[#e5e7eb] flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="promoForm"
            disabled={loading}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-[#8b0000] hover:bg-[#7f0000] transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {loading ? 'Saving...' : editPromo ? 'Update Promotion' : 'Create Promotion'}
          </button>
        </div>

      </div>
    </div>
  );
}
