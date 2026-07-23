'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Star, Clock, MapPin, Phone, Globe, ChevronLeft,
  Plus, Minus, Flame, Leaf, ShoppingBag, Heart,
  Search, Gift, ShieldCheck, ChefHat, Award, ArrowRight, Lock,
  Home, LayoutGrid, List, ShoppingCart, X,
  ChevronRight
} from 'lucide-react';
import Fuse from 'fuse.js';
import { restaurantAPI, authAPI, aiAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { showToast, Skeleton, Modal, ItemDetailModal, PortalModal, GlassCard, Badge, Button, StarRating } from '@/components/ui';

import Loading from '@/app/loading';

// Lassi Lounge Branded Modular Components
import MenuHero from '@/components/branded/lassi-lounge/menu/MenuHero';
import CategorySidebar from '@/components/branded/lassi-lounge/menu/CategorySidebar';
import DishGrid from '@/components/branded/lassi-lounge/menu/DishGrid';

const getDishImage = (itemName) => {
  const name = itemName.toLowerCase();
  if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
  if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
  if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
  if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
  if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
  if (name.includes('lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
  if (name.includes('roll') || name.includes('spring')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
  if (name.includes('corn')) return 'https://images.unsplash.com/photo-1626804475297-41609ea004eb?auto=format&fit=crop&w=400&q=80';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
};

export default function RestaurantPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addItem, switchRestaurant, restaurant: cartRestaurant, itemCount, items, subtotal, updateQuantity, removeItem, specialInstructions, setSpecialInstructions } = useCart();
  const { user, updateUser, isAuthenticated } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [conflictModal, setConflictModal] = useState(null);
  const [aiPicks, setAiPicks] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false); 
  const [repeatModal, setRepeatModal] = useState(null); // { item, lastCartItem }
  
  const menuTopRef = useRef(null);
  const dishGridRef = useRef(null);
  
  // Local state for quantity selector in card before adding to cart
  const [localQuantities, setLocalQuantities] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await restaurantAPI.getById(id);
        setRestaurant(data.data);
        setMenu(data.data.menu || []);
        if (data.data.menu?.length > 0) {
          setActiveCategory(data.data.menu[0]._id);
        }
      } catch {
        showToast('Failed to load restaurant', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (restaurant?._id && menu?.length > 0) {
      loadAiPicks();
    }
  }, [restaurant?._id, menu?.length]);

  const loadAiPicks = async () => {
    try {
      setLoadingAi(true);
      const { aiAPI } = await import('@/lib/api');
      const pastOrdersContext = user?.orderHistory?.join(', ') || '';
      const res = await aiAPI.recommendFood(restaurant._id, pastOrdersContext);
      if (res.data?.picks) {
        setAiPicks(res.data.picks);
      }
    } catch (err) {
      console.error('AI Picks failed:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  // Instant Fuzzy Search using Fuse.js
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const allItems = (menu || []).reduce((acc, cat) => {
      // Pass category name down to items so they can be matched
      const itemsWithCat = (cat.items || []).map(i => ({ ...i, catName: cat.name || cat.catName }));
      return acc.concat(itemsWithCat);
    }, []);

    const fuse = new Fuse(allItems, {
      keys: ['name', 'description', 'tags', 'catName'],
      threshold: 0.4, // typo tolerance
      ignoreLocation: true,
    });
    
    const results = fuse.search(searchQuery).map(res => res.item);
    setSearchResults(results);
  }, [searchQuery, menu]);

  // Deep Semantic Search using AI
  const handleAiSearch = async () => {
    if (!searchQuery.trim() || !restaurant?._id) return;
    setIsAiSearching(true);
    try {
      const res = await aiAPI.searchMenu(restaurant._id, searchQuery);
      const matchIds = res.data?.results || [];
      const allItems = (menu || []).reduce((acc, cat) => acc.concat(cat.items || []), []);
      const matchedItems = matchIds.map(id => allItems.find(i => i._id === id || i.id === id)).filter(Boolean);
      
      if (matchedItems.length > 0) {
        setSearchResults(matchedItems);
        showToast('AI found best matches!', 'success');
      } else {
        setSearchResults([]);
        showToast('AI found no matching items', 'error');
      }
    } catch (err) {
      console.error('AI Search failed:', err);
      showToast('AI Search failed', 'error');
    } finally {
      setIsAiSearching(false);
    }
  };
  const handleSmartAdd = (item, qty = 1) => {
    const hasCustomizations =
      (item.sizeVariations && item.sizeVariations.length > 0) ||
      (item.addOns && item.addOns.length > 0);
    if (hasCustomizations) {
      setSelectedItem(item);
    } else {
      handleAddToCart(item, qty);
    }
  };

  const handleAddToCart = (item, quantity = 1, selectedSize = null, addOns = [], specialInstructions = '') => {
    const cartItem = {
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity,
      selectedSize,
      addOns,
      specialInstructions: specialInstructions || '',
    };

    const result = addItem(cartItem, {
      _id: restaurant._id,
      name: restaurant.name,
      address: restaurant.address,
      phone: restaurant.phone,
      deliveryFee: restaurant.deliveryFee,
      taxRate: restaurant.taxRate,
    });

    if (result.conflict) {
      setConflictModal({ item: cartItem, restaurant: result.pendingRestaurant || { _id: restaurant._id, name: restaurant.name, address: restaurant.address, phone: restaurant.phone } });
    } else {
      showToast(`${item.name} added to cart`, 'success');
      setLocalQuantities(prev => ({ ...prev, [item._id]: 1 }));
    }
  };

  const handleCartAdd = (item) => {
    const hasCustomizations =
      (item.sizeVariations && item.sizeVariations.length > 0) ||
      (item.addOns && item.addOns.length > 0);

    const targetId = item.menuItemId || item._id || item.id;

    if (hasCustomizations) {
      const lastCartItem = [...items].reverse().find(i => {
        const iId = i.menuItemId || i._id || i.id;
        return (targetId && iId && iId === targetId) || (i.name && item.name && i.name.toLowerCase().trim() === item.name.toLowerCase().trim());
      });
      if (lastCartItem) {
        setRepeatModal({ item, lastCartItem });
      } else {
        setSelectedItem(item);
      }
    } else {
      handleAddToCart(item, 1);
    }
  };

  const handleCartDecrement = (item) => {
    const targetId = item.menuItemId || item._id || item.id;
    const lastIndex = items.map((i, idx) => ({ ...i, originalIdx: idx }))
                         .reverse()
                         .find(i => {
                           const iId = i.menuItemId || i._id || i.id;
                           return (targetId && iId && iId === targetId) || (i.name && item.name && i.name.toLowerCase().trim() === item.name.toLowerCase().trim());
                         })
                         ?.originalIdx;

    if (lastIndex !== undefined) {
      const currentQty = items[lastIndex].quantity || items[lastIndex].qty || 1;
      if (currentQty > 1) {
        updateQuantity(lastIndex, currentQty - 1);
      } else {
        removeItem(lastIndex);
      }
    }
  };

  const updateLocalQty = (itemId, delta) => {
    setLocalQuantities(prev => {
      const current = prev[itemId] || 1;
      const newQty = Math.max(1, current + delta);
      return { ...prev, [itemId]: newQty };
    });
  };

  if (loading) return <Loading />;
  if (!restaurant) return <div className="text-center py-16 text-[#6b7280]">Restaurant not found</div>;

  const isSingleRestaurantMode = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

  if (isSingleRestaurantMode) {
    const categories = menu || [];
    const currentCategory = categories.find(cat => cat._id === activeCategory) || categories[0];
    // If searchQuery is present, we show the fuzzy search results (or AI results).
    // Otherwise, we show the items from the active category.
    const filteredItems = searchQuery.trim() 
      ? (searchResults || []) 
      : (currentCategory?.items || []);

    const deliveryFee = restaurant?.deliveryFee !== undefined ? restaurant.deliveryFee : 2.99;
    const taxes = subtotal * 0.0875;
    const discount = couponApplied ? subtotal * 0.10 : 0;
    const totalAmount = subtotal > 0 ? (subtotal + deliveryFee + taxes - discount) : 0;

    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col font-sans ll-page-enter">
        
        {/* ─── 1. HERO SECTION ─── */}
        <MenuHero />

        {/* ─── 2. BREADCRUMBS & SEARCH ROW ─── */}
        <div ref={menuTopRef} className="bg-[#ffffff] border-b border-[#e5e7eb] py-4 sticky top-0 z-30 shadow-[0_8px_24px_rgba(122,11,16,0.05)]">
          {/* max-w-[1550px] इस्तेमाल किया है ताकि लेआउट इमेज की तरह वाइड (wide) दिखे */}
          <div className="mx-auto max-w-[1550px] px-4 md:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Left: Breadcrumbs */}
            <div className="flex items-center text-[13px] text-[#6b7280] font-medium gap-1 w-full md:w-auto">
              <button className="flex items-center gap-2 hover:text-[#7a0b10] transition-colors ll-focus-ring" onClick={() => router.push('/customer')}>
                <Home className="w-4 h-4 text-[#7a0b10]" /> <span className="mt-0.5">Home</span>
              </button>
              <span className=" mt-0.5 text-[#7a0b10]">&gt;</span>
              <span className="text-[#1a1a1a] font-bold mt-0.5">Menu</span>
            </div>

            {/* Right: Search Bar */}
            <div className="relative w-full md:w-[420px] flex items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] ml-2" />
                <input
                  type="text"
                  placeholder="Search dishes (Press Enter for AI)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                  maxLength={60}
                  className="w-full pl-10 pr-4 py-2 border border-[#e5e7eb] rounded-md text-[13px] focus:outline-none focus:border-[#7a0b10] focus:ring-4 focus:ring-[#7a0b10]/10 transition-all text-[#1a1a1a] placeholder-[#9ca3af] bg-[#ffffff] shadow-sm"
                />
              </div>
              <Button 
                onClick={handleAiSearch} 
                loading={isAiSearching} 
                variant="primary" 
                className="whitespace-nowrap px-4 py-2 !rounded-md text-[13px] h-[38px] bg-[#7a0b10] border-none text-white shadow-md shadow-[#7a0b10]/20 hover:brightness-110"
              >
                Ask AI ✨
              </Button>
            </div>
          </div>
        </div>

        {/* ─── 3. MAIN CONTENT AREA (FLEX LAYOUT) ─── */}
        <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8 py-8">
          
          {/* Grid की जगह Flex का इस्तेमाल किया है ताकि कॉलम्स की चौड़ाई परफेक्ट रहे */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            
            {/* === LEFT SIDEBAR: CATEGORIES === */}
            <div className="w-full lg:w-[240px] shrink-0">
              <div className="lg:sticky lg:top-[72px]">
                <CategorySidebar
                  categories={categories}
                  activeCategory={activeCategory}
                  setActiveCategory={(id) => {
                    // Scroll FIRST (instantly) before React re-renders — avoids jerk from competing scroll+layout-shift
                    if (dishGridRef.current) {
                      const rect = dishGridRef.current.getBoundingClientRect();
                      if (rect.top < 80) {
                        window.scrollTo({ top: window.scrollY + rect.top - 80, behavior: 'instant' });
                      }
                    }
                    // Then update category state — content changes after position is already correct
                    setActiveCategory(id);
                    
                    // CLEAR the search query so the user returns to normal category browsing
                    setSearchQuery('');
                  }}
                  setSearchQuery={setSearchQuery}
                  couponApplied={couponApplied}
                  setCouponApplied={setCouponApplied}
                  searchQuery={searchQuery}
                  isViewOnly={true}
                />
              </div>
            </div>
            
            {/* === MIDDLE CONTENT: DISHES GRID === */}
            <div ref={dishGridRef} className="lg:col-span-9 w-full min-w-0">
              <DishGrid
                filteredItems={filteredItems}
                searchQuery={searchQuery}
                currentCategory={currentCategory}
                isAuthenticated={isAuthenticated}
                user={user}
                items={items}
                handleCartAdd={handleCartAdd}
                handleCartDecrement={handleCartDecrement}
                toggleFavorite={async (itemId) => {
                  try {
                    const res = await authAPI.toggleFavoriteItem(itemId);
                    updateUser({ favoriteItems: res.data });
                    showToast(res.message, 'success');
                  } catch (err) {
                    showToast('Failed to update favorite', 'error');
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* ─── 4. BOTTOM TRUST STRIP ─── */}
        <div className="bg-[#fcfaf5] border-t border-[#e5e7eb] py-10 mt-auto">
          <div className="mx-auto max-w-[1550px] px-4 md:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-left md:divide-x divide-[#e5e7eb]">
            {[
              { icon: Award, label: '100% Authentic', desc: 'Traditional recipes with authentic taste.' },
              { icon: Leaf, label: 'Fresh Ingredients', desc: 'We use the freshest & highest quality ingredients.' },
              { icon: ChefHat, label: 'Expert Chefs', desc: 'Our chefs bring passion & perfection in every dish.' },
              { icon: ShieldCheck, label: 'Hygienic Kitchen', desc: 'Clean, safe & hygienic kitchen you can trust.' }
            ].map((feat, idx) => (
              <div key={idx} className={`flex items-start gap-4 px-4 ll-reveal ${idx === 0 ? 'pl-0' : ''}`}>
                <div className="p-3 bg-[#ffffff] border border-[#e5e7eb] rounded-xl shadow-sm shrink-0">
                   <feat.icon className="h-6 w-6 text-[#7a0b10] stroke-[1.5]" />
                </div>
                <div>
                  <h4 className="text-[12px] font-black text-[#1a1a1a] uppercase tracking-wider">{feat.label}</h4>
                  <p className="text-[11px] text-[#6b7280] mt-1.5 leading-relaxed pr-2">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Item Detail Modal */}
        {selectedItem && (
          <ItemDetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAdd={handleAddToCart}
          />
        )}

        {/* Repeat Customization Modal */}
        {repeatModal && (
          <RepeatCustomizationModal
            isOpen={true}
            onClose={() => setRepeatModal(null)}
            lastCartItem={repeatModal.lastCartItem}
            onRepeat={() => {
              handleAddToCart(
                repeatModal.item,
                1,
                repeatModal.lastCartItem.selectedSize,
                repeatModal.lastCartItem.addOns
              );
              setRepeatModal(null);
            }}
            onChooseNew={() => {
              setSelectedItem(repeatModal.item);
              setRepeatModal(null);
            }}
          />
        )}

        {/* Conflict Modal */}
        {conflictModal && (
          <Modal 
            isOpen={true} 
            onClose={() => setConflictModal(null)} 
            title="Clear Cart?" 
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-[13px] text-gray-500 font-sans leading-relaxed">
                Your cart contains items from another restaurant. Would you like to clear your cart and start a new order?
              </p>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConflictModal(null)}
                  className="flex-1 bg-[#ffffff] text-[#7a0b10] border border-[#7a0b10] hover:bg-[#7a0b10]/5 font-bold py-2.5 rounded-lg text-[13px] uppercase tracking-wide transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    switchRestaurant(conflictModal.item, conflictModal.restaurant);
                    showToast(`${conflictModal.item.name} added to cart`, 'success');
                    setConflictModal(null);
                  }}
                  className="flex-1 bg-[#7a0b10] hover:bg-[#5e080c] text-white font-bold py-2.5 rounded-lg text-[13px] uppercase tracking-wide transition-colors shadow-sm"
                >
                  Clear & Add
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  } else {
    // Marketplace Mode Fallback
    const categories = menu || [];
    const currentCategory = categories.find(cat => cat._id === activeCategory) || categories[0];
    const filteredItems = (currentCategory?.items || []).filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const deliveryFee = restaurant?.deliveryFee !== undefined ? restaurant.deliveryFee : 2.99;
    const taxes = subtotal * 0.0875;
    const discount = couponApplied ? subtotal * 0.10 : 0;
    const totalAmount = subtotal > 0 ? (subtotal + deliveryFee + taxes - discount) : 0;

    return (
      <div className="min-h-screen bg-brand-bg flex flex-col font-sans text-brand-text">
        {/* Marketplace Restaurant Header */}
        <div className="bg-brand-card border-b border-brand-border py-8">
          <div className="mx-auto max-w-[1550px] px-4 md:px-6 lg:px-8">
            <button onClick={() => router.push('/customer')} className="flex items-center gap-2 text-sm text-brand-muted hover:text-brand-cyan mb-4">
              <ChevronLeft className="h-4 w-4" /> Back to Restaurants
            </button>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-4xl font-black text-brand-text">{restaurant.name}</h1>
                <p className="text-brand-muted mt-1 text-sm">{restaurant.description || 'Authentic kitchen serving fresh meals.'}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-brand-muted">
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-brand-yellow text-brand-yellow" /> {restaurant.rating || '4.5'}</span>
                  <span>•</span>
                  <span>{restaurant.cuisine?.join(', ') || 'Various Cuisines'}</span>
                  <span>•</span>
                  <span>{restaurant.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            {/* Category Sidebar */}
            <div className="w-full lg:w-[240px] shrink-0">
              <CategorySidebar
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                setSearchQuery={setSearchQuery}
                couponApplied={couponApplied}
                setCouponApplied={setCouponApplied}
                isViewOnly={true}
              />
            </div>

            {/* Menu Items */}
            <div className="flex-1 w-full min-w-0">
              <DishGrid
                filteredItems={filteredItems}
                currentCategory={currentCategory}
                isAuthenticated={isAuthenticated}
                user={user}
                items={items}
                handleCartAdd={handleCartAdd}
                handleCartDecrement={handleCartDecrement}
                toggleFavorite={async (itemId) => {
                  try {
                    const res = await authAPI.toggleFavoriteItem(itemId);
                    updateUser({ favoriteItems: res.data });
                    showToast(res.message, 'success');
                  } catch (err) {
                    showToast('Failed to update favorite', 'error');
                  }
                }}
              />
            </div>
          </div>
        </div>


        {/* Item Detail Modal */}
        {selectedItem && (
          <ItemDetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onAdd={handleAddToCart}
          />
        )}

        {/* Repeat Customization Modal */}
        {repeatModal && (
          <RepeatCustomizationModal
            isOpen={true}
            onClose={() => setRepeatModal(null)}
            lastCartItem={repeatModal.lastCartItem}
            onRepeat={() => {
              handleAddToCart(
                repeatModal.item,
                1,
                repeatModal.lastCartItem.selectedSize,
                repeatModal.lastCartItem.addOns
              );
              setRepeatModal(null);
            }}
            onChooseNew={() => {
              setSelectedItem(repeatModal.item);
              setRepeatModal(null);
            }}
          />
        )}

        {/* Conflict Modal */}
        {conflictModal && (
          <Modal 
            isOpen={true} 
            onClose={() => setConflictModal(null)} 
            title="Clear Cart?" 
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-[13px] text-gray-500 font-sans leading-relaxed">
                Your cart contains items from another restaurant. Would you like to clear your cart and start a new order?
              </p>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConflictModal(null)}
                  className="flex-1 bg-[#ffffff] text-[#7a0b10] border border-[#7a0b10] hover:bg-[#7a0b10]/5 font-bold py-2.5 rounded-lg text-[13px] uppercase tracking-wide transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    switchRestaurant(conflictModal.item, conflictModal.restaurant);
                    showToast(`${conflictModal.item.name} added to cart`, 'success');
                    setConflictModal(null);
                  }}
                  className="flex-1 bg-[#7a0b10] hover:bg-[#5e080c] text-white font-bold py-2.5 rounded-lg text-[13px] uppercase tracking-wide transition-colors shadow-sm"
                >
                  Clear & Add
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }
}

// ── Removed ItemDetailModal (now imported from @/components/ui) ───────────────────

// ── Repeat Customization Modal ──────────────────────────────────────────────

function RepeatCustomizationModal({ isOpen, onClose, lastCartItem, onRepeat, onChooseNew }) {
  if (!isOpen || !lastCartItem) return null;

  return (
    <PortalModal isOpen={isOpen} onClose={onClose} title="Repeat Customization?" size="sm">
      <div className="space-y-5 text-[#1a1a1a]">
        <p className="text-[14px] text-[#4b5563] font-sans leading-relaxed">
          You already have this item in the cart with the following customization. Would you like to repeat it or customize it again?
        </p>
        
        {/* Customization Details card */}
        <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-xl p-4 shadow-sm">
          <h4 className="text-[15px] font-extrabold text-[#1a1a1a] mb-1 font-sans">{lastCartItem.name}</h4>
          {lastCartItem.selectedSize && (
            <p className="text-[13px] text-[#7a0b10] font-bold">
              Size: {lastCartItem.selectedSize.name}
            </p>
          )}
          {lastCartItem.addOns && lastCartItem.addOns.length > 0 && (
            <p className="text-[12px] text-[#4b5563] mt-2 font-sans leading-snug">
              <span className="font-bold text-[#1a1a1a]">Add-ons:</span> {lastCartItem.addOns.map(a => a.name).join(', ')}
            </p>
          )}
        </div>
        
        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onChooseNew}
            className="flex-1 bg-[#ffffff] text-[#7a0b10] border border-[#7a0b10] hover:bg-[#fffaf9] font-bold py-3 rounded-lg text-[13px] uppercase tracking-wider transition-colors"
          >
            Choose New
          </button>
          <button
            onClick={onRepeat}
            className="flex-1 bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] font-bold py-3 rounded-lg text-[13px] uppercase tracking-wider shadow-md transition-colors"
          >
            Repeat Last
          </button>
        </div>
      </div>
    </PortalModal>
  );
}

// ── Page Skeleton ───────────────────────────────────────────────────────────

function RestaurantSkeleton() {
  return (
    <div className="space-y-6 max-w-[1350px] mx-auto px-4 md:px-8 py-8">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-56 md:h-72 rounded-3xl" />
      <div className="flex gap-4">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Skeleton className="lg:col-span-3 h-[400px] rounded-2xl" />
        <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
        <Skeleton className="lg:col-span-3 h-[500px] rounded-2xl" />
      </div>
    </div>
  );
}
// ── Removed PortalModal (now imported from @/components/ui) ───────────────────