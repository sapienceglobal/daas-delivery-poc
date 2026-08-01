import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Phone, Mail, User, MapPin } from 'lucide-react';
import { showToast } from '@/components/ui';

export default function ReservationModal({ isOpen, onClose, onSave, reservation, restaurantId }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    partySize: 2,
    location: 'Indoor',
    occasion: 'Dinner',
    specialRequests: '',
    status: 'pending'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (reservation) {
        setFormData({
          ...reservation,
          date: new Date(reservation.date).toISOString().split('T')[0]
        });
      } else {
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          date: new Date().toISOString().split('T')[0],
          time: '19:00',
          partySize: 2,
          location: 'Indoor',
          occasion: 'Dinner',
          specialRequests: '',
          status: 'pending'
        });
      }
    }
  }, [isOpen, reservation]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.date || !formData.time || !formData.partySize) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave({ ...formData, restaurantId });
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save reservation', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f9fafb]">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">
              {reservation ? 'Edit Reservation' : 'New Reservation'}
            </h2>
            <p className="text-xs text-[#6b7280] mt-1">Fill in the details to block a table.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#e5e7eb] rounded-full text-[#6b7280] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="reservation-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Customer Details */}
            <div>
              <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#8B0000]" /> Customer Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000]"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                    <input
                      type="tel"
                      required
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      className="w-full border border-[#e5e7eb] rounded-lg pl-9 pr-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000]"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                      className="w-full border border-[#e5e7eb] rounded-lg pl-9 pr-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000]"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="pt-6 border-t border-[#f3f4f6]">
              <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#8B0000]" /> Booking Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Party Size *</label>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.partySize}
                      onChange={(e) => setFormData({...formData, partySize: parseInt(e.target.value)})}
                      className="w-full border border-[#e5e7eb] rounded-lg pl-9 pr-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Seating Area</label>
                  <select
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000]"
                  >
                    <option value="Indoor">Indoor (Main Dining)</option>
                    <option value="Outdoor">Outdoor (Patio)</option>
                    <option value="Private">Private Room</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Occasion</label>
                  <select
                    value={formData.occasion}
                    onChange={(e) => setFormData({...formData, occasion: e.target.value})}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000]"
                  >
                    <option value="Dinner">Dinner</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Corporate">Corporate Event</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="pt-6 border-t border-[#f3f4f6]">
              <label className="block text-xs font-bold text-[#374151] mb-1.5">Special Requests (Optional)</label>
              <textarea
                rows="3"
                value={formData.specialRequests}
                onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000] resize-none"
                placeholder="Allergies, high chair required, etc."
              ></textarea>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#e5e7eb] bg-[#f9fafb] flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-[#374151] bg-white border border-[#e5e7eb] hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="reservation-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#8B0000] hover:bg-red-900 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : reservation ? 'Save Changes' : 'Confirm Reservation'}
          </button>
        </div>

      </div>
    </div>
  );
}
