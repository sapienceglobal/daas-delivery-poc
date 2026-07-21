'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cateringAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function CateringInquiryModal({ isOpen, onClose, restaurantId, initialPackage = 'Custom / Unsure' }) {
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

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in z-10">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-[#eadfdb] flex items-center justify-between z-20">
          <div>
            <h2 className="text-[20px] font-black text-[#7a0b10]">Request Catering Quote</h2>
            <p className="text-[12px] text-[#6b7280]">Fill out the details below and we'll get back to you.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Contact Details */}
          <div>
            <h3 className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-4 border-b border-[#eadfdb] pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Full Name *</label>
                <input 
                  type="text" 
                  name="customerName"
                  required
                  value={formData.customerName}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Email Address *</label>
                <input 
                  type="email" 
                  name="customerEmail"
                  required
                  value={formData.customerEmail}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Phone Number *</label>
                <input 
                  type="tel" 
                  name="customerPhone"
                  required
                  value={formData.customerPhone}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h3 className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-4 border-b border-[#eadfdb] pb-2">Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Event Type *</label>
                <select 
                  name="eventType"
                  required
                  value={formData.eventType}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] outline-none"
                >
                  <option value="">Select event type...</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Birthday Party">Birthday Party</option>
                  <option value="Corporate Event">Corporate Event</option>
                  <option value="Family Gathering">Family Gathering</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Event Date *</label>
                <input 
                  type="date" 
                  name="eventDate"
                  required
                  value={formData.eventDate}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Guest Count *</label>
                <input 
                  type="number" 
                  name="guestCount"
                  required
                  min="1"
                  value={formData.guestCount}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] outline-none"
                  placeholder="e.g. 50"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Package Preference</label>
                <select 
                  name="packagePreference"
                  value={formData.packagePreference}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] outline-none"
                >
                  <option value="Basic Package">Basic Package</option>
                  <option value="Premium Package">Premium Package</option>
                  <option value="Deluxe Package">Deluxe Package</option>
                  <option value="Custom / Unsure">Custom / Unsure</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Additional Notes</label>
                <textarea 
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#1a1a1a] outline-none resize-none"
                  placeholder="Tell us about any dietary restrictions or special requests..."
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 h-11 rounded-lg border border-[#eadfdb] text-[#4b5563] text-[13px] font-bold hover:bg-gray-50 transition-colors"
            >
              CANCEL
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-8 h-11 rounded-lg bg-[#7a0b10] text-white text-[13px] font-black uppercase tracking-wider hover:bg-[#680307] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              SUBMIT INQUIRY
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
