'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  ArrowLeft,
  X,
  History,
  Flame,
  ChevronRight,
  Plus,
  Minus,
  SlidersHorizontal,
  Sparkles,
  ShoppingBag,
  Filter,
} from 'lucide-react';
import { restaurantAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useBrand } from '@/context/BrandContext';
import { getDishImage } from '@/components/profile/profileUtils';
import { resolveImageUrl } from '@/lib/slugUtils';
import { ItemDetailModal } from '@/components/ui';

const BRANDED_ID =
  process.env.NEXT_PUBLIC_BRANDED_RESTAURANT_ID ||
  (process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true' ? 'lassi-lounge' : 'bhatura-and-co');

// Local storage key for search history
const RECENT_SEARCHES_KEY = 'restaurant_recent_searches';

export default function SearchScreenView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { items: cartItems = [], addItem, updateQuantity, removeItem, openCart } = useCart();
  const { brand } = useBrand();

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentSearches, setRecentSearches] = useState([]);

  // Active filters
  const [dietaryFilter, setDietaryFilter] = useState('All'); // 'All' | 'Veg' | 'Non-Veg'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('Default'); // 'Default' | 'Price: Low to High' | 'Price: High to Low' | 'Popularity'

  // Item detail modal
  const [selectedItem, setSelectedItem] = useState(null);

  const inputRef = useRef(null);

  // Auto focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Sync debounced query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentSearches(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Save to recent searches
  const saveRecentSearch = (searchTerm) => {
    const term = searchTerm.trim();
    if (!term) return;
    try {
      setRecentSearches((prev) => {
        const filtered = prev.filter((s) => s.toLowerCase() !== term.toLowerCase());
        const updated = [term, ...filtered].slice(0, 10);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      /* ignore */
    }
  };

  const removeRecentSearch = (searchTerm, e) => {
    e?.stopPropagation();
    try {
      setRecentSearches((prev) => {
        const updated = prev.filter((s) => s !== searchTerm);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      /* ignore */
    }
  };

  const clearAllRecentSearches = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch {
      /* ignore */
    }
  };

  // Fetch full restaurant menu data
  useEffect(() => {
    let alive = true;
    setLoading(true);
    restaurantAPI
      .getById(BRANDED_ID)
      .then((res) => {
        if (!alive) return;
        const rawMenu = res?.data?.menu || [];
        setMenu(rawMenu);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load menu for search:', err);
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Flatten all available items with their category reference
  const allDishes = useMemo(() => {
    const list = [];
    const seen = new Set();
    menu.forEach((category) => {
      const catName = category.name || category.title || 'General';
      const items = category.items || [];
      items.forEach((item) => {
        if (item.isAvailable === false) return;
        const key = item._id || item.id || item.name;
        if (!key || seen.has(key)) return;
        seen.add(key);
        list.push({
          ...item,
          categoryName: catName,
        });
      });
    });
    return list;
  }, [menu]);

  // Rank items for popular & trending sections (matching customer app logic)
  const { popularDishes, trendingDishes } = useMemo(() => {
    const sorted = [...allDishes].sort((a, b) => {
      const aBest = a.isBestseller ? 0 : 1;
      const bBest = b.isBestseller ? 0 : 1;
      if (aBest !== bBest) return aBest - bBest;
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;
      return priceB - priceA;
    });

    const popular = sorted.slice(0, 8);
    const trending = sorted.slice(8, 13);
    return {
      popularDishes: popular,
      trendingDishes: trending.length > 0 ? trending : sorted.slice(0, 5),
    };
  }, [allDishes]);

  // Filtered search results
  const searchResults = useMemo(() => {
    if (!debouncedQuery) return [];

    const q = debouncedQuery.toLowerCase().trim();
    let results = allDishes.filter((dish) => {
      const name = (dish.name || '').toLowerCase();
      const cat = (dish.categoryName || '').toLowerCase();
      const tags = Array.isArray(dish.tags) ? dish.tags.join(' ').toLowerCase() : '';
      if (name.includes(q) || cat.includes(q) || tags.includes(q)) return true;

      // In description, match whole word or prefix of a word to avoid substring false-positives
      const desc = (dish.description || '').toLowerCase();
      const words = desc.split(/[\s,.-]+/);
      return words.some((w) => w.startsWith(q));
    });

    // Dietary filter
    if (dietaryFilter === 'Veg') {
      results = results.filter((dish) => dish.isVeg === true || dish.isVegetarian === true);
    } else if (dietaryFilter === 'Non-Veg') {
      results = results.filter((dish) => dish.isVeg === false || dish.isVegetarian === false);
    }

    // Category filter
    if (selectedCategory !== 'All') {
      results = results.filter((dish) => dish.categoryName === selectedCategory);
    }

    // Sorting
    if (sortBy === 'Price: Low to High') {
      results.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortBy === 'Price: High to Low') {
      results.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else if (sortBy === 'Popularity') {
      results.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
    } else {
      // Default: Prioritize Name matches (prefix first, then contains), then bestsellers
      results.sort((a, b) => {
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aScore = aName.startsWith(q) ? 4 : (aName.includes(q) ? 3 : (a.categoryName?.toLowerCase().includes(q) ? 2 : 1));
        const bScore = bName.startsWith(q) ? 4 : (bName.includes(q) ? 3 : (b.categoryName?.toLowerCase().includes(q) ? 2 : 1));
        if (aScore !== bScore) return bScore - aScore;
        const aBest = a.isBestseller ? 1 : 0;
        const bBest = b.isBestseller ? 1 : 0;
        return bBest - aBest;
      });
    }

    return results;
  }, [debouncedQuery, allDishes, dietaryFilter, selectedCategory, sortBy]);

  // Distinct matching categories in search results
  const matchingCategories = useMemo(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    const matched = new Set();
    allDishes.forEach((d) => {
      if (
        (d.name || '').toLowerCase().includes(q) ||
        (d.categoryName || '').toLowerCase().includes(q)
      ) {
        matched.add(d.categoryName);
      }
    });
    return Array.from(matched);
  }, [debouncedQuery, allDishes]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      inputRef.current?.blur();
    }
  };

  const handleSelectRecentOrPopular = (searchTerm) => {
    setQuery(searchTerm);
    setDebouncedQuery(searchTerm);
    saveRecentSearch(searchTerm);
    inputRef.current?.focus();
  };

  // Live Cart helpers
  const getCartQuantity = (dishId) => {
    const found = cartItems.find((i) => i.id === dishId || i._id === dishId);
    return found ? found.quantity : 0;
  };

  const handleAddToCart = (dish, e) => {
    e?.stopPropagation();
    // If dish has mandatory customizations or options, open detail modal
    if (dish.options?.length > 0 || dish.variants?.length > 0 || dish.addOns?.length > 0) {
      setSelectedItem(dish);
      return;
    }
    addItem({
      ...dish,
      id: dish._id || dish.id,
      quantity: 1,
    });
  };

  const handleIncrement = (dish, e) => {
    e?.stopPropagation();
    const currentQty = getCartQuantity(dish._id || dish.id);
    updateQuantity(dish._id || dish.id, currentQty + 1);
  };

  const handleDecrement = (dish, e) => {
    e?.stopPropagation();
    const currentQty = getCartQuantity(dish._id || dish.id);
    if (currentQty <= 1) {
      removeItem(dish._id || dish.id);
    } else {
      updateQuantity(dish._id || dish.id, currentQty - 1);
    }
  };

  // Safe Back Navigation
  const handleBack = () => {
    if (query) {
      setQuery('');
      setDebouncedQuery('');
    } else {
      router.back();
    }
  };

  const handleCancel = () => {
    setQuery('');
    setDebouncedQuery('');
    router.back();
  };

  // Total cart items count
  const cartTotalCount = cartItems.reduce((acc, i) => acc + (i.quantity || 1), 0);

  return (
    <div className="min-h-screen bg-[#FAF3E8] text-[#1C1917] flex flex-col font-sans selection:bg-[#680D13]/20">
      {/* ═══════════════════════════════════════════════════════════════════
          1. TOP APP-STYLE SEARCH BAR (Exact match to Customer Mobile App)
         ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-[#FAF3E8]/95 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#EADFCF]/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5 sm:gap-3.5">
          {/* Back Circular Button */}
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-[#7A0B10] flex items-center justify-center shadow-[0_2px_10px_rgba(0,0,0,0.08)] border border-stone-200/60 hover:bg-stone-50 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            <ArrowLeft size={19} strokeWidth={2.4} />
          </button>

          {/* Search Input Pod */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 relative flex items-center bg-white rounded-full shadow-[0_3px_12px_rgba(0,0,0,0.07)] border border-stone-200/80 focus-within:border-[#7A0B10] focus-within:ring-2 focus-within:ring-[#7A0B10]/15 transition-all h-11 sm:h-12 px-3 sm:px-4"
          >
            <Search size={18} strokeWidth={2.4} className="text-[#7A0B10] shrink-0 mr-2 sm:mr-2.5" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, cuisines, categories..."
              className="w-full bg-transparent text-[14px] sm:text-[15px] font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setDebouncedQuery('');
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 transition-colors shrink-0"
                aria-label="Clear search"
              >
                <X size={17} strokeWidth={2.4} />
              </button>
            )}
          </form>

          {/* Cancel Text Button */}
          <button
            type="button"
            onClick={handleCancel}
            className="text-[14px] sm:text-[15px] font-bold text-[#7A0B10] hover:text-[#52060A] px-1.5 py-1 transition-colors cursor-pointer shrink-0"
          >
            Cancel
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          2. BODY: SUGGESTIONS / ACTIVE RESULTS
         ═══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 pb-28">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-3 border-[#7A0B10] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
              Loading menu catalog...
            </p>
          </div>
        ) : debouncedQuery ? (
          /* ── ACTIVE SEARCH RESULTS VIEW ── */
          <div>
            {/* Filter & Sort Chips Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 pb-3 border-b border-[#EAE0D0]">
              {/* Dietary Filter Pills */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {['All', 'Veg', 'Non-Veg'].map((type) => {
                  const isActive = dietaryFilter === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDietaryFilter(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                        isActive
                          ? 'bg-[#7A0B10] text-white shadow-sm'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      {type === 'Veg' && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300" />
                      )}
                      {type === 'Non-Veg' && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-300" />
                      )}
                      <span>{type}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sort Order Selector */}
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-stone-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-stone-200 text-stone-700 rounded-full text-xs font-semibold px-2.5 py-1.5 focus:outline-none cursor-pointer shadow-2xs"
                >
                  <option value="Default">Default Sort</option>
                  <option value="Price: Low to High">Price: Low to High</option>
                  <option value="Price: High to Low">Price: High to Low</option>
                  <option value="Popularity">Popularity</option>
                </select>
              </div>
            </div>

            {/* Matching Category Filter Chips (if any) */}
            {matchingCategories.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-500 shrink-0">
                  Categories:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === 'All'
                      ? 'bg-[#7A0B10] text-white'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  All ({searchResults.length})
                </button>
                {matchingCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-[#7A0B10] text-white'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Results Count Header */}
            <div className="flex items-center justify-between mb-3 text-xs sm:text-sm font-semibold text-stone-600">
              <span>
                Found <strong className="text-[#7A0B10]">{searchResults.length}</strong>{' '}
                {searchResults.length === 1 ? 'dish' : 'dishes'} for &ldquo;{debouncedQuery}&rdquo;
              </span>
              {selectedCategory !== 'All' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('All')}
                  className="text-xs text-[#7A0B10] underline font-bold"
                >
                  Reset category
                </button>
              )}
            </div>

            {/* Search Results List */}
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {searchResults.map((dish) => {
                  const dishId = dish._id || dish.id;
                  const qty = getCartQuantity(dishId);
                  const thumb =
                    resolveImageUrl(dish.image) ||
                    dish.imageUrl ||
                    getDishImage(dish.name);

                  return (
                    <div
                      key={dishId}
                      onClick={() => setSelectedItem(dish)}
                      className="bg-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-stone-200/70 hover:shadow-md hover:border-[#7A0B10]/30 transition-all flex gap-3 sm:gap-3.5 cursor-pointer group"
                    >
                      {/* Dish Thumbnail */}
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                        <img
                          src={thumb}
                          alt={dish.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = getDishImage(dish.name);
                          }}
                        />
                        {/* Veg / Non-Veg Indicator */}
                        <div className="absolute top-1.5 left-1.5 bg-white/95 backdrop-blur-xs p-1 rounded-md shadow-xs">
                          {dish.isVeg !== false ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 block ring-1 ring-emerald-500" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 block ring-1 ring-rose-500" />
                          )}
                        </div>

                        {/* Bestseller Tag */}
                        {dish.isBestseller && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-stone-950 font-black text-[9px] uppercase tracking-wider shadow-xs">
                            ★ Top
                          </span>
                        )}
                      </div>

                      {/* Dish Information */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-[#7A0B10] transition-colors truncate">
                              {dish.name}
                            </h3>
                          </div>
                          <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                            {dish.categoryName}
                          </p>
                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {dish.description || 'Authentic traditional recipe prepared fresh with finest spices.'}
                          </p>
                        </div>

                        {/* Price & Add to Cart Controls */}
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-100">
                          <span className="text-sm sm:text-base font-black text-[#7A0B10]">
                            ${parseFloat(dish.price || 0).toFixed(2)}
                          </span>

                          {qty > 0 ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center rounded-full bg-[#7A0B10] text-white shadow-sm overflow-hidden h-7 sm:h-8"
                            >
                              <button
                                type="button"
                                onClick={(e) => handleDecrement(dish, e)}
                                className="px-2.5 h-full hover:bg-black/20 flex items-center justify-center transition-colors active:scale-95"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={13} strokeWidth={2.6} />
                              </button>
                              <span className="px-2 text-xs font-black min-w-[20px] text-center">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleIncrement(dish, e)}
                                className="px-2.5 h-full hover:bg-black/20 flex items-center justify-center transition-colors active:scale-95"
                                aria-label="Increase quantity"
                              >
                                <Plus size={13} strokeWidth={2.6} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleAddToCart(dish, e)}
                              className="px-3.5 sm:px-4 py-1.5 rounded-full bg-white border border-[#7A0B10] text-[#7A0B10] hover:bg-[#7A0B10] hover:text-white font-extrabold text-xs shadow-2xs hover:shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={13} strokeWidth={2.8} />
                              <span>ADD</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* No Results Empty State */
              <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-stone-200/80 shadow-sm mt-4">
                <div className="w-16 h-16 rounded-full bg-[#7A0B10]/10 text-[#7A0B10] flex items-center justify-center mx-auto mb-4">
                  <Search size={28} />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-stone-900 mb-1.5">
                  No dishes found for &ldquo;{debouncedQuery}&rdquo;
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mb-6">
                  Check your spelling or explore popular dishes below:
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mx-auto">
                  {['Mango Lassi', 'Chole Bhature', 'Butter Chicken', 'Paneer Tikka', 'Biryani', 'Samosa'].map(
                    (suggest) => (
                      <button
                        key={suggest}
                        type="button"
                        onClick={() => handleSelectRecentOrPopular(suggest)}
                        className="px-3 py-1.5 rounded-full bg-[#FAF3E8] border border-[#EADFCF] text-xs font-bold text-[#7A0B10] hover:bg-[#7A0B10] hover:text-white transition-all cursor-pointer"
                      >
                        {suggest}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ── SUGGESTIONS & DISCOVERY VIEW (Search Bar Empty) ── */
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
            {/* 1. Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-stone-900 font-bold text-base sm:text-lg">
                    <History size={18} className="text-[#7A0B10]" />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearAllRecentSearches}
                    className="text-xs font-bold text-[#7A0B10] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => handleSelectRecentOrPopular(term)}
                      className="group inline-flex items-center gap-1.5 bg-white border border-stone-200/80 hover:border-[#7A0B10]/40 rounded-full px-3.5 py-1.5 shadow-2xs hover:shadow-sm transition-all cursor-pointer"
                    >
                      <span className="text-xs sm:text-[13px] font-medium text-stone-800 group-hover:text-[#7A0B10]">
                        {term}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => removeRecentSearch(term, e)}
                        className="text-stone-400 hover:text-stone-700 ml-0.5"
                        aria-label={`Remove ${term}`}
                      >
                        <X size={13} strokeWidth={2.2} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. 🔥 Popular Searches Grid (Customer App 4-col Grid) */}
            {popularDishes.length > 0 && (
              <div>
                <div className="flex items-center gap-2.5 mb-3.5">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                      Popular Searches
                    </h2>
                    <p className="text-xs text-stone-500">Try searching for your favorite dishes</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3.5">
                  {popularDishes.map((dish) => {
                    const thumb =
                      resolveImageUrl(dish.image) ||
                      dish.imageUrl ||
                      getDishImage(dish.name);

                    return (
                      <button
                        key={dish._id || dish.id}
                        type="button"
                        onClick={() => handleSelectRecentOrPopular(dish.name)}
                        className="group flex flex-col items-center bg-white rounded-2xl p-1.5 xs:p-2 sm:p-2.5 shadow-2xs border border-stone-200/60 hover:shadow-md hover:border-[#7A0B10]/30 active:scale-95 transition-all text-center cursor-pointer w-full min-w-0 overflow-hidden"
                      >
                        <div className="w-full aspect-square rounded-xl overflow-hidden bg-stone-100 mb-1.5 xs:mb-2 relative shrink-0">
                          <img
                            src={thumb}
                            alt={dish.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src = getDishImage(dish.name);
                            }}
                          />
                        </div>
                        <div className="w-full min-w-0 px-0.5">
                          <span className="block w-full min-w-0 text-[10px] xs:text-[11px] sm:text-xs font-bold text-[#7A0B10] line-clamp-2 leading-[1.15] break-words [overflow-wrap:anywhere] text-center">
                            {dish.name}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. ⚡ Trending Dishes List */}
            {trendingDishes.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-2.5 mb-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#7A0B10]/10 text-[#7A0B10] flex items-center justify-center">
                    <Search size={18} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-tight">
                      Trending Dishes
                    </h2>
                    <p className="text-xs text-stone-500">Most searched by our customers</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {trendingDishes.map((dish) => {
                    const thumb =
                      resolveImageUrl(dish.image) ||
                      dish.imageUrl ||
                      getDishImage(dish.name);

                    return (
                      <div
                        key={dish._id || dish.id}
                        onClick={() => setSelectedItem(dish)}
                        className="bg-white rounded-2xl p-2.5 sm:p-3 shadow-2xs border border-stone-200/60 hover:shadow-md hover:border-[#7A0B10]/30 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={thumb}
                            alt={dish.name}
                            className="w-16 h-12 sm:w-20 sm:h-14 rounded-xl object-cover shrink-0 bg-stone-100 group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              e.currentTarget.src = getDishImage(dish.name);
                            }}
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm sm:text-base text-stone-900 group-hover:text-[#7A0B10] transition-colors truncate">
                              {dish.name}
                            </h4>
                            <p className="text-xs text-stone-500 truncate max-w-xs sm:max-w-md">
                              {dish.description || 'Customer favorite delicacy'}
                            </p>
                            <span className="text-xs font-black text-[#7A0B10] mt-0.5 inline-block">
                              ${parseFloat(dish.price || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleAddToCart(dish, e)}
                            className="hidden sm:inline-flex px-3 py-1 rounded-full bg-[#7A0B10] text-white text-xs font-bold hover:bg-[#52060A] transition-colors"
                          >
                            + ADD
                          </button>
                          <ChevronRight size={18} className="text-[#7A0B10]" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════════════
          3. FLOATING VIEW CART BAR (When cart has items)
         ═══════════════════════════════════════════════════════════════════ */}
      {cartTotalCount > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-50 animate-in slide-in-from-bottom duration-300">
          <button
            type="button"
            onClick={openCart}
            className="w-full rounded-2xl bg-gradient-to-r from-[#7A0B10] via-[#5C0612] to-[#4A090B] text-white p-3.5 sm:p-4 shadow-[0_8px_24px_rgba(122,11,16,0.45)] flex items-center justify-between border border-white/15 cursor-pointer active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-black text-sm">
                {cartTotalCount}
              </div>
              <div className="text-left">
                <p className="text-[11px] uppercase tracking-wider text-amber-300 font-bold">
                  View Cart
                </p>
                <p className="text-xs text-white/90">
                  {cartTotalCount} {cartTotalCount === 1 ? 'item' : 'items'} added
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-sm text-white">
              <span>Continue</span>
              <ChevronRight size={16} />
            </div>
          </button>
        </div>
      )}

      {/* Item Details / Customization Modal */}
      {selectedItem && (
        <ItemDetailModal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
        />
      )}
    </div>
  );
}
