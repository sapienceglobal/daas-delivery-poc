import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Download, Plus, Filter, MoreVertical, 
  Edit3, Copy, Trash2, Clock, Flame, Leaf, Hexagon
} from 'lucide-react';

export default function MenuManagementView({ 
  menu = [], 
  onSaveItem, 
  onDeleteItem,
  onToggleStatus,
  onEditItem,
  onAddItem,
  onBulkImport
}) {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemId, setSelectedItemId] = useState(null);

  useEffect(() => setMounted(true), []);

  // Flatten items for easy filtering
  const allItems = useMemo(() => {
    return menu.reduce((acc, cat) => {
      const itemsWithCat = (cat.items || []).map(item => ({ ...item, categoryName: cat.name }));
      return [...acc, ...itemsWithCat];
    }, []);
  }, [menu]);

  // Set default selected item
  useEffect(() => {
    if (!selectedItemId && allItems.length > 0) {
      setSelectedItemId(allItems[0]._id);
    }
  }, [allItems, selectedItemId]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (activeCategory !== 'all') {
      items = items.filter(it => it.categoryId === activeCategory || it.categoryName === activeCategory);
    }
    if (searchQuery) {
      items = items.filter(it => it.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return items;
  }, [allItems, activeCategory, searchQuery]);

  const selectedItem = useMemo(() => {
    return allItems.find(it => it._id === selectedItemId) || allItems[0];
  }, [allItems, selectedItemId]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-[#111827]">Menu Management</h2>
          <p className="text-sm text-[#6b7280]">Manage your restaurant menu, categories and items.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-2 bg-white border border-[#e5e7eb] px-4 py-2 rounded-lg text-sm font-bold text-[#374151] hover:bg-[#f9fafb]">
            <input type="file" accept=".csv" className="hidden" onChange={onBulkImport} />
            <Download className="w-4 h-4" /> Import / Export
          </label>
          <button onClick={onAddItem} className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#7f1d1d] transition-colors">
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex overflow-x-auto gap-4 pb-2 mb-4 custom-scrollbar shrink-0">
        <button 
          onClick={() => setActiveCategory('all')}
          className={`flex flex-col items-center justify-center min-w-[120px] py-4 rounded-xl border-2 transition-all ${activeCategory === 'all' ? 'border-[#fecaca] bg-[#fef2f2] text-[#8B0000]' : 'border-transparent bg-white text-[#4b5563] hover:border-[#e5e7eb]'}`}
        >
          <Hexagon className={`w-6 h-6 mb-2 ${activeCategory === 'all' ? 'text-[#8B0000]' : 'text-[#9ca3af]'}`} />
          <span className="text-sm font-bold">All Items</span>
          <span className="text-xs mt-1 font-medium">{allItems.length}</span>
        </button>
        {menu.map(cat => (
          <button 
            key={cat._id}
            onClick={() => setActiveCategory(cat._id)}
            className={`flex flex-col items-center justify-center min-w-[120px] py-4 rounded-xl border-2 transition-all ${activeCategory === cat._id ? 'border-[#fecaca] bg-[#fef2f2] text-[#8B0000]' : 'border-transparent bg-white text-[#4b5563] hover:border-[#e5e7eb] shadow-sm'}`}
          >
            <Hexagon className={`w-6 h-6 mb-2 ${activeCategory === cat._id ? 'text-[#8B0000]' : 'text-[#f87171]'}`} />
            <span className="text-sm font-bold">{cat.name}</span>
            <span className="text-xs mt-1 font-medium">{cat.items?.length || 0}</span>
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex gap-4 mb-6 shrink-0 bg-white p-3 rounded-xl shadow-sm border border-[#e5e7eb]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
          <input 
            type="text" 
            placeholder="Search by item name..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border-[#fca5a5]"
          />
        </div>
        <select className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-medium text-[#374151] outline-none">
          <option>All Categories</option>
        </select>
        <select className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-medium text-[#374151] outline-none">
          <option>All Status</option>
        </select>
        <select className="px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-medium text-[#374151] outline-none">
          <option>All Types</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e7eb] rounded-lg text-sm font-bold text-[#374151] hover:bg-[#f9fafb]">
          <Filter className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        
        {/* Left Column - Data Table */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-[#e5e7eb] flex flex-col overflow-hidden">
          <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-white border-b border-[#f3f4f6] sticky top-0 z-10">
                <tr className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider">
                  <th className="p-4 w-12 text-center"><input type="checkbox" className="rounded border-[#d1d5db]" /></th>
                  <th className="p-4">Item Name</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Prep. Time</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f9fafb]">
                {filteredItems.map((item) => (
                  <tr 
                    key={item._id} 
                    onClick={() => setSelectedItemId(item._id)}
                    className={`cursor-pointer transition-colors ${selectedItemId === item._id ? 'bg-[#fef2f2]/50' : 'hover:bg-[#f9fafb]'}`}
                  >
                    <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" className="rounded border-[#d1d5db]" />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#f3f4f6] overflow-hidden shrink-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#e5e7eb] text-[#9ca3af] text-xs">No img</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111827]">{item.name}</p>
                          <p className="text-[10px] text-[#6b7280] mt-0.5">{item.description?.slice(0, 30) || 'Standard'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-[#fef2f2] text-[#dc2626] rounded text-xs font-bold whitespace-nowrap">
                        {item.categoryName || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-[#111827]">${(item.price || 0).toFixed(2)}</td>
                    <td className="p-4" onClick={(e) => { e.stopPropagation(); onToggleStatus && onToggleStatus(item._id); }}>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${item.isAvailable !== false ? 'bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7]' : 'bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable !== false ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`}></span>
                        {item.isAvailable !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#374151]">
                        {item.isVeg ? <Leaf className="w-3.5 h-3.5 text-[#22c55e]" /> : <Flame className="w-3.5 h-3.5 text-[#ef4444]" />}
                        {item.isVeg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-medium text-[#4b5563]">
                      {item.preparationTime ? `${item.preparationTime} min` : '15 min'}
                    </td>
                    <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => onEditItem && onEditItem(item)} className="p-1.5 border border-[#e5e7eb] rounded text-[#9ca3af] hover:text-[#374151] hover:bg-[#f9fafb]">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-[#6b7280] text-sm">No items found matching your criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Footer */}
          <div className="p-4 border-t border-[#f3f4f6] flex items-center justify-between text-xs text-[#6b7280]">
            <span>Showing 1 to {filteredItems.length} of {allItems.length} items</span>
          </div>
        </div>

        {/* Right Column - Item Preview */}
        {selectedItem && (
          <div className="w-[340px] bg-white rounded-xl shadow-sm border border-[#e5e7eb] flex flex-col overflow-y-auto custom-scrollbar shrink-0">
            
            {/* Preview Header & Image */}
            <div className="p-6 pb-4 border-b border-[#f3f4f6]">
              <div className="flex justify-between items-start mb-4">
                <div className="w-20 h-20 rounded-xl bg-[#f3f4f6] overflow-hidden shadow-sm">
                  {selectedItem.image ? (
                    <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#9ca3af]">No Img</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div onClick={() => onToggleStatus && onToggleStatus(selectedItem._id)} className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${selectedItem.isAvailable !== false ? 'bg-[#22c55e]' : 'bg-[#e5e7eb]'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${selectedItem.isAvailable !== false ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${selectedItem.isAvailable !== false ? 'text-[#16a34a]' : 'text-[#9ca3af]'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedItem.isAvailable !== false ? 'bg-[#22c55e]' : 'bg-[#9ca3af]'}`}></span>
                    {selectedItem.isAvailable !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <h2 className="text-lg font-bold text-[#111827] mb-2">{selectedItem.name}</h2>
              <div className="flex gap-4 text-xs font-bold text-[#6b7280]">
                <span className="flex items-center gap-1.5"><Hexagon className="w-3.5 h-3.5 text-[#f87171]" /> {selectedItem.categoryName}</span>
                <span className="flex items-center gap-1.5">{selectedItem.isVeg ? <Leaf className="w-3.5 h-3.5 text-[#22c55e]" /> : <Flame className="w-3.5 h-3.5 text-[#ef4444]" />}{selectedItem.isVeg ? 'Veg' : 'Non-Veg'}</span>
              </div>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* Description */}
              <div>
                <h4 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-2">Description</h4>
                <p className="text-xs text-[#4b5563] leading-relaxed">
                  {selectedItem.description || 'No description provided.'}
                </p>
              </div>

              {/* Price & Variations */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-2">Price</h4>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-[#6b7280]">Regular Price</span><span className="font-bold text-[#111827]">${(selectedItem.price || 0).toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-[#6b7280]">Cost Price</span><span className="font-bold text-[#111827]">${((selectedItem.price || 0) * 0.45).toFixed(2)}</span></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-2 flex justify-between">
                    Variations <span className="text-[#dc2626] font-medium">({selectedItem.sizeVariations?.length || 0})</span>
                  </h4>
                  <div className="space-y-1.5 text-xs">
                    {(selectedItem.sizeVariations || []).map((v, i) => (
                      <div key={i} className="flex justify-between"><span className="text-[#6b7280] truncate pr-2">{v.name}</span><span className="font-bold text-[#111827]">${(v.price || 0).toFixed(2)}</span></div>
                    ))}
                    {(!selectedItem.sizeVariations || selectedItem.sizeVariations.length === 0) && <span className="text-[#9ca3af] italic">None</span>}
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div>
                <h4 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-2">Availability</h4>
                <div className="flex justify-between text-xs pb-3 border-b border-[#f3f4f6]">
                  <span className="text-[#374151]">Everyday</span>
                  <span className="text-[#6b7280]">11:00 AM - 11:00 PM</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#ef4444]" /> Preparation Time
                  </h4>
                  <p className="text-sm font-bold text-[#111827]">{selectedItem.preparationTime || 15} min</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#ef4444]" /> Calories
                  </h4>
                  <p className="text-sm font-bold text-[#111827]">{selectedItem.calories || 320} kcal</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 pt-0 mt-auto space-y-2">
              <button onClick={() => onEditItem && onEditItem(selectedItem)} className="w-full bg-[#8B0000] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#7f1d1d] transition-colors flex justify-center items-center gap-2 shadow-sm">
                <Edit3 className="w-4 h-4" /> Edit Item
              </button>
              <button onClick={() => { if (onAddItem) { onAddItem(); if (onEditItem) { const duplicate = { ...selectedItem, _id: null, name: selectedItem.name + ' (Copy)' }; onEditItem(duplicate); } } }} className="w-full bg-white border border-[#e5e7eb] text-[#8B0000] py-3 rounded-lg text-sm font-bold hover:bg-[#f9fafb] transition-colors flex justify-center items-center gap-2">
                <Copy className="w-4 h-4" /> Duplicate Item
              </button>
              <button onClick={() => onDeleteItem && onDeleteItem(selectedItem._id)} className="w-full bg-white border border-[#fee2e2] text-[#ef4444] py-3 rounded-lg text-sm font-bold hover:bg-[#fef2f2] transition-colors flex justify-center items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete Item
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
