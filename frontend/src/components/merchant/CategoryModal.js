'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, Loader2, FolderPlus } from 'lucide-react';
import { showToast } from '@/components/ui';

export default function CategoryModal({ 
  category, 
  restaurantId, 
  onClose, 
  onSave 
}) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        isActive: category.isActive !== false,
      });
    }
  }, [category]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        restaurantId
      }, category?._id);
      onClose();
    } catch (error) {
      console.error("Save Category Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ colorScheme: 'light' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-[#111827] animate-in fade-in zoom-in-95 duration-200 border border-[#e5e7eb]"
        style={{ colorScheme: 'light', color: '#111827', backgroundColor: '#ffffff' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e5e7eb] shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#fef2f2] shadow-sm flex items-center justify-center text-[#8B0000] border border-[#fecaca]">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#111827]">
                {category ? 'Edit Category' : 'New Category'}
              </h2>
              <p className="text-xs font-bold text-[#6b7280] mt-0.5">
                {category ? 'Update category details' : 'Create a new menu category'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9ca3af] hover:text-[#111827] p-2 rounded-lg hover:bg-[#f3f4f6] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto bg-white custom-scrollbar text-[#111827]">
          <form id="categoryForm" onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-bold text-[#374151] mb-2">Category Name <span className="text-[#8B0000]">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Starters, Main Course, Desserts"
                style={{ colorScheme: 'light', color: '#111827', backgroundColor: '#ffffff' }}
                className="w-full bg-white border border-[#d1d5db] rounded-xl px-4 py-3 text-sm text-[#111827] font-semibold focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all placeholder:text-[#9ca3af] shadow-sm"
                required
                autoFocus
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-bold text-[#374151] mb-2 flex items-center justify-between">
                <span>Description <span className="text-[#9ca3af] font-normal">(Optional)</span></span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of items in this category..."
                rows="3"
                style={{ colorScheme: 'light', color: '#111827', backgroundColor: '#ffffff' }}
                className="w-full bg-white border border-[#d1d5db] rounded-xl px-4 py-3 text-sm text-[#111827] font-normal focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all placeholder:text-[#9ca3af] shadow-sm resize-none"
              />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-xl border border-[#e5e7eb]">
              <div>
                <p className="text-sm font-bold text-[#374151]">Category Status</p>
                <p className="text-xs font-semibold text-[#6b7280] mt-1">If disabled, this category won't be shown to customers.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="sr-only" 
                />
                <div className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${formData.isActive ? 'bg-[#10B981]' : 'bg-[#d1d5db]'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#e5e7eb] bg-[#f9fafb] shrink-0 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ color: '#374151', backgroundColor: '#ffffff' }}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-[#374151] bg-white border border-[#d1d5db] hover:bg-[#f3f4f6] transition-colors shadow-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="categoryForm"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-[#8B0000] hover:bg-[#700000] transition-all shadow-md disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
