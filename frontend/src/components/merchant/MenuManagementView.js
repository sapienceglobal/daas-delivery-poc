import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Download, Plus, Edit3, Trash2, Flame, Leaf, Hexagon,
  CheckCircle2, XCircle, Info, ChevronDown, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui';

export default function MenuManagementView({ 
  menu = [], 
  onSaveItem, 
  onDeleteItem,
  onToggleStatus,
  onEditItem,
  onAddItem,
  onBulkImport,
  onBulkDelete,
  onBulkUpdate,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onMoveItem
}) {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Bulk selection state
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // SCROLLING LOGIC STATES & REFS
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => setMounted(true), []);

  // Handle Mouse Wheel for Horizontal Scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // Agar user up/down wheel ghuma raha hai (aur trackpad se horizontal scroll nahi kar raha)
      if (e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        container.scrollBy({ left: e.deltaY, behavior: 'auto' });
      }
    };

    // 'passive: false' zaroori hai taaki hum preventDefault() call kar sakein
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [mounted, menu]);

  // Check Scroll Position to Show/Hide Left-Right Buttons
  const checkForScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft) < scrollWidth - clientWidth - 2);
    }
  };

  useEffect(() => {
    checkForScrollPosition();
    window.addEventListener('resize', checkForScrollPosition);
    return () => window.removeEventListener('resize', checkForScrollPosition);
  }, [menu]);

  // Button Scroll Function
  const scrollByAmount = (amount) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Flatten items for easy filtering
  const allItems = useMemo(() => {
    return menu.reduce((acc, cat) => {
      const itemsWithCat = (cat.items || []).map(item => ({ ...item, categoryName: cat.name }));
      return [...acc, ...itemsWithCat];
    }, []);
  }, [menu]);

  const filteredItems = useMemo(() => {
    let items = allItems;
    if (activeCategory !== 'all') {
      items = items.filter(it => it.categoryId === activeCategory || it.categoryName === activeCategory);
    }
    if (searchQuery) {
      items = items.filter(it => it.name?.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      items = items.filter(it => (it.isAvailable !== false) === isActive);
    }
    if (typeFilter !== 'all') {
      const isVeg = typeFilter === 'veg';
      items = items.filter(it => (it.isVeg === true) === isVeg);
    }
    return items;
  }, [allItems, activeCategory, searchQuery, statusFilter, typeFilter]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newSelected = new Set(filteredItems.map(item => item._id));
      setSelectedItems(newSelected);
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (e, id) => {
    e.stopPropagation();
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  useEffect(() => {
    setSelectedItems(new Set());
  }, [activeCategory, searchQuery, statusFilter, typeFilter]);

  const isAllSelected = filteredItems.length > 0 && selectedItems.size === filteredItems.length;

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-black text-[#111827] tracking-tight">Menu Management</h2>
          <p className="text-sm text-[#6b7280] mt-1">Manage your restaurant menu, categories and items.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-2 bg-white border border-[#e5e7eb] px-4 py-2.5 rounded-xl text-sm font-bold text-[#374151] hover:bg-[#f9fafb] hover:border-[#d1d5db] transition-all shadow-sm">
            <input type="file" accept=".csv" className="hidden" onChange={onBulkImport} />
            <Download className="w-4 h-4" /> Import / Export
          </label>
          <button onClick={onAddItem} className="flex items-center gap-2 bg-[#8B0000] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#7f1d1d] hover:shadow-lg hover:shadow-red-900/20 transition-all">
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>
      </div>

      {/* 🚀 ENHANCED CATEGORY TABS WITH SCROLL BUTTONS 🚀 */}
      <div className="relative mb-4 shrink-0 group sticky top-[72px] z-[40] bg-[#F8FAFC] pt-4 pb-2 -mt-4 shadow-sm border-b border-transparent transition-all data-[stuck=true]:border-[#e5e7eb]">
        
        {/* Scrollable Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={checkForScrollPosition}
          className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar scroll-smooth"
        >
          <button 
            onClick={() => setActiveCategory('all')}
            className={`flex flex-col items-center justify-center min-w-[120px] py-4 rounded-2xl border-2 transition-all duration-200 shrink-0 ${activeCategory === 'all' ? 'border-[#fecaca] bg-[#fef2f2] text-[#8B0000] shadow-sm' : 'border-transparent bg-white text-[#4b5563] hover:border-[#e5e7eb] hover:bg-[#f9fafb] shadow-sm'}`}
          >
            <Hexagon className={`w-6 h-6 mb-2 ${activeCategory === 'all' ? 'text-[#8B0000]' : 'text-[#9ca3af]'}`} />
            <span className="text-sm font-bold">All Items</span>
            <span className="text-xs mt-1 font-semibold opacity-70">{allItems.length}</span>
          </button>
          
          {menu.map(cat => (
            <div
              key={cat._id}
              className="relative shrink-0 group/cat rounded-2xl transition-all"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#8B0000]', 'ring-offset-2'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-[#8B0000]', 'ring-offset-2'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-2', 'ring-[#8B0000]', 'ring-offset-2');
                const itemId = e.dataTransfer.getData('text/plain');
                if (itemId && onMoveItem) {
                  onMoveItem(itemId, cat._id);
                }
              }}
            >
              <button 
                onClick={() => setActiveCategory(cat._id)}
                className={`flex flex-col items-center justify-center w-full min-w-[120px] py-4 rounded-2xl border-2 transition-all duration-200 ${activeCategory === cat._id ? 'border-[#fecaca] bg-[#fef2f2] text-[#8B0000] shadow-sm' : 'border-transparent bg-white text-[#4b5563] hover:border-[#e5e7eb] hover:bg-[#f9fafb] shadow-sm'}`}
              >
                <Hexagon className={`w-6 h-6 mb-2 ${activeCategory === cat._id ? 'text-[#8B0000]' : 'text-[#f87171]'}`} />
                <span className="text-sm font-bold">{cat.name}</span>
                <span className="text-xs mt-1 font-semibold opacity-70">{cat.items?.length || 0}</span>
              </button>
              
              <div className="absolute top-2 right-2 opacity-0 group-hover/cat:opacity-100 transition-opacity flex gap-1">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditCategory && onEditCategory(cat); }}
                  className="p-1.5 bg-white rounded-md shadow-sm border border-[#e5e7eb] text-[#6b7280] hover:text-[#8B0000] transition-colors"
                  title="Edit Category"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteCategory && onDeleteCategory(cat._id); }}
                  className="p-1.5 bg-white rounded-md shadow-sm border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] transition-colors"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          <button 
            onClick={() => onAddCategory && onAddCategory()}
            className="flex flex-col items-center justify-center min-w-[120px] py-4 rounded-2xl border-2 border-dashed border-[#d1d5db] bg-white text-[#6b7280] hover:text-[#8B0000] hover:border-[#8B0000] hover:bg-[#fef2f2] transition-all duration-200 shrink-0"
          >
            <Plus className="w-6 h-6 mb-2" />
            <span className="text-sm font-bold">New Category</span>
          </button>
        </div>

        {/* Left Gradient & Button */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-2 w-20 bg-gradient-to-r from-[#F8FAFC] to-transparent z-20 flex items-center pointer-events-none">
            <button 
              onClick={() => scrollByAmount(-300)} 
              className="pointer-events-auto w-8 h-8 ml-1 flex items-center justify-center bg-white border border-[#e5e7eb] rounded-full shadow-md text-[#4b5563] hover:text-[#8B0000] hover:border-[#8B0000] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>
          </div>
        )}

        {/* Right Gradient & Button */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-2 w-20 bg-gradient-to-l from-[#F8FAFC] to-transparent z-20 flex items-center justify-end pointer-events-none">
            <button 
              onClick={() => scrollByAmount(300)} 
              className="pointer-events-auto w-8 h-8 mr-1 flex items-center justify-center bg-white border border-[#e5e7eb] rounded-full shadow-md text-[#4b5563] hover:text-[#8B0000] hover:border-[#8B0000] transition-colors"
            >
              <ChevronRight className="w-5 h-5 ml-0.5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 px-2 py-3 bg-[#e0f2fe]/50 border border-[#bae6fd] rounded-xl">
        <Info className="w-5 h-5 text-[#0284c7]" />
        <span className="text-sm font-bold text-[#0369a1]">💡 Tip: You can drag and drop items below directly onto any category tab above to move them between categories!</span>
      </div>

      {/* Action Bar & Search */}
      <div className="flex gap-4 mb-6 shrink-0 bg-white p-2 rounded-2xl shadow-sm border border-[#e5e7eb]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by item name..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full !pl-10 pr-4 py-2.5 bg-transparent rounded-xl text-sm text-[#111827] placeholder-[#9ca3af] focus:outline-none focus:border focus:border-[#8b0000]"
          />
        </div>
        <div className="h-6 w-px bg-[#e5e7eb] self-center"></div>
        <div className="relative">
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none px-4 py-2.5 pr-10 bg-transparent text-sm font-bold text-[#374151] outline-none cursor-pointer hover:bg-[#f9fafb] rounded-xl transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
        </div>
        <div className="h-6 w-px bg-[#e5e7eb] self-center"></div>
        <div className="relative">
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="appearance-none px-4 py-2.5 pr-10 bg-transparent text-sm font-bold text-[#374151] outline-none cursor-pointer hover:bg-[#f9fafb] rounded-xl transition-colors"
          >
            <option value="all">All Types</option>
            <option value="veg">Veg Only</option>
            <option value="nonveg">Non-Veg Only</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
        </div>
      </div>

      {/* Main Content Table */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#e5e7eb] flex flex-col overflow-hidden relative">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#f9fafb] border-b border-[#f3f4f6] sticky top-0 z-10">
              <tr className="text-xs font-bold text-[#6b7280] uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded !bg-white border-[#d1d5db] text-[#8B0000] focus:ring-[#8B0000] cursor-pointer"
                      style={{ backgroundColor: 'white' }}
                    />
                  </div>
                </th>
                <th className="p-4">Item Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Status</th>
                <th className="p-4">Type</th>
                <th className="p-4">Prep. Time</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f6]">
              {filteredItems.map((item) => {
                const isSelected = selectedItems.has(item._id);
                return (
                  <tr 
                    key={item._id} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', item._id);
                    }}
                    className={`transition-colors hover:bg-[#f9fafb] group cursor-grab active:cursor-grabbing ${isSelected ? 'bg-[#fef2f2]/50' : ''}`}
                  >
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(e, item._id)}
                          className="w-4 h-4 rounded !bg-white text-[#8B0000] focus:ring-[#8B0000] border-[#d1d5db] cursor-pointer" 
                          style={{ backgroundColor: 'white' }}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#f3f4f6] border border-[#e5e7eb] overflow-hidden shrink-0 shadow-sm">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#f9fafb] text-[#9ca3af] text-xs font-semibold uppercase">No img</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#111827]">{item.name}</p>
                          <p className="text-xs text-[#6b7280] mt-1 line-clamp-1">{item.description || 'No description provided.'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-[#f3f4f6] text-[#4b5563] rounded-lg text-xs font-bold whitespace-nowrap">
                        {item.categoryName || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 font-black text-[#111827] text-sm">${(item.price || 0).toFixed(2)}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => onToggleStatus && onToggleStatus(item._id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          item.isAvailable !== false 
                            ? 'bg-[#ecfdf5] text-[#059669] hover:bg-[#d1fae5]' 
                            : 'bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable !== false ? 'bg-[#10b981]' : 'bg-[#ef4444]'}`}></span>
                        {item.isAvailable !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#374151]">
                        {item.isVeg 
                          ? <Leaf className="w-4 h-4 text-[#22c55e]" /> 
                          : <Flame className="w-4 h-4 text-[#ef4444]" />
                        }
                        {item.isVeg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-semibold text-[#4b5563]">
                      {item.preparationTime ? `${item.preparationTime} min` : '15 min'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEditItem && onEditItem(item)} 
                          className="p-2 border border-[#e5e7eb] rounded-lg text-[#6b7280] hover:text-[#111827] hover:border-[#d1d5db] hover:bg-white shadow-sm transition-all"
                          title="Edit Item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteItem && onDeleteItem(item._id)} 
                          className="p-2 border border-[#fecaca] rounded-lg text-[#dc2626] hover:text-white hover:bg-[#dc2626] hover:border-[#dc2626] shadow-sm transition-all"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Info className="w-8 h-8 text-[#9ca3af] mb-3" />
                      <p className="text-[#374151] font-bold text-base">No items found</p>
                      <p className="text-[#6b7280] text-sm mt-1">Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#111827] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-[#374151]">
          <div className="flex items-center gap-2">
            <div className="bg-[#374151] w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
              {selectedItems.size}
            </div>
            <span className="text-sm font-semibold">Items Selected</span>
          </div>
          
          <div className="w-px h-6 bg-[#374151]"></div>
          
          <div className="flex items-center gap-3">
            <button 
              disabled={isProcessingBulk}
              onClick={async () => {
                setIsProcessingBulk(true);
                if (onBulkUpdate) await onBulkUpdate(Array.from(selectedItems), { isAvailable: true });
                setIsProcessingBulk(false);
              }}
              className={`flex items-center gap-2 text-sm font-bold text-[#d1fae5] px-3 py-1.5 rounded-lg transition-colors ${isProcessingBulk ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#ecfdf5] hover:bg-[#065f46]'}`}
            >
              {isProcessingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Mark Active
            </button>
            <button 
              disabled={isProcessingBulk}
              onClick={async () => {
                setIsProcessingBulk(true);
                if (onBulkUpdate) await onBulkUpdate(Array.from(selectedItems), { isAvailable: false });
                setIsProcessingBulk(false);
              }}
              className={`flex items-center gap-2 text-sm font-bold text-[#fef3c7] px-3 py-1.5 rounded-lg transition-colors ${isProcessingBulk ? 'opacity-50 cursor-not-allowed' : 'hover:text-[#fffbeb] hover:bg-[#92400e]'}`}
            >
              {isProcessingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Mark Inactive
            </button>
            <button 
              disabled={isProcessingBulk}
              onClick={async () => {
                setConfirmConfig({
                  isOpen: true,
                  title: 'Bulk Delete',
                  message: `Are you sure you want to delete ${selectedItems.size} items? This action cannot be undone.`,
                  onConfirm: async () => {
                    setIsProcessingBulk(true);
                    if (onBulkDelete) await onBulkDelete(Array.from(selectedItems));
                    setSelectedItems(new Set());
                    setIsProcessingBulk(false);
                  }
                });
              }}
              className={`flex items-center gap-2 text-sm font-bold text-[#fee2e2] px-3 py-1.5 rounded-lg transition-colors ml-2 ${isProcessingBulk ? 'opacity-50 cursor-not-allowed' : 'hover:text-white hover:bg-[#991b1b]'}`}
            >
              {isProcessingBulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        {...confirmConfig}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />
    </div>
  );
}