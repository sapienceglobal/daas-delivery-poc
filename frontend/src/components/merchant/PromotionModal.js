import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { couponAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import PremiumDatePicker from '@/components/ui/PremiumDatePicker';

// Helper to format any date or Date object to local YYYY-MM-DD string without UTC shift
const formatDateToYMD = (dateVal) => {
  if (!dateVal) return '';
  if (dateVal instanceof Date) {
    const year = dateVal.getFullYear();
    const month = String(dateVal.getMonth() + 1).padStart(2, '0');
    const day = String(dateVal.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof dateVal === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) return dateVal;
    if (dateVal.includes('T00:00:00')) {
      return dateVal.split('T')[0];
    }
  }
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to parse YYYY-MM-DD string to local Date object without timezone shift
const parseYMDToDate = (ymdStr) => {
  if (!ymdStr) return null;
  if (ymdStr instanceof Date) return ymdStr;
  if (typeof ymdStr === 'string') {
    const cleanStr = ymdStr.includes('T') ? ymdStr.split('T')[0] : ymdStr;
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
  }
  const d = new Date(ymdStr);
  return isNaN(d.getTime()) ? null : d;
};

// Convert local YYYY-MM-DD to ISO string at start of local day (00:00:00)
const getStartOfDayISO = (ymdStr) => {
  if (!ymdStr) return new Date().toISOString();
  const cleanStr = typeof ymdStr === 'string' && ymdStr.includes('T') ? ymdStr.split('T')[0] : ymdStr;
  const parts = String(cleanStr).split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d, 0, 0, 0, 0).toISOString();
    }
  }
  return new Date(ymdStr).toISOString();
};

// Convert local YYYY-MM-DD to ISO string at end of local day (23:59:59.999)
const getEndOfDayISO = (ymdStr) => {
  if (!ymdStr) return '';
  const cleanStr = typeof ymdStr === 'string' && ymdStr.includes('T') ? ymdStr.split('T')[0] : ymdStr;
  const parts = String(cleanStr).split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d, 23, 59, 59, 999).toISOString();
    }
  }
  return new Date(ymdStr).toISOString();
};

