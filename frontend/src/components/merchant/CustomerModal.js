import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, Award, Users, CreditCard } from 'lucide-react';
import { showToast } from '@/components/ui';

export default function CustomerModal({ isOpen, onClose, onSave, customer, restaurantId }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    group: 'Others',
    loyaltyTier: 'Bronze',
    status: 'Active',
    totalOrders: 0,
    totalSpent: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          ...customer,
          totalOrders: customer.totalOrders || 0,
          totalSpent: customer.totalSpent || 0
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          group: 'Others',
          loyaltyTier: 'Bronze',
          status: 'Active',
          totalOrders: 0,
          totalSpent: 0
        });
      }
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      showToast('Please enter customer name', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSave({ ...formData, restaurantId });
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e7eb] flex justify-between items-center bg-[#f9fafb]">
          <div>
            <h2 className="text-lg font-bold text-[#111827]">
              {customer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <p className="text-xs text-[#6b7280] mt-1">Manage customer profile and CRM details.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#e5e7eb] rounded-full text-[#6b7280] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[#8B0000]" /> Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000]"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full border border-[#e5e7eb] rounded-lg !pl-10 pr-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000]"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border border-[#e5e7eb] rounded-lg !pl-10 pr-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000]"
                      placeholder="customer@email.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CRM Details */}
            <div className="pt-6 border-t border-[#f3f4f6]">
              <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#8B0000]" /> CRM & Loyalty
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Customer Group</label>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
                    <select
                      value={formData.group}
                      onChange={(e) => setFormData({...formData, group: e.target.value})}
                      className="w-full border border-[#e5e7eb] rounded-lg !pl-10 pr-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000] bg-white"
                    >
                      <option value="App User">App User</option>
                      <option value="Guest">Guest</option>
                      <option value="Family">Family</option>
                      <option value="Friends">Friends</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Loyalty Tier</label>
                  <select
                    value={formData.loyaltyTier}
                    onChange={(e) => setFormData({...formData, loyaltyTier: e.target.value})}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000] bg-white"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] outline-none focus:border-[#8B0000] bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Historical Data (Mock override for manual entry if needed) */}
            <div className="pt-6 border-t border-[#f3f4f6]">
              <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#8B0000]" /> Historical Data Override
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Total Orders</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalOrders}
                    onChange={(e) => setFormData({...formData, totalOrders: parseInt(e.target.value) || 0})}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] mb-1.5">Total Spent ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalSpent}
                    onChange={(e) => setFormData({...formData, totalSpent: parseFloat(e.target.value) || 0})}
                    className="w-full border border-[#e5e7eb] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white outline-none focus:border-[#8B0000]"
                  />
                </div>
              </div>
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
            form="customer-form"
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#8B0000] hover:bg-red-900 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : customer ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>

      </div>
    </div>
  );
}
