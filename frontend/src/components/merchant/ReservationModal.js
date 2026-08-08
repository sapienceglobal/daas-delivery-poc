import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, Phone, Mail, User, MapPin, Loader2 } from 'lucide-react';
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
  const [activeSection, setActiveSection] = useState('customer');

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
      setActiveSection('customer');
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

  const inputClasses = "w-full bg-white border border-[#e5e7eb] rounded-lg px-3 py-2.5 text-sm text-[#1f2937] outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-colors placeholder:text-[#9ca3af]";
  const iconInputClasses = "w-full bg-white border border-[#e5e7eb] rounded-lg pl-10 pr-3 py-2.5 text-sm text-[#1f2937] outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] transition-colors placeholder:text-[#9ca3af]";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-5 border-b border-[#e5e7eb] flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">
              {reservation ? 'Edit Reservation' : 'New Reservation'}
            </h2>
            <p className="text-sm text-[#6b7280] mt-1">Manage guest details and table blocking.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f4f6] rounded-full text-[#6b7280] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-[#f9fafb]">
          
          {/* Left Sidebar Navigation */}
          <div className="w-full md:w-64 bg-[#f9fafb] border-r border-[#e5e7eb] p-6 flex flex-col gap-2 shrink-0">
            <button 
              type="button"
              onClick={() => setActiveSection('customer')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === 'customer' ? 'bg-white text-[#8B0000] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:bg-white hover:text-[#374151]'}`}
            >
              <User className="w-4 h-4" /> Customer Details
            </button>
            <button 
              type="button"
              onClick={() => setActiveSection('booking')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === 'booking' ? 'bg-white text-[#8B0000] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:bg-white hover:text-[#374151]'}`}
            >
              <Calendar className="w-4 h-4" /> Booking Info
            </button>
            <button 
              type="button"
              onClick={() => setActiveSection('special')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === 'special' ? 'bg-white text-[#8B0000] shadow-sm border border-[#e5e7eb]' : 'text-[#6b7280] hover:bg-white hover:text-[#374151]'}`}
            >
              <MapPin className="w-4 h-4" /> Special Requests
            </button>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
            <form id="reservation-form" onSubmit={handleSubmit}>
              
              {/* Customer Details Section */}
              <div className={activeSection === 'customer' ? 'block animate-in fade-in slide-in-from-right-4' : 'hidden'}>
                <h3 className="text-lg font-bold text-[#111827] mb-6">Guest Information</h3>
                <div className="space-y-5 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Full Name <span className="text-[#DC2626]">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      className={inputClasses}
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Phone Number <span className="text-[#DC2626]">*</span></label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                      <input
                        type="tel"
                        required
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                        className={iconInputClasses}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                      <input
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                        className={iconInputClasses}
                        placeholder="john@example.com"
                      />
                    </div>
                    <p className="text-xs text-[#6b7280] mt-1.5">Used for sending booking confirmation emails.</p>
                  </div>
                </div>
              </div>

              {/* Booking Details Section */}
              <div className={activeSection === 'booking' ? 'block animate-in fade-in slide-in-from-right-4' : 'hidden'}>
                <h3 className="text-lg font-bold text-[#111827] mb-6">Reservation Details</h3>
                <div className="space-y-6 max-w-2xl">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Date <span className="text-[#DC2626]">*</span></label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className={inputClasses}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Time <span className="text-[#DC2626]">*</span></label>
                      <input
                        type="time"
                        required
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        className={inputClasses}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Party Size <span className="text-[#DC2626]">*</span></label>
                      <div className="relative">
                        <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                        <input
                          type="number"
                          min="1"
                          required
                          value={formData.partySize}
                          onChange={(e) => setFormData({...formData, partySize: parseInt(e.target.value)})}
                          className={iconInputClasses}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className={inputClasses}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="seated">Seated</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-[#f3f4f6]">
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Seating Area</label>
                      <select
                        value={formData.location || ''}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className={inputClasses}
                      >
                        <option value="Indoor">Indoor (Main Dining)</option>
                        <option value="Outdoor">Outdoor (Patio)</option>
                        <option value="Private">Private Room</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Occasion</label>
                      <select
                        value={formData.occasion || ''}
                        onChange={(e) => setFormData({...formData, occasion: e.target.value})}
                        className={inputClasses}
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
              </div>

              {/* Special Requests Section */}
              <div className={activeSection === 'special' ? 'block animate-in fade-in slide-in-from-right-4' : 'hidden'}>
                <h3 className="text-lg font-bold text-[#111827] mb-6">Special Requests</h3>
                <div className="max-w-2xl">
                  <label className="block text-xs font-bold text-[#374151] mb-2 uppercase tracking-wider">Notes & Requests</label>
                  <textarea
                    rows="6"
                    value={formData.specialRequests}
                    onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                    className={`${inputClasses} resize-none`}
                    placeholder="E.g. Allergies, high chair required, window seat preferred..."
                  ></textarea>
                  <p className="text-xs text-[#6b7280] mt-2">These notes will be visible to the floor staff.</p>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-[#e5e7eb] bg-white flex justify-between items-center z-10 shrink-0">
          
          <div className="flex gap-2">
            {activeSection !== 'customer' && (
              <button 
                type="button" 
                onClick={() => setActiveSection(activeSection === 'special' ? 'booking' : 'customer')}
                className="px-4 py-2.5 rounded-lg text-sm font-bold text-[#374151] bg-[#f9fafb] border border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors"
              >
                Previous Step
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-bold text-[#374151] bg-white border border-[#e5e7eb] hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            {activeSection !== 'special' ? (
              <button 
                type="button"
                onClick={() => setActiveSection(activeSection === 'customer' ? 'booking' : 'special')}
                className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-[#111827] hover:bg-black transition-colors shadow-md"
              >
                Next Step
              </button>
            ) : (
              <button 
                type="submit" 
                form="reservation-form"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-[#8B0000] hover:bg-red-900 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : reservation ? 'Save Changes' : 'Confirm Reservation'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
