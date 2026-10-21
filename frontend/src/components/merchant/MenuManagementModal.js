import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Sparkles, Image as ImageIcon, Tag, Activity, Upload, Loader2, Globe, Search } from 'lucide-react';
import { menuAPI } from '@/lib/api';
import { showToast } from '@/components/ui';
import { getItemSlug } from '@/lib/slugUtils';
import { useAuth } from '@/context/AuthContext';

export default function MenuManagementModal({
  item,
  categories = [],
  restaurantId,
  onClose,
  onSave
}) {
  const { user, isAdmin, isMerchant } = useAuth();
  const isAuthorizedForSEO = Boolean(
    isAdmin ||
    isMerchant ||
    user?.role === 'admin' ||
    user?.role === 'merchant'
  );

  const [itemForm, setItemForm] = useState({
    name: '', categoryId: '', description: '', price: '', preparationTime: '15',
    image: '', images: [], tags: '', sizeVariationsText: '', addOnsText: '',
    isVeg: false, isVegan: false, isSpicy: false, isGlutenFree: false,
    isBestseller: false, isAvailable: true,
    seoTitle: '', seoDescription: '', seoKeywordsText: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errors, setErrors] = useState({});
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (item) {
      setItemForm({
        ...item,
        images: item.images || (item.image ? [item.image] : []),
        categoryId: item.categoryId || categories.find(c => c.name === item.categoryName)?._id || '',
        price: item.price?.toString() || '',
        preparationTime: item.preparationTime?.toString() || '15',
        sizeVariationsText: item.sizeVariations?.map(s => `${s.name}:${s.price}`).join('\n') || '',
        addOnsText: item.addOns?.map(a => `${a.name}:${a.price}`).join('\n') || '',
        seoTitle: item.seoTitle || '',
        seoDescription: item.seoDescription || '',
        seoKeywordsText: Array.isArray(item.seoKeywords) ? item.seoKeywords.join(', ') : (item.seoKeywords || '')
      });
    }
  }, [item, categories]);

  const handleSaveItem = async () => {
    try {
      const newErrors = {};
      if (!itemForm.name?.trim()) newErrors.name = 'Item name is required';
      if (!itemForm.categoryId) newErrors.categoryId = 'Category is required';
      if (!itemForm.price || Number(itemForm.price) <= 0) newErrors.price = 'Valid price is required';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        // showToast('Please fix the errors in the form', 'error'); // Fallback is optional, inline errors show it
        return;
      }
      setErrors({});
      setIsSaving(true);
      
      const payload = {
        ...itemForm,
        image: itemForm.image || itemForm.images?.[0] || null,
        images: itemForm.images || [],
        restaurantId: restaurantId, // Ensure restaurantId is included
        price: Number(itemForm.price),
        preparationTime: Number(itemForm.preparationTime),
        sizeVariations: itemForm.sizeVariationsText?.split('\n').filter(Boolean).map(l => {
          const [name, price] = l.split(':');
          return { name, price: Number(price) };
        }) || [],
        addOns: itemForm.addOnsText?.split('\n').filter(Boolean).map(l => {
          const [name, price] = l.split(':');
          return { name, price: Number(price) };
        }) || [],
        seoTitle: itemForm.seoTitle ? itemForm.seoTitle.trim().slice(0, 60) : '',
        seoDescription: itemForm.seoDescription ? itemForm.seoDescription.trim().slice(0, 155) : '',
        seoKeywords: itemForm.seoKeywordsText
          ? itemForm.seoKeywordsText.split(',').map(s => s.trim()).filter(Boolean)
          : []
      };

      if (item?._id) {
        await menuAPI.updateItem(item._id, payload);
        showToast('Item updated successfully', 'success');
      } else {
        await menuAPI.createItem(payload);
        showToast('Item created successfully', 'success');
      }
      onSave();
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to save item', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const oversized = files.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) {
      showToast('Each image size should be less than 10MB', 'error');
      return;
    }

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));
      
      const token = localStorage.getItem('token');
      const res = await fetch('/api/upload/multiple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload images');
      
      const newUrls = data.data.map(d => d.url);
      setItemForm(f => {
        const updatedImages = [...(f.images || []), ...newUrls];
        const newMainImage = f.image ? f.image : updatedImages[0];
        return { ...f, images: updatedImages, image: newMainImage };
      });
      showToast(`${newUrls.length} image(s) uploaded successfully!`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSmartPricing = () => {
    if (!itemForm.price) {
      showToast('Please enter a base price first', 'info');
      return;
    }
    const currentPrice = Number(itemForm.price);
    const optimized = (currentPrice * 1.15).toFixed(2);
    setItemForm(f => ({ ...f, price: optimized }));
    showToast(`AI Suggested Price: $${optimized} (+15% based on demand)`, 'success');
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-admin-surface rounded-3xl shadow-2xl border border-admin-border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-admin-text"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 lg:p-7 border-b border-admin-border bg-admin-surface sticky top-0 z-10 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-heading text-admin-text tracking-tight">
              {item?._id ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <p className="text-xs sm:text-sm text-admin-text-secondary mt-1 font-medium">
              {item?._id ? 'Update details for your menu item.' : 'Fill in the details to add a new item to your menu.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-admin-surface-light rounded-full transition-colors text-admin-text-secondary hover:text-admin-text border border-transparent hover:border-admin-border cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 custom-scrollbar bg-admin-bg/50">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column - Main Details */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Section: Basic Info */}
              <div className="bg-admin-card p-6 rounded-2xl shadow-sm border border-admin-border space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-brand/10 p-1.5 rounded-lg text-brand">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-admin-text">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-admin-text uppercase tracking-wider mb-2">Item Name *</label>
                    <input
                      value={itemForm.name || ''}
                      onChange={(e) => {
                        setItemForm(f => ({ ...f, name: e.target.value }));
                        if (errors.name) setErrors(e => ({ ...e, name: null }));
                      }}
                      placeholder="e.g. Garlic Naan"
                      className={`w-full rounded-xl bg-admin-surface border ${errors.name ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'border-admin-border focus:ring-brand/20 focus:border-brand'} text-xs sm:text-sm text-admin-text px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 transition-all`}
                    />
                    {errors.name && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-admin-text uppercase tracking-wider mb-2">Category *</label>
                    <select
                      value={itemForm.categoryId || ''}
                      onChange={(e) => {
                        setItemForm(f => ({ ...f, categoryId: e.target.value }));
                        if (errors.categoryId) setErrors(e => ({ ...e, categoryId: null }));
                      }}
                      className={`w-full rounded-xl bg-admin-surface border ${errors.categoryId ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'border-admin-border focus:ring-brand/20 focus:border-brand'} text-xs sm:text-sm text-admin-text px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 transition-all cursor-pointer`}
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                    {errors.categoryId && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.categoryId}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-admin-text uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={itemForm.description || ''}
                    onChange={(e) => setItemForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the item, ingredients, and taste..."
                    className="w-full rounded-xl bg-admin-surface border border-admin-border text-xs sm:text-sm text-admin-text px-4 py-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-admin-text uppercase tracking-wider mb-2 flex items-center gap-2">
                      Base Price ($) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-admin-text-muted font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={itemForm.price || ''}
                        onChange={(e) => {
                          setItemForm(f => ({ ...f, price: e.target.value }));
                          if (errors.price) setErrors(e => ({ ...e, price: null }));
                        }}
                        placeholder="0.00"
                        className={`w-full rounded-xl bg-admin-surface border ${errors.price ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : 'border-admin-border focus:ring-brand/20 focus:border-brand'} text-xs sm:text-sm font-bold text-admin-text pl-8 pr-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 transition-all`}
                      />
                    </div>
                    {errors.price && <p className="text-rose-500 text-xs mt-1 font-bold">{errors.price}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-admin-text uppercase tracking-wider mb-2">Prep Time (mins)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={itemForm.preparationTime || ''}
                        onChange={(e) => setItemForm(f => ({ ...f, preparationTime: e.target.value }))}
                        placeholder="15"
                        className="w-full rounded-xl bg-admin-surface border border-admin-border text-xs sm:text-sm font-bold text-admin-text px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted text-xs font-bold">MIN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Media & Tags */}
              <div className="bg-admin-card p-6 rounded-2xl shadow-sm border border-admin-border space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-brand/10 p-1.5 rounded-lg text-brand">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-admin-text">Media & Tags</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-admin-text uppercase tracking-wider mb-2">Image Link OR Upload (Multiple)</label>
                  <div className="flex gap-2">
                    <input
                      value={itemForm.image || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItemForm(f => {
                          const newImages = [...(f.images || [])];
                          if (val && !newImages.includes(val)) newImages.push(val);
                          return { ...f, image: val, images: newImages };
                        });
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1 rounded-xl bg-admin-surface border border-admin-border text-xs sm:text-sm text-admin-text px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                    />
                    <button 
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2.5 sm:py-3 bg-admin-surface border border-admin-border text-admin-text rounded-xl hover:bg-admin-surface-light transition-colors font-medium text-xs sm:text-sm whitespace-nowrap disabled:opacity-50 cursor-pointer"
                    >
                      {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-brand" /> : <Upload className="w-4 h-4" />}
                      Upload Files
                    </button>
                  </div>
                  {itemForm.images && itemForm.images.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {itemForm.images.map((imgUrl, idx) => {
                        const isMain = itemForm.image === imgUrl;
                        return (
                          <div key={idx} className={`relative group w-full aspect-square rounded-xl overflow-hidden border-2 ${isMain ? 'border-brand' : 'border-admin-border'}`}>
                            <img src={imgUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              {!isMain && (
                                <button 
                                  type="button"
                                  onClick={() => setItemForm(f => ({ ...f, image: imgUrl }))}
                                  className="px-2 py-1 bg-white text-xs font-bold text-brand rounded shadow-sm hover:scale-105 transition-transform cursor-pointer"
                                >
                                  Set Main
                                </button>
                              )}
                              <button 
                                type="button"
                                onClick={() => setItemForm(f => ({ 
                                  ...f, 
                                  images: f.images.filter(url => url !== imgUrl),
                                  image: f.image === imgUrl ? (f.images.find(url => url !== imgUrl) || '') : f.image
                                }))}
                                className="px-2 py-1 bg-rose-600 text-xs font-bold text-white rounded shadow-sm hover:scale-105 transition-transform cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                            {isMain && (
                              <div className="absolute top-1 right-1 bg-brand text-white p-1 rounded-full shadow-md">
                                <Sparkles className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-admin-text uppercase tracking-wider mb-2">Search Tags</label>
                  <input
                    value={itemForm.tags || ''}
                    onChange={(e) => setItemForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="e.g. spicy, popular, healthy (comma separated)"
                    className="w-full rounded-xl bg-admin-surface border border-admin-border text-xs sm:text-sm text-admin-text px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                  />
                </div>
              </div>

              {/* Section: Google Search & SEO (Authorized roles only) */}
              {isAuthorizedForSEO && (
                <div className="bg-admin-card p-6 rounded-2xl shadow-sm border border-admin-border space-y-5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500/10 p-1.5 rounded-lg text-blue-500">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold font-heading text-admin-text">Google Search & SEO</h3>
                        <p className="text-xs text-admin-text-secondary">Edit title & description for Google search and social media sharing</p>
                      </div>
                    </div>
                  </div>

                  {/* SEO Title with Counter */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-admin-text uppercase tracking-wider">
                        Meta Title
                      </label>
                      <span className={`text-xs font-semibold ${
                        (itemForm.seoTitle || '').length > 60
                          ? 'text-rose-500'
                          : (itemForm.seoTitle || '').length > 50
                          ? 'text-amber-500'
                          : 'text-admin-text-secondary'
                      }`}>
                        {(itemForm.seoTitle || '').length} / 60
                      </span>
                    </div>
                    <input
                      maxLength={60}
                      value={itemForm.seoTitle || ''}
                      onChange={(e) => setItemForm(f => ({ ...f, seoTitle: e.target.value }))}
                      placeholder={`e.g. ${itemForm.name || 'Mango Lassi'} - Fresh & Creamy | Order Online`}
                      className="w-full rounded-xl bg-admin-surface border border-admin-border text-xs sm:text-sm text-admin-text px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                    <p className="text-[11px] text-admin-text-muted mt-1">
                      Appears as the clickable title in Google search results. Leave blank to use default item name.
                    </p>
                  </div>

                  {/* SEO Description with Counter */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-admin-text uppercase tracking-wider">
                        Meta Description
                      </label>
                      <span className={`text-xs font-semibold ${
                        (itemForm.seoDescription || '').length > 155
                          ? 'text-rose-500'
                          : (itemForm.seoDescription || '').length > 130
                          ? 'text-amber-500'
                          : 'text-admin-text-secondary'
                      }`}>
                        {(itemForm.seoDescription || '').length} / 155
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={155}
                      value={itemForm.seoDescription || ''}
                      onChange={(e) => setItemForm(f => ({ ...f, seoDescription: e.target.value }))}
                      placeholder={`e.g. Order delicious ${itemForm.name || 'Mango Lassi'} online from Lassi Lounge NY. Made fresh daily with authentic ingredients.`}
                      className="w-full rounded-xl bg-admin-surface border border-admin-border text-xs sm:text-sm text-admin-text px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                    <p className="text-[11px] text-admin-text-muted mt-1">
                      Appears below the title in Google search results. Recommended: 120-155 characters.
                    </p>
                  </div>

                  {/* Google Search Live SERP Preview Box */}
                  <div className="p-4 rounded-xl bg-admin-surface-light border border-admin-border space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                      <Search className="w-3.5 h-3.5 text-blue-500" />
                      <span>Google Search Live Preview</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-brand flex items-center justify-center text-[9px] text-white font-bold shrink-0">
                        LL
                      </div>
                      <a
                        href={`/item/${itemForm.slug || (itemForm.name ? itemForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : (item?._id || 'item-preview'))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-admin-text leading-tight truncate hover:underline"
                        title="Open live dish page in new tab"
                      >
                        <span className="font-medium text-admin-text">Lassi Lounge NY</span>
                        <span className="text-admin-text-muted ml-1">· https://www.lassiloungeny.com › item › {
                          itemForm.slug || (itemForm.name ? itemForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : 'dish-item')
                        }</span>
                      </a>
                    </div>
                    <a
                      href={`/item/${itemForm.slug || (itemForm.name ? itemForm.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : (item?._id || 'item-preview'))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[15px] sm:text-[17px] font-normal text-blue-500 hover:underline cursor-pointer leading-snug line-clamp-1 pt-0.5 block"
                      title="Open live dish page in new tab"
                    >
                      {itemForm.seoTitle?.trim() || `${itemForm.name || 'Dish Name'} - Order Online`} | Lassi Lounge NY
                    </a>
                    <p className="text-xs sm:text-[13px] text-admin-text-secondary leading-relaxed line-clamp-2">
                      {itemForm.seoDescription?.trim() || (itemForm.description ? itemForm.description.slice(0, 155) : 'Order fresh and authentic Indian cuisine online from Lassi Lounge NY. Fast delivery and easy pickup in New York.')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Modifiers & Properties */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Properties Grid */}
              <div className="bg-admin-card p-6 rounded-2xl shadow-sm border border-admin-border space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-brand/10 p-1.5 rounded-lg text-brand">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold font-heading text-admin-text">Properties</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['isVeg', 'Vegetarian', 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'],
                    ['isVegan', 'Vegan', 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30'],
                    ['isSpicy', 'Spicy', 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'],
                    ['isGlutenFree', 'Gluten Free', 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'],
                    ['isBestseller', 'Bestseller', 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30'],
                    ['isAvailable', 'Active (Available)', 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'],
                  ].map(([key, label, colorClass]) => {
                    const isChecked = Boolean(itemForm[key]);
                    return (
                      <label 
                        key={key} 
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isChecked ? colorClass : 'bg-admin-surface border-admin-border text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface-light'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={(e) => setItemForm(f => ({ ...f, [key]: e.target.checked }))}
                        />
                        <span className="text-xs font-bold text-center leading-tight">{label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Modifiers & Variations */}
              <div className="bg-admin-card p-6 rounded-2xl shadow-sm border border-admin-border space-y-5">
                <div>
                  <label className="block text-xs font-bold text-admin-text uppercase tracking-wider mb-2">Size Variations</label>
                  <textarea
                    value={itemForm.sizeVariationsText || ''}
                    onChange={(e) => setItemForm(f => ({ ...f, sizeVariationsText: e.target.value }))}
                    placeholder={"Small:5.99\nLarge:9.99"}
                    className="w-full rounded-xl bg-admin-surface border border-admin-border text-xs sm:text-sm text-admin-text px-4 py-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all font-mono"
                  />
                  <p className="text-[11px] font-bold text-admin-text-muted mt-1 uppercase">Format: Name:Price (1 per line)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-admin-text uppercase tracking-wider mb-2">Add-ons</label>
                  <textarea
                    value={itemForm.addOnsText || ''}
                    onChange={(e) => setItemForm(f => ({ ...f, addOnsText: e.target.value }))}
                    placeholder={"Extra Cheese:2.00\nExtra Sauce:0.50"}
                    className="w-full rounded-xl bg-admin-surface border border-admin-border text-xs sm:text-sm text-admin-text px-4 py-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all font-mono"
                  />
                  <p className="text-[11px] font-bold text-admin-text-muted mt-1 uppercase">Format: Name:Price (1 per line)</p>
                </div>
              </div>

              {/* AI Pricing */}
              <div className="bg-gradient-to-br from-brand/10 to-admin-surface p-5 rounded-2xl border border-brand/20 flex items-center justify-between shadow-2xs">
                <div>
                  <h4 className="text-sm font-bold font-heading text-brand">Smart Pricing</h4>
                  <p className="text-xs text-admin-text-secondary mt-0.5">Let AI optimize your prices based on demand</p>
                </div>
                <button 
                  onClick={handleSmartPricing}
                  className="flex items-center gap-1.5 bg-brand text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:brightness-110 transition-all shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Analyze
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 lg:p-6 border-t border-admin-border bg-admin-surface flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl border border-admin-border text-xs sm:text-sm font-bold text-admin-text bg-admin-surface hover:bg-admin-surface-light transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button 
            disabled={isSaving}
            onClick={handleSaveItem} 
            className={`px-6 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer ${isSaving ? 'bg-admin-text-muted cursor-not-allowed' : 'bg-brand hover:brightness-110 shadow-brand/20'}`}
          >
            <Save className="w-4 h-4" /> {item?._id ? 'Save Changes' : 'Create Item'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
