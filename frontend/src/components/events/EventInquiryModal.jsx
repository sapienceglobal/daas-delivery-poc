'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cateringAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function EventInquiryModal({ isOpen, onClose, restaurantId, initialPackage = 'Custom / Unsure' }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
    const finalName = formEl.name?.value || formData.name;
    const finalEmail = formEl.email?.value || formData.email;
    const finalPhone = formEl.phone?.value || formData.phone;
    const finalGuestCount = formEl.guestCount?.value || formData.guestCount;
    const finalEventType = formEl.eventType?.value || formData.eventType;
    const finalEventDate = formEl.eventDate?.value || formData.eventDate;
    const finalPackage = formEl.packagePreference?.value || formData.packagePreference;
    const finalNotes = formEl.additionalNotes?.value || formData.additionalNotes;

    try {
      // Re-using catering inquiry API since data structure is identical for events
      await cateringAPI.submitInquiry({
        restaurantId,
        customerName: finalName,
        customerEmail: finalEmail,
        customerPhone: finalPhone,
        eventType: finalEventType,
        eventDate: finalEventDate,
        guestCount: parseInt(finalGuestCount, 10),
        packagePreference: finalPackage,
        additionalNotes: finalNotes,
        menuPreferences: finalPackage // Map to expected API field
      });
      showToast('Event inquiry submitted! We will contact you soon.', 'success');
      onClose();
    } catch (error) {
      showToast(error.message || 'Failed to submit inquiry', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24 pb-8">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[calc(100vh-8rem)] overflow-y-auto ll-soft-scroll shadow-2xl z-10">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-[#eadfdb] flex items-center justify-between z-20">
          <div>
            <h2 className="text-[20px] font-black text-[#7a0b10]">Customize Your Event</h2>
            <p className="text-[12px] text-[#6b7280]">Fill out the details below to get a free quote.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-6">
          {/* Contact Details */}
          <div>
            <h3 className="text-[13px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-4 border-b border-[#eadfdb] pb-2">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Full Name *</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Email Address *</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Phone Number *</label>
                <input 
                  type="tel" 
                  name="phone"
                  required
                  value={formData.phone}
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
                  <option value="">Select Event Type</option>
                  <option value="Birthday Party">Birthday Party</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Corporate Event">Corporate Event</option>
                  <option value="Kitty Party">Kitty Party</option>
                  <option value="Wedding / Engagement">Wedding / Engagement</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Package Preference</label>
                <select
                  name="packagePreference"
                  value={formData.packagePreference}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] outline-none"
                >
                  <option value="Custom / Unsure">Custom / Unsure</option>
                  <option value="BASIC">Basic Package</option>
                  <option value="POPULAR">Popular Package</option>
                  <option value="PREMIUM">Premium Package</option>
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
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Estimated Guests *</label>
                <input 
                  type="number" 
                  name="guestCount"
                  required
                  min="5"
                  value={formData.guestCount}
                  onChange={handleChange}
                  className="w-full h-11 px-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] outline-none"
                  placeholder="e.g. 50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[12px] font-bold text-[#4b5563] mb-1">Additional Requirements or Questions</label>
                <textarea 
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  className="w-full h-24 p-3 rounded-lg border border-[#eadfdb] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] text-[14px] bg-white text-[#1a1a1a] [&:-webkit-autofill]:shadow-[0_0_0_1000px_white_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#1a1a1a] outline-none resize-none"
                  placeholder="Tell us about any specific dishes, themes, or budget requirements..."
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-[#7a0b10] text-white font-bold rounded-lg hover:bg-[#5a080b] transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SUBMIT INQUIRY'}
          </button>
        </form>
      </div>
    </div>
  );
}
