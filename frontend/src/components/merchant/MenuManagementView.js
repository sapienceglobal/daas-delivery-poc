import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Download, Plus, Edit3, Trash2, Flame, Leaf, Hexagon,
  CheckCircle2, XCircle, Info, ChevronDown, Loader2, ChevronLeft, ChevronRight,
  UtensilsCrossed
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui';
import { getCategory3DImage } from '@/lib/category3DHelper';
import PopOutCapsuleImage from '@/components/common/PopOutCapsuleImage';

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
  
  // bulk selection state
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // SCROLLING LOGIC STATES & REFS
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => setMounted(true), []);

  // handle Mouse Wheel for Horizontal Scrolling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      // convert vertical scroll to horizontal scroll
      if (e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault();
        container.scrollBy({ left: e.deltaY, behavior: 'auto' });
      }
    };

    // 'passive: false' is required to call preventDefault()
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [mounted, menu]);

  // check Scroll Position to Show/Hide Left-Right Buttons
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

  // button Scroll Function
  const scrollByAmount = (amount) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // flatten items for easy filtering
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

  const selectedItemsList = useMemo(() => {
    return allItems.filter(item => selectedItems.has(item._id));
  }, [allItems, selectedItems]);

  const allSelectedActive = selectedItemsList.length > 0 && selectedItemsList.every(it => it.isAvailable !== false);
  const allSelectedInactive = selectedItemsList.length > 0 && selectedItemsList.every(it => it.isAvailable === false);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full bg-transparent text-admin-text relative space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pt-2 px-1">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-admin-text tracking-tight">
            Menu Management
          </h1>
          <p className="text-xs sm:text-sm text-admin-text-secondary mt-1">
            Manage your restaurant menu, categories, pricing, and live availability.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <label className="cursor-pointer flex items-center gap-2 bg-admin-surface border border-admin-border px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-admin-text hover:bg-admin-surface-light transition-all shadow-2xs">
            <input type="file" accept=".csv" className="hidden" onChange={onBulkImport} />
            <Download className="w-4 h-4 text-admin-text-muted" /> Import / Export
          </label>
          <button 
            onClick={onAddItem} 
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:brightness-110 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>
      </div>

      {/* 🚀 ENHANCED CATEGORY TABS WITH SCROLL BUTTONS 🚀 */}
      <div className="relative shrink-0 sticky top-0 z-[40] bg-admin-bg/95 backdrop-blur-md py-2 border-b border-admin-border/50">
        
        {/* Scrollable Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={checkForScrollPosition}
          className="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-2 hide-scrollbar scroll-smooth px-2 items-start"
        >
          {/* 1. New Category Capsule (Starting position before All Items) */}
          <div className="shrink-0">
            <PopOutCapsuleImage
              label="New Category"
              icon={Plus}
              width={76}
              isSelected={false}
              onClick={() => onAddCategory && onAddCategory()}
            />
          </div>

          {/* 2. All Items Capsule */}
          <div className="shrink-0">
            <PopOutCapsuleImage
              label="All Items"
              icon={UtensilsCrossed}
              width={76}
              isSelected={activeCategory === 'all'}
              itemCount={allItems.length}
              onClick={() => setActiveCategory('all')}
            />
          </div>
          
          {/* 3. Dynamic Categories */}
          {menu.map(cat => (
            <div
              key={cat._id}
              className="relative shrink-0 group/cat"
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('scale-105'); }}
              onDragLeave={(e) => { e.currentTarget.classList.remove('scale-105'); }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('scale-105');
                const itemId = e.dataTransfer.getData('text/plain');
                if (itemId && onMoveItem) {
                  onMoveItem(itemId, cat._id);
                }
              }}
            >
              <PopOutCapsuleImage
                category={cat}
                width={76}
                isSelected={activeCategory === cat._id}
                itemCount={cat.items?.length || 0}
                onClick={() => setActiveCategory(cat._id)}
              />
              
              {/* Category Quick Actions (Edit / Delete) */}
              <div className="absolute top-0 right-1 opacity-0 group-hover/cat:opacity-100 transition-opacity flex gap-1 z-30">
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onEditCategory && onEditCategory(cat); }}
                  className="p-1.5 bg-white dark:bg-admin-surface rounded-full shadow-md border border-admin-border text-admin-text-secondary hover:text-brand transition-colors cursor-pointer"
                  title="Edit Category"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDeleteCategory && onDeleteCategory(cat._id); }}
                  className="p-1.5 bg-white dark:bg-admin-surface rounded-full shadow-md border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title="Delete Category"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Left Gradient & Button */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-2 w-16 bg-gradient-to-r from-admin-bg to-transparent z-20 flex items-center pointer-events-none">
            <button 
              onClick={() => scrollByAmount(-300)} 
              className="pointer-events-auto w-8 h-8 ml-1 flex items-center justify-center bg-admin-surface border border-admin-border rounded-full shadow-md text-admin-text hover:text-brand hover:bg-admin-surface-light transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right Gradient & Button */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-admin-bg to-transparent z-20 flex items-center justify-end pointer-events-none">
            <button 
              onClick={() => scrollByAmount(300)} 
              className="pointer-events-auto w-8 h-8 mr-1 flex items-center justify-center bg-admin-surface border border-admin-border rounded-full shadow-md text-admin-text hover:text-brand hover:bg-admin-surface-light transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-600 dark:text-blue-400">
        <Info className="w-4 h-4 shrink-0 text-blue-500" />
        <span className="text-xs sm:text-sm font-semibold">💡 Tip: You can drag and drop items below directly onto any category tab above to move them between categories!</span>
      </div>

      {/* Action Bar & Search */}
      <div className="flex flex-wrap gap-3.5 bg-admin-card p-2 rounded-2xl shadow-sm border border-admin-border shrink-0 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-admin-text-muted pointer-events-none" />
          <input 
            type="text" 
            placeholder="Search by item name..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent rounded-xl text-xs sm:text-sm text-admin-text placeholder:text-admin-text-muted focus:outline-none"
          />
        </div>
        <div className="hidden sm:block h-6 w-px bg-admin-border self-center"></div>
        <div className="relative">
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="appearance-none px-3.5 py-2 pr-9 bg-admin-surface text-xs font-semibold text-admin-text outline-none cursor-pointer border border-admin-border rounded-xl hover:border-brand/40 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-admin-text-muted pointer-events-none" />
        </div>
        <div className="relative">
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="appearance-none px-3.5 py-2 pr-9 bg-admin-surface text-xs font-semibold text-admin-text outline-none cursor-pointer border border-admin-border rounded-xl hover:border-brand/40 transition-colors"
          >
            <option value="all">All Types</option>
            <option value="veg">Veg Only</option>
            <option value="nonveg">Non-Veg Only</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-admin-text-muted pointer-events-none" />
        </div>
      </div>

      {/* Main Content Table */}
      <div className="flex-1 bg-admin-card rounded-2xl shadow-sm border border-admin-border flex flex-col overflow-hidden relative">
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-admin-surface-light border-b border-admin-border sticky top-0 z-10">
              <tr className="text-xs font-bold text-admin-text-secondary uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <div className="flex items-center justify-center">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-admin-border text-brand focus:ring-brand accent-brand cursor-pointer"
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
            <tbody className="divide-y divide-admin-border">
              {filteredItems.map((item) => {
                const isSelected = selectedItems.has(item._id);
                return (
                  <tr 
                    key={item._id} 
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', item._id);
                    }}
                    className={`transition-colors hover:bg-admin-surface-light/40 group cursor-grab active:cursor-grabbing ${isSelected ? 'bg-brand/10' : ''}`}
                  >
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(e, item._id)}
                          className="w-4 h-4 rounded border-admin-border text-brand focus:ring-brand accent-brand cursor-pointer"
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-admin-surface-light border border-admin-border overflow-hidden shrink-0 shadow-2xs">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-admin-surface text-admin-text-muted text-[10px] font-semibold uppercase">No img</div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-admin-text group-hover:text-brand transition-colors">{item.name}</p>
                          <p className="text-xs text-admin-text-secondary mt-0.5 line-clamp-1">{item.description || 'No description provided.'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-admin-surface-light border border-admin-border text-admin-text-secondary rounded-lg text-xs font-semibold whitespace-nowrap">
                        {item.categoryName || 'N/A'}
                      </span>
                    </td>
                    <td className="p-4 font-bold font-heading text-admin-text text-sm">${(item.price || 0).toFixed(2)}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => onToggleStatus && onToggleStatus(item._id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          item.isAvailable !== false 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isAvailable !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {item.isAvailable !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-admin-text">
                        {item.isVeg 
                          ? <Leaf className="w-3.5 h-3.5 text-emerald-500" /> 
                          : <Flame className="w-3.5 h-3.5 text-rose-500" />
                        }
                        {item.isVeg ? 'Veg' : 'Non-Veg'}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-admin-text-secondary">
                      {item.preparationTime ? `${item.preparationTime} min` : '15 min'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onEditItem && onEditItem(item)} 
                          className="p-1.5 border border-admin-border rounded-lg text-admin-text-secondary hover:text-admin-text hover:bg-admin-surface shadow-2xs transition-all cursor-pointer"
                          title="Edit Item"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDeleteItem && onDeleteItem(item._id)} 
                          className="p-1.5 border border-rose-500/20 rounded-lg text-rose-500 hover:text-white hover:bg-rose-600 hover:border-rose-600 shadow-2xs transition-all cursor-pointer"
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
                    <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-admin-border rounded-xl bg-admin-surface-light/30 max-w-sm mx-auto">
                      <Info className="w-8 h-8 text-admin-text-muted mb-2" />
                      <p className="text-admin-text font-bold text-sm">No items found</p>
                      <p className="text-admin-text-secondary text-xs mt-1">Try adjusting your filters or search query.</p>
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
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900/95 dark:bg-[#0f172a]/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-in slide-in-from-bottom-5 border border-slate-700/60">
          <div className="flex items-center gap-2">
            <div className="bg-white/10 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold">
              {selectedItems.size}
            </div>
            <span className="text-xs font-semibold text-slate-200">Selected</span>
          </div>
          
          <div className="w-px h-5 bg-white/20"></div>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={isProcessingBulk || allSelectedActive}
              onClick={async () => {
                if (allSelectedActive) return;
                setIsProcessingBulk(true);
                if (onBulkUpdate) await onBulkUpdate(Array.from(selectedItems), { isAvailable: true });
                setSelectedItems(new Set());
                setIsProcessingBulk(false);
              }}
              title={allSelectedActive ? 'Selected item(s) are already active' : 'Mark Active'}
              className={`flex items-center gap-1.5 text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                isProcessingBulk || allSelectedActive
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:text-emerald-300 hover:bg-emerald-500/20'
              }`}
            >
              {isProcessingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Mark Active
            </button>
            <button 
              disabled={isProcessingBulk || allSelectedInactive}
              onClick={async () => {
                if (allSelectedInactive) return;
                setIsProcessingBulk(true);
                if (onBulkUpdate) await onBulkUpdate(Array.from(selectedItems), { isAvailable: false });
                setSelectedItems(new Set());
                setIsProcessingBulk(false);
              }}
              title={allSelectedInactive ? 'Selected item(s) are already inactive' : 'Mark Inactive'}
              className={`flex items-center gap-1.5 text-xs font-bold text-amber-400 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                isProcessingBulk || allSelectedInactive
                  ? 'opacity-30 cursor-not-allowed'
                  : 'hover:text-amber-300 hover:bg-amber-500/20'
              }`}
            >
              {isProcessingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Mark Inactive
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
              className={`flex items-center gap-1.5 text-xs font-bold text-rose-400 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${isProcessingBulk ? 'opacity-50 cursor-not-allowed' : 'hover:text-rose-300 hover:bg-rose-500/20'}`}
            >
              {isProcessingBulk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
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