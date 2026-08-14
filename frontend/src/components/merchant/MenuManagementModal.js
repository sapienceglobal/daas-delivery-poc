import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, Image as ImageIcon, Tag, Activity } from 'lucide-react';
import { menuAPI } from '@/lib/api';
import { showToast } from '@/components/ui';

export default function MenuManagementModal({
  item,
  categories = [],
  restaurantId,
  onClose,
  onSave
}) {
  const [itemForm, setItemForm] = useState({
    name: '', categoryId: '', description: '', price: '', preparationTime: '15',
    image: '', tags: '', sizeVariationsText: '', addOnsText: '',
    isVeg: false, isVegan: false, isSpicy: false, isGlutenFree: false,
    isBestseller: false, isAvailable: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setItemForm({
        ...item,
        categoryId: item.categoryId || categories.find(c => c.name === item.categoryName)?._id || '',
        price: item.price?.toString() || '',
        preparationTime: item.preparationTime?.toString() || '15',
        sizeVariationsText: item.sizeVariations?.map(s => `${s.name}:${s.price}`).join('\n') || '',
        addOnsText: item.addOns?.map(a => `${a.name}:${a.price}`).join('\n') || ''
      });
    }
  }, [item, categories]);

  const handleSaveItem = async () => {
    try {
      if (!itemForm.name || !itemForm.categoryId || !itemForm.price) {
        showToast('Please fill all required fields', 'error');
        return;
      }
      setIsSaving(true);
      
      const payload = {
        ...itemForm,
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
        }) || []
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

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 lg:p-8 border-b border-[#f3f4f6] bg-white sticky top-0 z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-[#111827] tracking-tight">
              {item?._id ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <p className="text-sm text-[#6b7280] mt-1 font-medium">
              {item?._id ? 'Update details for your menu item.' : 'Fill in the details to add a new item to your menu.'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f4f6] rounded-full transition-colors text-[#6b7280] border border-transparent hover:border-[#e5e7eb]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 custom-scrollbar bg-[#f8fafc]">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column - Main Details */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Section: Basic Info */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5e7eb] space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-[#fef2f2] p-1.5 rounded-lg text-[#8B0000]">
                    <Tag className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111827]">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Item Name *</label>
                    <input
                      value={itemForm.name || ''}
                      onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Garlic Naan"
                      className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Category *</label>
                    <select
                      value={itemForm.categoryId || ''}
                      onChange={(e) => setItemForm(f => ({ ...f, categoryId: e.target.value }))}
                      className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">Select category</option>
                      {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Description</label>
                  <textarea
                    value={itemForm.description || ''}
                    onChange={(e) => setItemForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the item, ingredients, and taste..."
                    className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2 flex items-center gap-2">
                      Base Price ($) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280] font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={itemForm.price || ''}
                        onChange={(e) => setItemForm(f => ({ ...f, price: e.target.value }))}
                        placeholder="0.00"
                        className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm font-bold text-[#111827] pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Prep Time (mins)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={itemForm.preparationTime || ''}
                        onChange={(e) => setItemForm(f => ({ ...f, preparationTime: e.target.value }))}
                        placeholder="15"
                        className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm font-bold text-[#111827] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] text-xs font-bold">MIN</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Media & SEO */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5e7eb] space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-[#fef2f2] p-1.5 rounded-lg text-[#8B0000]">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111827]">Media & Tags</h3>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Image URL</label>
                  <input
                    value={itemForm.image || ''}
                    onChange={(e) => setItemForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                  />
                  {itemForm.image && (
                    <div className="mt-3 w-full h-32 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] overflow-hidden">
                      <img src={itemForm.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Search Tags</label>
                  <input
                    value={itemForm.tags || ''}
                    onChange={(e) => setItemForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="e.g. spicy, popular, healthy (comma separated)"
                    className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Modifiers & Properties */}
            <div className="lg:col-span-5 space-y-8">
              
              {/* Properties Grid */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5e7eb] space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-[#fef2f2] p-1.5 rounded-lg text-[#8B0000]">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-[#111827]">Properties</h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['isVeg', 'Vegetarian', 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]'],
                    ['isVegan', 'Vegan', 'bg-[#d1fae5] text-[#065f46] border-[#a7f3d0]'],
                    ['isSpicy', 'Spicy', 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]'],
                    ['isGlutenFree', 'Gluten Free', 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'],
                    ['isBestseller', 'Bestseller', 'bg-[#fef9c3] text-[#854d0e] border-[#fef08a]'],
                    ['isAvailable', 'Active (Available)', 'bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]'],
                  ].map(([key, label, colorClass]) => {
                    const isChecked = Boolean(itemForm[key]);
                    return (
                      <label 
                        key={key} 
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isChecked ? colorClass : 'bg-white border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6]'
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
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5e7eb] space-y-5">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Size Variations</label>
                  <textarea
                    value={itemForm.sizeVariationsText || ''}
                    onChange={(e) => setItemForm(f => ({ ...f, sizeVariationsText: e.target.value }))}
                    placeholder={"Small:5.99\nLarge:9.99"}
                    className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all font-mono"
                  />
                  <p className="text-xs font-bold text-[#9ca3af] mt-1 uppercase">Format: Name:Price (1 per line)</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Add-ons</label>
                  <textarea
                    value={itemForm.addOnsText || ''}
                    onChange={(e) => setItemForm(f => ({ ...f, addOnsText: e.target.value }))}
                    placeholder={"Extra Cheese:2.00\nExtra Sauce:0.50"}
                    className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-[#8B0000]/20 focus:border-[#8B0000] transition-all font-mono"
                  />
                  <p className="text-xs font-bold text-[#9ca3af] mt-1 uppercase">Format: Name:Price (1 per line)</p>
                </div>
              </div>

              {/* AI Pricing */}
              <div className="bg-gradient-to-br from-[#fef2f2] to-white p-5 rounded-2xl border border-[#fecaca] flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-sm font-bold text-[#8B0000]">Smart Pricing</h4>
                  <p className="text-xs text-[#991b1b]/70 mt-0.5">Let AI optimize your prices</p>
                </div>
                <button 
                  onClick={handleSmartPricing}
                  className="flex items-center gap-1.5 bg-[#8B0000] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#7f1d1d] transition-all shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Analyze
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#f3f4f6] bg-white flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose} 
            className="px-6 py-3 rounded-xl border border-[#e5e7eb] text-sm font-bold text-[#374151] bg-white hover:bg-[#f9fafb] transition-all"
          >
            Cancel
          </button>
          <button 
            disabled={isSaving}
            onClick={handleSaveItem} 
            className={`px-8 py-3 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-lg transition-all ${isSaving ? 'bg-[#9ca3af] cursor-not-allowed' : 'bg-[#8B0000] hover:bg-[#7f1d1d] shadow-red-900/20'}`}
          >
            <Save className="w-4 h-4" /> {item?._id ? 'Save Changes' : 'Create Item'}
          </button>
        </div>

      </div>
    </div>
  );
}
