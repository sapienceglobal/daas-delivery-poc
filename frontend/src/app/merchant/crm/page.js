'use client';

import React, { useState, useEffect } from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import { crmAPI } from '@/lib/api';
import CustomersCRMView from '@/components/merchant/CustomersCRMView';
import CustomerModal from '@/components/merchant/CustomerModal';
import { PageLoader, showToast } from '@/components/ui';

export default function MerchantCRMPage() {
  const { restaurant, roomId, globalLoading } = useMerchantContext();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const loadData = async () => {
    try {

      const res = await crmAPI.getCustomers(roomId);
      console.log('CRM API Response:', res);
      setCustomers(res.data || []);
    } catch (err) {
      console.error('CRM Load Error:', err);
      showToast('Failed to load CRM data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (globalLoading || !roomId) return;
    loadData();
  }, [roomId, globalLoading]);

  const handleSaveCustomer = async (customerData) => {
    try {
      if (customerData._id) {
        await crmAPI.updateCustomer(roomId, customerData._id, customerData);
        showToast('Customer updated successfully', 'success');
      } else {
        await crmAPI.createCustomer(roomId, customerData);
        showToast('Customer created successfully', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.message || 'Failed to save customer', 'error');
      throw err;
    }
  };

  if (globalLoading || loading) return <PageLoader text="Loading Customers..." />;

  return (
    <div className="h-full bg-[#f8fafc]">
      <CustomersCRMView 
        customers={customers} 
        onSaveCustomer={handleSaveCustomer}
        onAdd={() => { setEditingCustomer(null); setIsModalOpen(true); }} 
        onEdit={(customer) => { setEditingCustomer(customer); setIsModalOpen(true); }}
        refreshData={loadData}
      />
      <CustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
        restaurantId={roomId}
      />
    </div>
  );
}
