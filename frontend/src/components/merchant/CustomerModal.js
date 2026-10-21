import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Phone, Mail, Award, Users, CreditCard } from 'lucide-react';
import { showToast } from '@/components/ui';

export default function CustomerModal({ isOpen, onClose, onSave, customer, restaurantId }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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

  if (!isOpen || !mounted) return null;

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

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-admin-surface border border-admin-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-admin-border flex justify-between items-center bg-admin-card/50">
          <div>
            <h2 className="text-lg font-bold text-admin-text font-outfit">
              {customer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <p className="text-xs text-admin-text-secondary mt-0.5">Manage customer profile and CRM details.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-admin-card rounded-xl text-admin-text-secondary hover:text-admin-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <form id="customer-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Info */}
            <div>
              <h3 className="text-sm font-bold text-admin-text mb-4 flex items-center gap-2 font-outfit">
                <User className="w-4 h-4 text-brand" /> Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-admin-text-secondary mb-1.5 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-sm text-admin-text bg-admin-card outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all placeholder:text-admin-text-secondary/50"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-admin-text-secondary mb-1.5 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-secondary/60" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full border border-admin-border rounded-xl !pl-10 pr-3.5 py-2.5 text-sm text-admin-text bg-admin-card outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all placeholder:text-admin-text-secondary/50"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-admin-text-secondary mb-1.5 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-secondary/60" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full border border-admin-border rounded-xl !pl-10 pr-3.5 py-2.5 text-sm text-admin-text bg-admin-card outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all placeholder:text-admin-text-secondary/50"
                      placeholder="customer@email.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CRM Details */}
            <div className="pt-6 border-t border-admin-border">
              <h3 className="text-sm font-bold text-admin-text mb-4 flex items-center gap-2 font-outfit">
                <Award className="w-4 h-4 text-brand" /> CRM & Loyalty
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-admin-text-secondary mb-1.5 uppercase tracking-wider">Customer Group</label>
                  <div className="relative">
                    <Users className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-secondary/60 pointer-events-none" />
                    <select
                      value={formData.group}
                      onChange={(e) => setFormData({...formData, group: e.target.value})}
                      className="w-full border border-admin-border rounded-xl !pl-10 pr-3.5 py-2.5 text-sm text-admin-text outline-none focus:border-brand bg-admin-card cursor-pointer"
                    >
                      <option value="App User" className="bg-admin-surface text-admin-text">App User</option>
                      <option value="Guest" className="bg-admin-surface text-admin-text">Guest</option>
                      <option value="Family" className="bg-admin-surface text-admin-text">Family</option>
                      <option value="Friends" className="bg-admin-surface text-admin-text">Friends</option>
                      <option value="Corporate" className="bg-admin-surface text-admin-text">Corporate</option>
                      <option value="Others" className="bg-admin-surface text-admin-text">Others</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-admin-text-secondary mb-1.5 uppercase tracking-wider">Loyalty Tier</label>
                  <select
                    value={formData.loyaltyTier}
                    onChange={(e) => setFormData({...formData, loyaltyTier: e.target.value})}
                    className="w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-sm text-admin-text outline-none focus:border-brand bg-admin-card cursor-pointer"
                  >
                    <option value="Bronze" className="bg-admin-surface text-admin-text">Bronze</option>
                    <option value="Silver" className="bg-admin-surface text-admin-text">Silver</option>
                    <option value="Gold" className="bg-admin-surface text-admin-text">Gold</option>
                    <option value="Platinum" className="bg-admin-surface text-admin-text">Platinum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-admin-text-secondary mb-1.5 uppercase tracking-wider">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-sm text-admin-text outline-none focus:border-brand bg-admin-card cursor-pointer"
                  >
                    <option value="Active" className="bg-admin-surface text-admin-text">Active</option>
                    <option value="Inactive" className="bg-admin-surface text-admin-text">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Historical Data (Mock override for manual entry if needed) */}
            <div className="pt-6 border-t border-admin-border">
              <h3 className="text-sm font-bold text-admin-text mb-4 flex items-center gap-2 font-outfit">
                <CreditCard className="w-4 h-4 text-brand" /> Historical Data Override
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-admin-text-secondary mb-1.5 uppercase tracking-wider">Total Orders</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalOrders}
                    onChange={(e) => setFormData({...formData, totalOrders: parseInt(e.target.value) || 0})}
                    className="w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-sm text-admin-text bg-admin-card outline-none focus:border-brand transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-admin-text-secondary mb-1.5 uppercase tracking-wider">Total Spent ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.totalSpent}
                    onChange={(e) => setFormData({...formData, totalSpent: parseFloat(e.target.value) || 0})}
                    className="w-full border border-admin-border rounded-xl px-3.5 py-2.5 text-sm text-admin-text bg-admin-card outline-none focus:border-brand transition-all"
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-admin-border bg-admin-card/50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-admin-text-secondary bg-admin-card border border-admin-border hover:bg-admin-surface-hover hover:text-admin-text transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="customer-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand hover:opacity-90 shadow-md shadow-brand/20 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : customer ? 'Save Changes' : 'Add Customer'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
