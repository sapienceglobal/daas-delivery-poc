'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CheckCircle2, 
  Loader2, 
  FolderPlus, 
  Upload, 
  Image as ImageIcon, 
  Sparkles, 
  RotateCcw 
} from 'lucide-react';
import { showToast } from '@/components/ui';
import { uploadAPI } from '@/lib/api';
import { getCategory3DImage, CATEGORY_3D_PRESET_OPTIONS } from '@/lib/category3DHelper';

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
    image: '',
    isActive: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        image: category.image || '',
        isActive: category.isActive !== false,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        image: '',
        isActive: true,
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size should be less than 10MB', 'error');
      return;
    }

    try {
      setIsUploading(true);
      const res = await uploadAPI.uploadFile(file, 'categories');
      const uploadedUrl = res?.data?.url || res?.url;
      if (!uploadedUrl) throw new Error('Failed to retrieve uploaded image URL');
      setFormData(prev => ({ ...prev, image: uploadedUrl }));
      showToast('Category image uploaded successfully!', 'success');
    } catch (err) {
      console.error('Upload Error:', err);
      showToast(err.message || 'Failed to upload image', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSelectPreset = (presetImage) => {
    setFormData(prev => ({ ...prev, image: presetImage }));
    showToast('Preset 3D icon applied!', 'success');
  };

  const handleResetImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    showToast('Reset to automatic 3D matching', 'info');
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
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        image: formData.image || null,
        isActive: formData.isActive !== false,
        restaurantId
      }, category?._id);
      onClose();
    } catch (error) {
      console.error("Save Category Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Determine active 3D pop-out dish image in real-time
  const active3DImage = formData.image || getCategory3DImage(formData.name || category?.name || 'All Items');

  if (!mounted) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-admin-surface rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] text-admin-text animate-in fade-in zoom-in-95 duration-200 border border-admin-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-admin-border shrink-0 bg-admin-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 shadow-2xs flex items-center justify-center text-brand border border-brand/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-admin-text">
                {category ? 'Edit Category' : 'New Category'}
              </h2>
              <p className="text-xs font-semibold text-admin-text-secondary mt-0.5">
                {category ? 'Update category details & 3D image' : 'Create a new menu category with 3D pop-out'}
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

        {/* 🌟 TOP CENTER 3D POP-OUT IMAGE SHOWCASE 🌟 */}
        <div className="flex flex-col items-center justify-center pt-4 pb-3 border-b border-admin-border/60 bg-gradient-to-b from-brand/5 via-transparent to-transparent shrink-0">
          <div className="relative flex items-center justify-center" style={{ width: '84px', height: '105px' }}>
            {/* 1. Vertical Oval Capsule Backdrop */}
            <div 
              className="absolute inset-0 rounded-[9999px] border border-[#ebdcc1]/80 shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
              style={{
                background: 'radial-gradient(circle at center, #FDEFD5 0%, #FFFFFF 100%)'
              }}
            />
            {/* 2. Soft Elliptical Contact Shadow */}
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                width: '54px',
                height: '7px',
                bottom: '10px',
                background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.24) 0%, rgba(0,0,0,0) 75%)',
                filter: 'blur(2.5px)',
              }}
            />
            {/* 3. Floating 3D Cutout Food Image */}
            <div
              className="absolute z-10 pointer-events-none flex items-center justify-center"
              style={{ width: '92px', height: '92px', top: '3px' }}
            >
              <img
                src={active3DImage}
                alt={formData.name || 'Category'}
                className="w-full h-full object-contain filter drop-shadow-[0_8px_14px_rgba(122,11,16,0.24)] transition-all duration-300"
              />
            </div>
          </div>

          {/* Subtitle Badge & Reset Action */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-admin-text-secondary bg-admin-surface-light px-2.5 py-0.5 rounded-full border border-admin-border/80 flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {formData.image ? (formData.image.startsWith('http') ? 'Custom Image' : 'Preset 3D Icon') : 'Auto 3D Icon'}
            </span>
            {formData.image && (
              <button
                type="button"
                onClick={handleResetImage}
                className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer flex items-center gap-0.5"
                title="Reset to automatic name matching"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset to Auto
              </button>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-4 sm:p-5 overflow-y-auto bg-admin-surface custom-scrollbar text-admin-text space-y-4">
          <form id="categoryForm" onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1.5 uppercase tracking-wider">
                Category Name <span className="text-brand">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Starters, Momos, Thali, Desserts"
                className="w-full bg-admin-surface-light border border-admin-border rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-admin-text font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-admin-text-muted shadow-2xs"
                required
                autoFocus
              />
            </div>

            {/* 📸 Category 3D Image & Icon Option */}
            <div className="p-3.5 sm:p-4 bg-admin-surface-light rounded-xl border border-admin-border space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-admin-text uppercase tracking-wider">
                    Category Image / 3D Icon
                  </label>
                  <p className="text-[11px] text-admin-text-secondary mt-0.5">
                    Choose from 3D cutout presets or upload a custom image.
                  </p>
                </div>
                {formData.image && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Image Set
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-0.5">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-admin-surface hover:bg-admin-surface-light text-admin-text border border-admin-border rounded-xl text-xs font-bold transition-all shadow-2xs hover:border-brand/40 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                  ) : (
                    <Upload className="w-3.5 h-3.5 text-brand" />
                  )}
                  <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPresets(!showPresets)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-admin-surface hover:bg-admin-surface-light text-admin-text border border-admin-border rounded-xl text-xs font-bold transition-all shadow-2xs hover:border-brand/40 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                  <span>{showPresets ? 'Hide 3D Library' : 'Choose 3D Preset'}</span>
                </button>

                {formData.image && (
                  <button
                    type="button"
                    onClick={handleResetImage}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    title="Reset to name-based automatic 3D matching"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* 3D Presets Grid Picker (Collapsible) */}
              {showPresets && (
                <div className="pt-2.5 border-t border-admin-border/70 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-admin-text-secondary uppercase tracking-wider">
                      Official 3D Dish Cutouts ({CATEGORY_3D_PRESET_OPTIONS.length})
                    </span>
                    <span className="text-[10px] text-admin-text-muted">Click to select</span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 custom-scrollbar">
                    {CATEGORY_3D_PRESET_OPTIONS.map((preset) => {
                      const isSelected = formData.image === preset.image;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.image)}
                          className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'border-brand bg-brand/10 ring-2 ring-brand/20 shadow-xs'
                              : 'border-admin-border bg-admin-surface hover:border-brand/40 hover:bg-admin-surface-light'
                          }`}
                        >
                          <div className="w-9 h-9 flex items-center justify-center p-0.5">
                            <img
                              src={preset.image}
                              alt={preset.label}
                              className="w-full h-full object-contain filter drop-shadow-sm"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-admin-text mt-1 line-clamp-1 leading-tight">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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
                rows="2"
                className="w-full bg-admin-surface-light border border-admin-border rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-admin-text font-normal focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-admin-text-muted shadow-2xs resize-none"
              />
            </div>

            {/* Status Toggle */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 bg-admin-surface-light rounded-xl border border-admin-border">
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
        <div className="p-4 border-t border-admin-border bg-admin-surface-light shrink-0 flex items-center justify-end gap-3 rounded-b-2xl">
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