export default function PromotionModal({ isOpen, onClose, onSuccess, editPromo = null, defaultPromoType = 'Coupon' }) {
  const [mounted, setMounted] = useState(false);
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
    startDate: '',
    endDate: '',
    maxUses: '',
    targetAudience: 'All Users',
    targetGroup: 'Family',
    firstOrderOnly: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // populate data if editing
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
        startDate: editPromo.startDate ? formatDateToYMD(editPromo.startDate) : '',
        endDate: editPromo.endDate ? formatDateToYMD(editPromo.endDate) : '',
        maxUses: editPromo.maxUses || '',
        firstOrderOnly: editPromo.firstOrderOnly || false
      });
    } else {
      setFormData({
        code: '', name: '', description: '', promoType: defaultPromoType,
        type: 'percentage', value: '', minCartValue: '', minOrdersRequired: '',
        allowedPaymentMethods: 'All', startDate: '', endDate: '', maxUses: '', targetAudience: 'All Users', targetGroup: 'Family', firstOrderOnly: false
      });
      setErrors({});
    }
  }, [editPromo, isOpen, defaultPromoType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'firstOrderOnly' && checked) {
        newData.minOrdersRequired = ''; // Reset min past orders when first time only is checked
      }
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // custom Validation
    const newErrors = {};
    if (!formData.code) newErrors.code = "Coupon code is required.";
    if (!formData.value) newErrors.value = "Discount value is required.";
    if (!formData.endDate) newErrors.endDate = "Expiry date is required.";
    if (formData.description && formData.description.length > 250) {
      newErrors.description = "Description cannot exceed 250 characters.";
    }

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
        startDate: formData.startDate ? getStartOfDayISO(formData.startDate) : new Date().toISOString(),
        endDate: getEndOfDayISO(formData.endDate),
        maxUses: formData.maxUses ? Number(formData.maxUses) : null,
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

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
      <div
        className={`bg-admin-surface text-admin-text rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-admin-border transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 sm:py-5 border-b border-admin-border flex items-center justify-between bg-admin-surface">
          <h2 className="text-base sm:text-lg font-bold font-heading text-admin-text">{editPromo ? 'Edit Promotion' : 'Create Promotion'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-admin-surface-light rounded-xl transition-colors text-admin-text-secondary hover:text-admin-text cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar">
          <form id="promoForm" onSubmit={handleSubmit} noValidate className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Coupon Code *</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text uppercase outline-none focus:border-brand transition-colors"
                  placeholder="e.g. SUMMER30"
                />
                {errors.code && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.code}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Promo Type</label>
                <select
                  name="promoType"
                  value={formData.promoType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand cursor-pointer transition-colors"
                >
                  <option value="Coupon">Coupon</option>
                  <option value="Offer">Offer</option>
                  <option value="Seasonal Offer">Seasonal Offer</option>
                  <option value="Combo Offer">Combo Offer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand transition-colors"
                placeholder="e.g. Summer Special 30% Off"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Discount Type *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand cursor-pointer transition-colors"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Value *</label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand transition-colors"
                  placeholder={formData.type === 'percentage' ? 'e.g. 30' : 'e.g. 10'}
                />
                {errors.value && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.value}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Min. Cart Value</label>
                <input
                  type="number"
                  name="minCartValue"
                  value={formData.minCartValue}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand transition-colors"
                  placeholder="e.g. 20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Min. Past Orders</label>
                <input
                  type="number"
                  name="minOrdersRequired"
                  value={formData.minOrdersRequired}
                  onChange={handleChange}
                  disabled={formData.firstOrderOnly}
                  className={`w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none transition-colors ${formData.firstOrderOnly ? 'bg-admin-surface opacity-50 cursor-not-allowed' : 'focus:border-brand'}`}
                  placeholder={formData.firstOrderOnly ? "N/A" : "e.g. 5 (0 for all)"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Start Date</label>
                <PremiumDatePicker
                  selected={parseYMDToDate(formData.startDate) || (editPromo ? null : new Date())}
                  onChange={(d) => setFormData(prev => ({ ...prev, startDate: formatDateToYMD(d) }))}
                  className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand cursor-pointer transition-colors"
                  placeholderText="Start date (Today)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Expiry Date *</label>
                <PremiumDatePicker
                  selected={parseYMDToDate(formData.endDate)}
                  onChange={(d) => setFormData(prev => ({ ...prev, endDate: formatDateToYMD(d) }))}
                  className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand cursor-pointer transition-colors"
                  placeholderText="Select expiry date"
                  minDate={new Date()}
                />
                {errors.endDate && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.endDate}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Required Payment</label>
              <select
                name="allowedPaymentMethods"
                value={formData.allowedPaymentMethods}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand cursor-pointer transition-colors"
              >
                <option value="All">All Methods</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Apple Pay">Apple Pay</option>
                <option value="Cash on Delivery">Cash on Delivery</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Target Audience</label>
                <select 
                  name="targetAudience" 
                  value={formData.targetAudience} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand cursor-pointer transition-colors"
                >
                  <option value="All Users">All Users</option>
                  <option value="Specific Group">Specific Group</option>
                </select>
              </div>
              {formData.targetAudience === 'Specific Group' && (
                <div>
                  <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Select Group</label>
                  <select 
                    name="targetGroup" 
                    value={formData.targetGroup} 
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand cursor-pointer transition-colors"
                  >
                    <option value="Family">Family</option>
                    <option value="Friends">Friends</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Max Uses (Limit)</label>
                <input
                  type="number"
                  name="maxUses"
                  value={formData.maxUses}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand transition-colors"
                  placeholder="e.g. 100 (blank for unlimited)"
                  min="1"
                />
              </div>
              <div className="flex items-center mt-5">
                <input
                  type="checkbox"
                  name="firstOrderOnly"
                  id="firstOrderOnly"
                  checked={formData.firstOrderOnly}
                  onChange={handleChange}
                  className="w-4 h-4 text-brand border-admin-border rounded accent-brand cursor-pointer"
                />
                <label htmlFor="firstOrderOnly" className="ml-2 block text-xs font-bold text-admin-text cursor-pointer">
                  First Time Customers Only
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-admin-text mb-1 uppercase tracking-wider">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                maxLength={250}
                rows={3}
                className="w-full px-3 py-2 bg-admin-surface-light border border-admin-border rounded-xl text-xs sm:text-sm text-admin-text outline-none focus:border-brand custom-scrollbar resize-none transition-colors"
                placeholder="Brief details about the offer (e.g. terms, items covered)..."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.description ? (
                  <p className="text-rose-500 text-xs font-bold">{errors.description}</p>
                ) : <span />}
                <p className="text-[10px] text-admin-text-secondary text-right">
                  {formData.description?.length || 0}/250 characters
                </p>
              </div>
            </div>

          </form>
        </div>

        <div className="px-6 py-4 border-t border-admin-border flex justify-end gap-3 bg-admin-surface-light shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-admin-text bg-admin-surface border border-admin-border hover:bg-admin-surface-light transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="promoForm"
            disabled={loading}
            className="px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-brand hover:brightness-110 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {loading ? 'Saving...' : editPromo ? 'Update Promotion' : 'Create Promotion'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
