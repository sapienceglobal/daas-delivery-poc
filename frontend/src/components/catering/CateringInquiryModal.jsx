'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Calendar, Users, Phone, Mail, User, FileText } from 'lucide-react';
import { cateringAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import PremiumDatePicker from '@/components/ui/PremiumDatePicker';

export default function CateringInquiryModal({ isOpen, onClose, restaurantId, initialPackage = 'Custom / Unsure' }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    eventType: '',
    eventDate: '',
    guestCount: '',
    packagePreference: initialPackage,
    additionalNotes: ''
  });

  const [errors, setErrors] = useState({});

  if (!isOpen || !mounted) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: false });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.customerName.trim()) newErrors.customerName = true;
    if (!formData.customerEmail.trim()) newErrors.customerEmail = true;
    if (!formData.customerPhone.trim()) newErrors.customerPhone = true;
    if (!formData.eventType.trim()) newErrors.eventType = true;
    if (!formData.eventDate.trim()) newErrors.eventDate = true;
    if (!formData.guestCount || parseInt(formData.guestCount, 10) < 1) newErrors.guestCount = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const inputClass = (fieldName) => 
    `w-full px-3.5 py-2.5 rounded-xl border text-sm bg-admin-surface-light text-admin-text outline-none transition-colors placeholder:text-admin-text-muted ${
      errors[fieldName] 
        ? '!border-rose-500 focus:!border-rose-500 focus:!ring-1 focus:!ring-rose-500' 
        : 'border-admin-border focus:border-brand focus:ring-1 focus:ring-brand'
    }`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const formEl = e.target;
    const finalName = formEl.customerName?.value || formData.customerName;
    const finalEmail = formEl.customerEmail?.value || formData.customerEmail;
    const finalPhone = formEl.customerPhone?.value || formData.customerPhone;
    const finalGuestCount = formEl.guestCount?.value || formData.guestCount;
    const finalEventType = formEl.eventType?.value || formData.eventType;
    const finalEventDate = formEl.eventDate?.value || formData.eventDate;
    const finalPackage = formEl.packagePreference?.value || formData.packagePreference;
    const finalNotes = formEl.additionalNotes?.value || formData.additionalNotes;

    try {
      await cateringAPI.submitInquiry({
        restaurantId,
        customerName: finalName,
        customerEmail: finalEmail,
        customerPhone: finalPhone,
        eventType: finalEventType,
        eventDate: finalEventDate,
        guestCount: parseInt(finalGuestCount, 10),
        packagePreference: finalPackage,
        additionalNotes: finalNotes
      });
      showToast('Catering inquiry submitted! We will contact you soon.', 'success');
      onClose();
    } catch (error) {
      showToast(error.message || 'Failed to submit inquiry', 'error');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      {/* Modal Content */}
      <div className="relative bg-admin-surface border border-admin-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-admin-surface/95 backdrop-blur-md px-6 py-5 border-b border-admin-border flex items-center justify-between z-20">
          <div>
            <h2 className="text-lg sm:text-xl font-black font-heading text-admin-text">New Catering Enquiry</h2>
            <p className="text-xs sm:text-sm text-admin-text-secondary mt-0.5">Fill out the guest details and event requirements.</p>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-admin-surface-light text-admin-text-secondary hover:text-admin-text transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
          {/* Contact Details */}
          <div>
            <h3 className="text-xs font-bold text-admin-text uppercase tracking-wider mb-4 border-b border-admin-border pb-2.5">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="customerName"
                  required
                  value={formData.customerName}
                  onChange={handleChange}
                  className={inputClass('customerName')}
                  placeholder="John Doe"
                />
                {errors.customerName && <p className="text-rose-500 text-[11px] mt-1 font-bold">This field is required.</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="email" 
                  name="customerEmail"
                  required
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className={inputClass('customerEmail')}
                  placeholder="john@example.com"
                />
                {errors.customerEmail && <p className="text-rose-500 text-[11px] mt-1 font-bold">This field is required.</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="tel" 
                  name="customerPhone"
                  required
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className={inputClass('customerPhone')}
                  placeholder="(555) 123-4567"
                />
                {errors.customerPhone && <p className="text-rose-500 text-[11px] mt-1 font-bold">This field is required.</p>}
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h3 className="text-xs font-bold text-admin-text uppercase tracking-wider mb-4 border-b border-admin-border pb-2.5">
              Event Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5">
                  Event Type <span className="text-rose-500">*</span>
                </label>
                <select 
                  name="eventType"
                  required
                  value={formData.eventType}
                  onChange={handleChange}
                  className={inputClass('eventType')}
                >
                  <option value="">Select event type...</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Birthday Party">Birthday Party</option>
                  <option value="Corporate Event">Corporate Event</option>
                  <option value="Family Gathering">Family Gathering</option>
                  <option value="Other">Other</option>
                </select>
                {errors.eventType && <p className="text-rose-500 text-[11px] mt-1 font-bold">This field is required.</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5">
                  Event Date <span className="text-rose-500">*</span>
                </label>
                <PremiumDatePicker 
                  selected={formData.eventDate ? new Date(formData.eventDate + 'T00:00:00') : null}
                  onChange={(date) => {
                    if (date) {
                      setFormData({ ...formData, eventDate: date.toISOString().split('T')[0] });
                      if (errors.eventDate) setErrors({ ...errors, eventDate: false });
                    }
                  }}
                  className={inputClass('eventDate')}
                  minDate={new Date()}
                  placeholderText="Select event date"
                />
                {errors.eventDate && <p className="text-rose-500 text-[11px] mt-1 font-bold">This field is required.</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5">
                  Guest Count <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="number" 
                  name="guestCount"
                  required
                  min="1"
                  value={formData.guestCount}
                  onChange={handleChange}
                  className={inputClass('guestCount')}
                  placeholder="e.g. 50"
                />
                {errors.guestCount && <p className="text-rose-500 text-[11px] mt-1 font-bold">This field is required.</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5">
                  Package Preference
                </label>
                <select 
                  name="packagePreference"
                  value={formData.packagePreference}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-admin-border bg-admin-surface-light text-admin-text text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors"
                >
                  <option value="Basic Package">Basic Package</option>
                  <option value="Premium Package">Premium Package</option>
                  <option value="Deluxe Package">Deluxe Package</option>
                  <option value="Custom / Unsure">Custom / Unsure</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-admin-text-secondary uppercase tracking-wider mb-1.5">
                  Additional Notes
                </label>
                <textarea 
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3.5 rounded-xl border border-admin-border bg-admin-surface-light text-admin-text text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors resize-none placeholder:text-admin-text-muted"
                  placeholder="Tell us about any dietary restrictions, budget expectations, or special requests..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row justify-end gap-3 border-t border-admin-border">
            <button 
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-admin-border text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface-light text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand hover:brightness-110 text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Inquiry
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
