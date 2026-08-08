'use client';

import React, { useState, useEffect } from 'react';
import { useMerchantContext } from '@/context/MerchantContext';
import { restaurantAPI, uploadAPI } from '@/lib/api';
import SettingsView from '@/components/merchant/SettingsView';
import { PageLoader, showToast } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export default function MerchantSettingsPage() {
  const { restaurant, roomId, globalLoading, refreshRestaurant } = useMerchantContext();
  const { user } = useAuth();
  
  // Need to provide the onboardingForm logic here for settings update
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [onboardingForm, setOnboardingForm] = useState({
    businessInfo: {
      legalName: '',
      dbaName: '',
      taxIdLast4: '',
      entityType: '',
      ownerName: '',
      ownerTitle: '',
      ownerEmail: '',
      ownerPhone: '',
    },
    documents: [],
  });

  useEffect(() => {
    if (restaurant) {
      setOnboardingForm({
        businessInfo: {
          legalName: restaurant.businessInfo?.legalName || '',
          dbaName: restaurant.businessInfo?.dbaName || '',
          taxIdLast4: restaurant.businessInfo?.taxIdLast4 || '',
          entityType: restaurant.businessInfo?.entityType || '',
          ownerName: restaurant.businessInfo?.ownerName || user?.name || '',
          ownerTitle: restaurant.businessInfo?.ownerTitle || '',
          ownerEmail: restaurant.businessInfo?.ownerEmail || user?.email || '',
          ownerPhone: restaurant.businessInfo?.ownerPhone || user?.phone || '',
        },
        documents: restaurant.documents || [],
      });
    }
  }, [restaurant, user]);

  const handleDocumentUpload = async (file, type) => {
    try {
      setUploadingDoc(true);
      const url = await uploadAPI.uploadDocument(file);
      const newDoc = { type, url, uploadedAt: new Date().toISOString() };
      
      const updatedDocs = [...onboardingForm.documents, newDoc];
      setOnboardingForm(prev => ({ ...prev, documents: updatedDocs }));
      
      if (restaurant?._id) {
        await restaurantAPI.update(restaurant._id, { documents: updatedDocs });
        showToast('Document uploaded successfully', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocumentRemove = async (docUrl) => {
    try {
      const updatedDocs = onboardingForm.documents.filter(d => d.url !== docUrl);
      setOnboardingForm(prev => ({ ...prev, documents: updatedDocs }));
      if (restaurant?._id) {
        await restaurantAPI.update(restaurant._id, { documents: updatedDocs });
      }
    } catch (err) {
      showToast('Failed to remove document', 'error');
    }
  };

  const handleUpdateSettings = async (updates) => {
    try {
      if (restaurant?._id) {
        await restaurantAPI.update(restaurant._id, updates);
        showToast('Settings saved successfully', 'success');
        refreshRestaurant();
      }
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    }
  };

  const handleVerifyBusiness = async (formData) => {
    try {
      if (restaurant?._id) {
        await restaurantAPI.update(restaurant._id, { businessInfo: formData.businessInfo });
        showToast('Verification submitted', 'success');
        refreshRestaurant();
      }
    } catch (err) {
      showToast(err.message || 'Verification submission failed', 'error');
    }
  };

  if (globalLoading) return <PageLoader text="Loading Settings..." />;

  return (
    <SettingsView
      restaurant={restaurant}
      onRefresh={refreshRestaurant}
      onUpdate={handleUpdateSettings}
      onboardingForm={onboardingForm}
      setOnboardingForm={setOnboardingForm}
      onVerifyBusiness={handleVerifyBusiness}
      onDocumentUpload={handleDocumentUpload}
      onDocumentRemove={handleDocumentRemove}
      uploadingDoc={uploadingDoc}
      user={user}
    />
  );
}