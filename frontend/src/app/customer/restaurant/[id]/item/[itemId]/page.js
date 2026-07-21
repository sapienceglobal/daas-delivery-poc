'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';

import { menuAPI, restaurantAPI, authAPI, reviewAPI } from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { showToast, Skeleton } from '@/components/ui';

// Custom subcomponents
import Breadcrumbs from '@/components/menu-detail/Breadcrumbs';
import ProductInfo from '@/components/menu-detail/ProductInfo';
import AddToCartPanel from '@/components/menu-detail/AddToCartPanel';
import CustomizationForm from '@/components/menu-detail/CustomizationForm';
import YouMayAlsoLike from '@/components/menu-detail/YouMayAlsoLike';
import ReviewsSection from '@/components/menu-detail/ReviewsSection';
import ValuePropsBar from '@/components/orders/ValuePropsBar';

export default function ItemDetailPage() {
  const { id: restaurantId, itemId } = useParams();
  const router = useRouter();
  const { items, addItem, switchRestaurant, updateQuantity, removeItem } = useCart();
  const { isAuthenticated, user, updateUser } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states

  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Conflict state
  const [conflictOpen, setConflictOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState(null);

  const isSingleRestaurant = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

  useEffect(() => {
    async function loadData() {
      try {
        const [restRes, itemRes, reviewsRes] = await Promise.all([
          restaurantAPI.getById(restaurantId),
          menuAPI.getItem(itemId),
          reviewAPI.getItemReviews(itemId).catch(() => ({ data: [] }))
        ]);
        setRestaurant(restRes.data);
        setItem(itemRes.data);
        setReviews(reviewsRes.data || []);

        const flattened = restRes.data?.menu?.reduce((acc, cat) => acc.concat(cat.items || []), []) || [];
        setMenuItems(flattened);
        
        // Pre-select default size (e.g. Full Portion or standard size)
        if (itemRes.data?.sizeVariations?.length > 0) {
          setSelectedSize(itemRes.data.sizeVariations[0]);
        } else {
          setSelectedSize({ name: 'Full Portion', price: itemRes.data.price });
        }
      } catch (err) {
        showToast('Failed to load item details', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [restaurantId, itemId]);

  // Find matching cart items for active configuration
  const targetId = itemId || item?._id || item?.id;
  const hasSizeVars = item?.sizeVariations && item.sizeVariations.length > 0;

  const matchingCartItems = items.filter(i => {
    const iId = i.menuItemId || i._id || i.id;
    const sameIdOrName = (targetId && iId && iId === targetId) ||
      (i.name && item?.name && i.name.toLowerCase().trim() === item.name.toLowerCase().trim());
    
    const sameSize = !hasSizeVars ||
      (i.selectedSize?.name || i.selectedSize?.label || null) === (selectedSize?.name || selectedSize?.label || null) ||
      (!i.selectedSize && (selectedSize?.name === 'Full Portion' || selectedSize?.name === item?.sizeVariations?.[0]?.name));

    const sameAddons = (!i.addOns || i.addOns.length === 0) && (!selectedAddOns || selectedAddOns.length === 0) ? true :
      JSON.stringify(i.addOns || []) === JSON.stringify(selectedAddOns || []);

    return sameIdOrName && sameSize && sameAddons;
  });

  const cartItem = matchingCartItems[matchingCartItems.length - 1];
  const cartItemIndex = cartItem ? items.indexOf(cartItem) : -1;
  const isInCart = cartItemIndex > -1;
  const cartQty = cartItemIndex > -1 ? (items[cartItemIndex].quantity || items[cartItemIndex].qty || 1) : 0;


const handleIncrement = () => {
    if (cartItemIndex > -1) {
      updateQuantity(cartItemIndex, cartQty + 1);
    }
  };

  const handleDecrement = () => {
    if (cartItemIndex > -1) {
      if (cartQty > 1) {
        updateQuantity(cartItemIndex, cartQty - 1);
      } else {
        removeItem(cartItemIndex);
        showToast('Item removed from cart', 'info');
      }
    }
  };

  const handleAddToCart = () => {
    if (!item) return;

    const basePrice = selectedSize?.price || item.price;
    const addOnsTotal = selectedAddOns.reduce((sum, addon) => sum + addon.price, 0);

    // Jab first time add hoga, toh quantity hamesha 1 rahegi
    const newCartItem = {
      menuItemId: item._id || item.id || targetId,
      name: item.name,
      price: basePrice,
      quantity: 1, 
      qty: 1,
      selectedSize,
      addOns: selectedAddOns,
      specialInstructions,
      lineTotal: (basePrice + addOnsTotal) * 1
    };

    const res = addItem(newCartItem, restaurant);
    if (res?.conflict) {
      setPendingCartItem(newCartItem);
      setConflictOpen(true);
    } else {
      showToast(`${item.name} added to cart`, 'success');
    }
  };

  const handleConfirmSwitch = () => {
    if (pendingCartItem) {
      switchRestaurant(pendingCartItem, restaurant);
      setConflictOpen(false);
      setPendingCartItem(null);
      showToast(`${pendingCartItem.name} added to new cart`, 'success');
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showToast('Please login to add favorites', 'info');
      return;
    }
    try {
      const res = await authAPI.toggleFavoriteItem(item._id);
      updateUser({ favoriteItems: res.data });
      showToast('Favorites updated', 'success');
    } catch (err) {
      showToast('Failed to update favorites', 'error');
    }
  };

  const handleQuickAdd = (recItem) => {
    // Quick Add adds the recommended item directly with default settings
    const recItemIndex = items.findIndex(i =>
      i.menuItemId === recItem._id &&
      i.selectedSize?.name === 'Full Portion' &&
      JSON.stringify(i.addOns || []) === JSON.stringify([])
    );

    if (recItemIndex > -1) {
      updateQuantity(recItemIndex, items[recItemIndex].quantity + 1);
      showToast(`Increased quantity of ${recItem.name} in cart`, 'success');
      return;
    }

    const newCartItem = {
      menuItemId: recItem._id,
      name: recItem.name,
      price: recItem.price,
      quantity: 1,
      selectedSize: { name: 'Full Portion', price: recItem.price },
      addOns: [],
      specialInstructions: '',
      lineTotal: recItem.price
    };
    const res = addItem(newCartItem, restaurant);
    if (res?.conflict) {
      setPendingCartItem(newCartItem);
      setConflictOpen(true);
    } else {
      showToast(`${recItem.name} added to cart`, 'success');
    }
  };

  const isFavorite = user?.favoriteItems?.some(f => (f._id || f) === item?._id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#9ca3af]" />
        <span className="text-[14px] text-[#6b7280] font-bold">Loading item details...</span>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <h2 className="text-2xl font-serif font-black text-[#1a1a1a]">Item Not Found</h2>
        <button
          onClick={() => router.push(isSingleRestaurant ? '/customer/restaurant/lassi-lounge' : `/customer/restaurant/${restaurantId}`)}
          className="px-6 py-2 bg-[#1a1a1a] text-[#ffffff] rounded-lg font-bold"
        >
          Back to Restaurant Menu
        </button>
      </div>
    );
  }

  // Setup dynamic page color styling based on single restaurant brand settings
  const containerBg = isSingleRestaurant ? 'bg-[#faf6f0] text-[#201a15]' : 'bg-[#f7f8fa] text-[#1a1a1a]';

  return (
    <div className={`min-h-screen py-6 ${containerBg}`}>
      <div className="mx-auto max-w-[1400px] w-full px-4 md:px-6 lg:px-8 space-y-6">
        
        {/* Back navigation & Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <button
            onClick={() => router.push(isSingleRestaurant ? '/customer/restaurant/lassi-lounge' : `/customer/restaurant/${restaurantId}`)}
            className="flex items-center gap-2 text-[13px] font-bold text-[#6b7280] hover:text-[#1a1a1a] uppercase tracking-wider transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Menu
          </button>
          
          <Breadcrumbs
            restaurant={restaurant}
            category={{ name: item.category }}
            itemName={item.name}
            isSingleRestaurant={isSingleRestaurant}
          />
        </div>

        {/* TOP SECTION: Product Info (Left) + Add to Cart (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Main Info */}
          <div className="xl:col-span-8">
            <div className="rounded-2xl border border-[#e5e7eb] bg-[#ffffff] p-6 md:p-8 shadow-sm">
              <ProductInfo
                item={item}
                isSingleRestaurant={isSingleRestaurant}
                isFavorite={isFavorite}
                onToggleFavorite={handleToggleFavorite}
              />
            </div>
          </div>

          {/* Checkout panel column */}
          <div className="xl:col-span-4 lg:sticky lg:top-24">
            <AddToCartPanel
              price={selectedSize?.price || item.price}
              cartQty={cartQty}
              isInCart={isInCart}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onAddToCart={handleAddToCart}
              isFavorite={isFavorite}
              onToggleFavorite={handleToggleFavorite}
              isSingleRestaurant={isSingleRestaurant}
            />
          </div>

        </div>

        {/* MIDDLE SECTION: Customization Block (Full Width Below) */}
        <div className="pt-6">
          <CustomizationForm
            item={item}
            selectedSize={selectedSize}
            setSelectedSize={setSelectedSize}
            selectedAddOns={selectedAddOns}
            setSelectedAddOns={setSelectedAddOns}
            specialInstructions={specialInstructions}
            setSpecialInstructions={setSpecialInstructions}
            isSingleRestaurant={isSingleRestaurant}
          />
        </div>

        {/* You May Also Like Block */}
        <div className="pt-8">
          <YouMayAlsoLike
            restaurantId={restaurantId}
            onQuickAdd={handleQuickAdd}
            isSingleRestaurant={isSingleRestaurant}
            currentItemId={itemId}
            menuItems={menuItems}
          />
        </div>

        {/* Customer Reviews Section */}
        <div className="pt-8">
          <ReviewsSection
            reviews={reviews}
            isSingleRestaurant={isSingleRestaurant}
          />
        </div>

        {/* Footer props row */}
        <div className="pt-12">
          <ValuePropsBar />
        </div>

      </div>

      {/* Cart Conflict Modal (Standard Platform Dialog) */}
      {conflictOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#000000]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#ffffff] border border-[#e5e7eb] p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-[18px] font-black text-[#1a1a1a] font-serif">Replace Cart Items?</h3>
              <p className="text-[13px] text-[#6b7280] mt-2 leading-relaxed">
                Your cart contains items from <strong>{useCart().restaurant?.name}</strong>. 
                Do you want to discard your current cart and start a new order at <strong>{restaurant?.name}</strong>?
              </p>
            </div>
            
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setConflictOpen(false);
                  setPendingCartItem(null);
                }}
                className="px-4 py-2 border border-[#e5e7eb] text-[#4b5563] rounded-xl hover:bg-[#f9fafb] transition-colors text-[13px] font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSwitch}
                className={`px-5 py-2 rounded-xl text-[#ffffff] transition-colors text-[13px] font-bold uppercase tracking-wider ${
                  isSingleRestaurant ? 'bg-[#7a0b10] hover:bg-[#5e080c]' : 'bg-[#6b52ff] hover:bg-[#4a3aff]'
                }`}
              >
                Yes, Start New Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}