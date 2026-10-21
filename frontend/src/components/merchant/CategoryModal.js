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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-admin-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] text-admin-text animate-in fade-in zoom-in-95 duration-200 border border-admin-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-admin-border shrink-0 bg-admin-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 shadow-2xs flex items-center justify-center text-brand border border-brand/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-heading text-admin-text">
                {category ? 'Edit Category' : 'New Category'}
              </h2>
              <p className="text-xs font-semibold text-admin-text-secondary mt-0.5">
                {category ? 'Update category details' : 'Create a new menu category'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-admin-text-secondary hover:text-admin-text p-2 rounded-xl hover:bg-admin-surface-light transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-5 sm:p-6 overflow-y-auto bg-admin-surface custom-scrollbar text-admin-text">
          <form id="categoryForm" onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1.5 uppercase tracking-wider">Category Name <span className="text-brand">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Starters, Main Course, Desserts"
                className="w-full bg-admin-surface-light border border-admin-border rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-admin-text font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-admin-text-muted shadow-2xs"
                required
                autoFocus
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Description <span className="text-admin-text-muted font-normal lowercase">(Optional)</span></span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of items in this category..."
                rows="3"
                className="w-full bg-admin-surface-light border border-admin-border rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-admin-text font-normal focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-admin-text-muted shadow-2xs resize-none"
              />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-4 bg-admin-surface-light rounded-xl border border-admin-border">
              <div>
                <p className="text-xs sm:text-sm font-bold text-admin-text">Category Status</p>
                <p className="text-xs font-medium text-admin-text-secondary mt-0.5">If disabled, this category won't be shown to customers.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="sr-only" 
                />
                <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${formData.isActive ? 'bg-emerald-500' : 'bg-admin-border'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${formData.isActive ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-admin-border bg-admin-surface-light shrink-0 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-admin-text bg-admin-surface border border-admin-border hover:bg-admin-surface-light transition-colors shadow-2xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="categoryForm"
            disabled={loading}
            className="flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-brand hover:brightness-110 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
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
