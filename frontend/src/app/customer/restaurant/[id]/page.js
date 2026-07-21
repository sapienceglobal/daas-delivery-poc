'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Star, Clock, MapPin, Phone, Globe, ChevronLeft,
  Plus, Minus, Flame, Leaf, ShoppingBag, Heart,
  Search, Gift, ShieldCheck, ChefHat, Award, ArrowRight, Lock,
  Home, LayoutGrid, List, ShoppingCart, X,
  ChevronRight
} from 'lucide-react';
import { restaurantAPI, authAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createPortal } from 'react-dom';
import {
  GlassCard, Badge, Button, Modal, StarRating,
  Skeleton, showToast
} from '@/components/ui';

// Lassi Lounge Branded Modular Components
import MenuHero from '@/components/branded/lassi-lounge/menu/MenuHero';
import CategorySidebar from '@/components/branded/lassi-lounge/menu/CategorySidebar';
import DishGrid from '@/components/branded/lassi-lounge/menu/DishGrid';
import CartSidebar from '@/components/branded/lassi-lounge/menu/CartSidebar';

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
  const [couponApplied, setCouponApplied] = useState(false); 
  const [repeatModal, setRepeatModal] = useState(null); // { item, lastCartItem }
  
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

  const handleAddToCart = (item, quantity = 1, selectedSize = null, addOns = []) => {
    const cartItem = {
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity,
      selectedSize,
      addOns,
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

  if (loading) return <RestaurantSkeleton />;
  if (!restaurant) return <div className="text-center py-16 text-[#6b7280]">Restaurant not found</div>;

  const isSingleRestaurantMode = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

  if (isSingleRestaurantMode) {
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
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col font-sans ll-page-enter">
        
        {/* ─── 1. HERO SECTION ─── */}
        <MenuHero />

        {/* ─── 2. BREADCRUMBS & SEARCH ROW ─── */}
        <div className="bg-[#ffffff] border-b border-[#e5e7eb] py-4 sticky top-0 z-30 shadow-[0_8px_24px_rgba(122,11,16,0.05)]">
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
            <div className="relative w-full md:w-[360px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9ca3af] ml-2" />
              <input
                type="text"
                placeholder="Search for dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#e5e7eb] rounded-md text-[13px] focus:outline-none focus:border-[#7a0b10] focus:ring-4 focus:ring-[#7a0b10]/10 transition-all text-[#1a1a1a] placeholder-[#9ca3af] bg-[#ffffff] shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* ─── 3. MAIN CONTENT AREA (FLEX LAYOUT) ─── */}
        <div className="mx-auto max-w-[1550px] w-full px-4 md:px-6 lg:px-8 py-8">
          
          {/* Grid की जगह Flex का इस्तेमाल किया है ताकि कॉलम्स की चौड़ाई परफेक्ट रहे */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
            
            {/* === LEFT SIDEBAR: CATEGORIES === */}
            <div className="w-full lg:w-[240px] shrink-0">
              <div className="lg:sticky lg:top-28">
                <CategorySidebar
                  categories={categories}
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  setSearchQuery={setSearchQuery}
                  couponApplied={couponApplied}
                  setCouponApplied={setCouponApplied}
                />
              </div>
            </div>
            
            {/* === MIDDLE CONTENT: DISHES GRID === */}
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

            {/* === RIGHT SIDEBAR: CART DETAILS === */}
          
            <div className="w-full lg:w-[320px] shrink-0">
              <div className="sticky top-24">
                <CartSidebar
                  items={items}
                  itemCount={itemCount}
                  subtotal={subtotal}
                  taxes={taxes}
                  deliveryFee={deliveryFee}
                  discount={discount}
                  totalAmount={totalAmount}
                  couponApplied={couponApplied}
                  setCouponApplied={setCouponApplied}
                  updateQuantity={updateQuantity}
                  router={router}
                  specialInstructions={specialInstructions}
                  setSpecialInstructions={setSpecialInstructions}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ─── 4. BOTTOM TRUST STRIP ─── */}
        {/* इसे इनलाइन कर दिया गया है ताकि यह इमेज जैसा परफेक्ट दिखे */}
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
        <PortalModal 
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
          </PortalModal>
        )}

        {itemCount > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden ll-slide-panel">
            <button
              onClick={() => router.push('/customer/checkout')}
              className="w-full rounded-2xl bg-[#5c060a] text-white shadow-[0_18px_40px_rgba(92,6,10,0.28)] px-5 py-4 flex items-center justify-between ll-interactive ll-focus-ring"
            >
              <span className="text-left">
                <span className="block text-[11px] uppercase tracking-widest text-white/70 font-bold">{itemCount} items</span>
                <span className="block text-[16px] font-black">${totalAmount.toFixed(2)}</span>
              </span>
              <span className="text-[12px] font-black uppercase tracking-wider flex items-center gap-2">
                Checkout <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
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

            {/* Cart Sidebar */}
            <div className="w-full lg:w-[320px] shrink-0">
              <div className="sticky top-24">
                <CartSidebar
                  items={items}
                  itemCount={itemCount}
                  subtotal={subtotal}
                  taxes={taxes}
                  deliveryFee={deliveryFee}
                  discount={discount}
                  totalAmount={totalAmount}
                  couponApplied={couponApplied}
                  setCouponApplied={setCouponApplied}
                  updateQuantity={updateQuantity}
                  router={router}
                />
              </div>
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

// ── Item Detail Modal (Fixed Colors) ──────────────────────────────────────────

function ItemDetailModal({ item, onClose, onAdd }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(item.sizeVariations?.[0] || null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  const basePrice = selectedSize?.price || item.price;
  const addOnTotal = selectedAddOns.reduce((s, a) => s + (a.price || 0), 0);
  const lineTotal = (basePrice + addOnTotal) * quantity;

  const toggleAddOn = (addon) => {
    setSelectedAddOns(prev => {
      const exists = prev.find(a => a.name === addon.name);
      return exists ? prev.filter(a => a.name !== addon.name) : [...prev, addon];
    });
  };

  const hasCustomizations =
    (item.sizeVariations && item.sizeVariations.length > 0) ||
    (item.addOns && item.addOns.length > 0);

  return (
 <PortalModal isOpen={true} onClose={onClose} title={hasCustomizations ? `Customize — ${item.name}` : item.name} size="md">
      <img src={item.image || getDishImage(item.name)} alt={item.name} className="w-full h-48 object-cover rounded-xl mb-4 ll-pop" />

      <p className="text-[13px] text-[#6b7280] mb-5 leading-relaxed">{item.description}</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {item.isVeg && <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-1 rounded-md uppercase tracking-wider">Vegetarian</span>}
        {item.isVegan && <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-1 rounded-md uppercase tracking-wider">Vegan</span>}
        {item.isSpicy && <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-1 rounded-md uppercase tracking-wider">Spicy</span>}
        {item.isGlutenFree && <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded-md uppercase tracking-wider">Gluten-Free</span>}
        {item.isBestseller && <span className="text-[10px] bg-[#e8a020] text-[#1a1a1a] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Bestseller</span>}
      </div>

      {/* Size Variations */}
      {item.sizeVariations?.length > 0 && (
        <div className="mb-5">
          <h4 className="text-[13px] font-bold text-[#1a1a1a] mb-2.5">Size</h4>
          <div className="flex flex-wrap gap-2.5">
            {item.sizeVariations.map(size => (
              <button
                key={size.name}
                onClick={() => setSelectedSize(size)}
                className={`rounded-xl px-4 py-2.5 text-[12px] font-bold border shadow-sm ll-interactive ll-focus-ring
                  ${selectedSize?.name === size.name
                    ? 'bg-[#7a0b10] text-[#ffffff] border-[#7a0b10]'
                    : 'bg-[#ffffff] text-[#6b7280] border-[#e5e7eb] hover:border-[#7a0b10]'
                  }`}
              >
                {size.name} — ${size.price.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add-ons */}
      {item.addOns?.length > 0 && (
        <div className="mb-5">
          <h4 className="text-[13px] font-bold text-[#1a1a1a] mb-2.5">Add-ons</h4>
          <div className="space-y-2.5">
            {item.addOns.map(addon => {
              const isSelected = selectedAddOns.some(a => a.name === addon.name);
              return (
                <button
                  key={addon.name}
                  onClick={() => toggleAddOn(addon)}
                  className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-[13px] border shadow-sm ll-interactive ll-focus-ring
                    ${isSelected
                      ? 'bg-[#7a0b10]/10 text-[#7a0b10] border-[#7a0b10]/30 font-bold'
                      : 'bg-[#ffffff] text-[#6b7280] border-[#e5e7eb] hover:border-[#7a0b10]/30 font-medium'
                    }`}
                >
                  <span>{addon.name}</span>
                  <span className={isSelected ? 'text-[#7a0b10]' : 'text-[#1a1a1a]'}>+${addon.price.toFixed(2)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity & Add to Cart */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#e5e7eb]">
        <div className="flex items-center border border-[#e5e7eb] rounded-lg h-11 bg-[#ffffff] shadow-sm">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3.5 text-[#7a0b10] hover:bg-[#f9fafb] h-full flex items-center justify-center transition-colors ll-focus-ring" aria-label="Decrease quantity">
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <div className="w-px h-full bg-[#e5e7eb]"></div>
          <span className="text-[15px] font-bold text-[#1a1a1a] w-10 text-center">{quantity}</span>
          <div className="w-px h-full bg-[#e5e7eb]"></div>
          <button onClick={() => setQuantity(quantity + 1)} className="px-3.5 text-[#7a0b10] hover:bg-[#f9fafb] h-full flex items-center justify-center transition-colors ll-focus-ring" aria-label="Increase quantity">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <button 
          onClick={() => { onAdd(item, quantity, selectedSize, selectedAddOns); onClose(); }}
          className="bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] font-bold h-11 py-2 px-5 rounded-lg shadow-md text-[13px] tracking-wider uppercase flex items-center justify-center gap-2 ll-interactive ll-focus-ring"
        >
          Add to Cart — ${lineTotal.toFixed(2)}
        </button>
      </div>
    </PortalModal>
  );
}

// ── Repeat Customization Modal ──────────────────────────────────────────────

function RepeatCustomizationModal({ isOpen, onClose, lastCartItem, onRepeat, onChooseNew }) {
  if (!isOpen || !lastCartItem) return null;

  return (
  <PortalModal isOpen={isOpen} onClose={onClose} title="Repeat Customization?" size="sm">
      <div className="space-y-4">
        <p className="text-[13px] text-gray-500 font-sans leading-relaxed">
          You already have this item in the cart with the following customization. Would you like to repeat it or customize it again?
        </p>
        
        {/* Customization Details card */}
        <div className="bg-[#fcfaf5] border border-[#e5e7eb] rounded-xl p-4 shadow-sm ll-pop">
          <h4 className="text-[14px] font-extrabold text-[#1a1a1a] mb-1 font-sans">{lastCartItem.name}</h4>
          {lastCartItem.selectedSize && (
            <p className="text-[12px] text-[#7a0b10] font-bold">
              Size: {lastCartItem.selectedSize.name}
            </p>
          )}
          {lastCartItem.addOns && lastCartItem.addOns.length > 0 && (
            <p className="text-[11px] text-gray-600 mt-1.5 font-sans leading-snug">
              Add-ons: {lastCartItem.addOns.map(a => a.name).join(', ')}
            </p>
          )}
        </div>
        
        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onChooseNew}
            className="flex-1 bg-[#ffffff] text-[#7a0b10] border border-[#7a0b10] hover:bg-[#7a0b10]/5 font-bold py-2.5 rounded-lg text-[13px] uppercase tracking-wide ll-interactive ll-focus-ring"
          >
            Choose New
          </button>
          <button
            onClick={onRepeat}
            className="flex-1 bg-[#7a0b10] hover:bg-[#5e080c] text-white font-bold py-2.5 rounded-lg text-[13px] uppercase tracking-wide shadow-sm ll-interactive ll-focus-ring"
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
// ── Safe Portal Modal (Fixes Scroll & UI issues) ──────────────────────────

function PortalModal({ isOpen, onClose, title, children, size = 'md' }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 select-none">
      <div className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${sizes[size] || sizes.md} bg-[#ffffff] border border-[#e5e7eb] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        
        <div className="flex items-center justify-between p-5 sm:p-6 pb-3 shrink-0 border-b border-[#e5e7eb]/50">
          {title && <h3 className="text-[20px] font-bold font-serif text-[#1a1a1a]">{title}</h3>}
          <button onClick={onClose} className="ml-auto rounded-lg p-2 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f9fafb] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-5 sm:p-6 overflow-y-auto">
          {children}
        </div>
        
      </div>
    </div>,
    document.body
  );
}