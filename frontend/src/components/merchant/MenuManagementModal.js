import React from 'react';
import { X, Save } from 'lucide-react';

export default function MenuManagementModal({
  isOpen,
  onClose,
  itemForm,
  setItemForm,
  menu,
  handleSaveItem,
  editingItemId,
  handleSmartPricing
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-[#f3f4f6]">
          <h2 className="text-xl font-bold text-[#111827]">
            {editingItemId ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#f3f4f6] rounded-full transition-colors text-[#6b7280]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Category *</label>
                <select
                  value={itemForm.categoryId || menu[0]?._id || ''}
                  onChange={(e) => setItemForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 focus:outline-none focus:border-[#fca5a5]"
                >
                  <option value="">Select category</option>
                  {menu.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Item Name *</label>
                <input
                  value={itemForm.name}
                  onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Garlic Naan"
                  className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 focus:outline-none focus:border-[#fca5a5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Delicious freshly baked naan..."
                  className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 h-24 resize-none focus:outline-none focus:border-[#fca5a5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => setItemForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="9.99"
                    className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 focus:outline-none focus:border-[#fca5a5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Prep Time (min)</label>
                  <input
                    type="number"
                    value={itemForm.preparationTime}
                    onChange={(e) => setItemForm(f => ({ ...f, preparationTime: e.target.value }))}
                    placeholder="15"
                    className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 focus:outline-none focus:border-[#fca5a5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Image URL</label>
                <input
                  value={itemForm.image}
                  onChange={(e) => setItemForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="https://..."
                  className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 focus:outline-none focus:border-[#fca5a5]"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Variations</label>
                <textarea
                  value={itemForm.sizeVariationsText}
                  onChange={(e) => setItemForm(f => ({ ...f, sizeVariationsText: e.target.value }))}
                  placeholder={'Half:5.99\nFull:9.99'}
                  className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 h-20 resize-none focus:outline-none focus:border-[#fca5a5]"
                />
                <p className="text-[10px] text-[#9ca3af] mt-1">Format: Name:Price (one per line)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Add-ons</label>
                <textarea
                  value={itemForm.addOnsText}
                  onChange={(e) => setItemForm(f => ({ ...f, addOnsText: e.target.value }))}
                  placeholder={'Extra Cheese:2.00\nSauce:0.50'}
                  className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 h-20 resize-none focus:outline-none focus:border-[#fca5a5]"
                />
                <p className="text-[10px] text-[#9ca3af] mt-1">Format: Name:Price (one per line)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] uppercase tracking-wider mb-2">Properties & Tags</label>
                <input
                  value={itemForm.tags}
                  onChange={(e) => setItemForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="Tags: spicy, bestseller, etc."
                  className="w-full rounded-xl bg-[#f9fafb] border border-[#e5e7eb] text-sm text-[#111827] px-4 py-3 mb-3 focus:outline-none focus:border-[#fca5a5]"
                />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['isVeg', 'Vegetarian'],
                    ['isVegan', 'Vegan'],
                    ['isSpicy', 'Spicy'],
                    ['isGlutenFree', 'Gluten Free'],
                    ['isBestseller', 'Bestseller'],
                    ['isAvailable', 'Available (Active)'],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 p-3 rounded-xl border border-[#e5e7eb] cursor-pointer hover:bg-[#f9fafb]">
                      <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${itemForm[key] ? 'bg-[#8B0000] border-[#8B0000]' : 'border-2 border-[#d1d5db] bg-white'}`}>
                        {itemForm[key] && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={Boolean(itemForm[key])}
                        onChange={(e) => setItemForm(f => ({ ...f, [key]: e.target.checked }))}
                      />
                      <span className="text-xs font-bold text-[#374151]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
          </div>
        </div>

        <div className="p-6 border-t border-[#f3f4f6] bg-[#f9fafb] flex justify-between items-center">
          <button 
            onClick={handleSmartPricing} 
            className="text-xs font-bold text-[#8B0000] bg-[#fef2f2] px-4 py-2 rounded-lg hover:bg-[#fee2e2] transition-colors"
          >
            ✨ AI Price Optimizer
          </button>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              className="px-6 py-3 rounded-xl border border-[#d1d5db] text-sm font-bold text-[#374151] bg-white hover:bg-[#f9fafb] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                handleSaveItem();
              }} 
              className="px-6 py-3 rounded-xl bg-[#8B0000] text-white text-sm font-bold hover:bg-[#7f1d1d] transition-colors flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" /> {editingItemId ? 'Save Changes' : 'Create Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
