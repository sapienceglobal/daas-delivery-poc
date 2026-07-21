'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';

const CartContext = createContext(null);

const LEGACY_CART_STORAGE_KEY = 'marketplace_cart';
const LEGACY_CART_RESTAURANT_KEY = 'marketplace_cart_restaurant';

const getTenantId = () => (
  process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true' ? 'lassi-lounge' : 'marketplace'
);

const buildCartStorageKeys = (userId) => {
  const owner = userId ? `user_${userId}` : 'guest';
  const scope = `${getTenantId()}_${owner}`;
  return {
    items: `cart:${scope}:items`,
    restaurant: `cart:${scope}:restaurant`,
    owner,
  };
};

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [hydratedOwner, setHydratedOwner] = useState(null);
  const [serverHydratedOwner, setServerHydratedOwner] = useState(null);
  const latestCartRef = useRef({ items: [], restaurant: null, specialInstructions: '', owner: null });
  const applyingServerCartRef = useRef(false);
  const saveTimerRef = useRef(null);

  const storageKeys = useMemo(() => buildCartStorageKeys(user?._id), [user?._id]);

  useEffect(() => {
    latestCartRef.current = { items, restaurant, specialInstructions, owner: hydratedOwner };
  }, [items, restaurant, specialInstructions, hydratedOwner]);

  // Load the cart for the active tenant + active user. This prevents one
  // customer's browser cart from appearing after another customer logs in.
  useEffect(() => {
    if (authLoading) return;

    try {
      let storedItems = localStorage.getItem(storageKeys.items);
      let storedRestaurant = localStorage.getItem(storageKeys.restaurant);
      let storedInstructions = localStorage.getItem(storageKeys.items + '_instructions');
      const latestCart = latestCartRef.current;

      if (user?._id && !storedItems && latestCart.owner === 'guest' && latestCart.items.length > 0) {
        storedItems = JSON.stringify(latestCart.items);
        storedRestaurant = latestCart.restaurant ? JSON.stringify(latestCart.restaurant) : null;
        storedInstructions = latestCart.specialInstructions;
      }

      if (!user?._id && !storedItems) {
        storedItems = localStorage.getItem(LEGACY_CART_STORAGE_KEY);
        storedRestaurant = localStorage.getItem(LEGACY_CART_RESTAURANT_KEY);
        storedInstructions = localStorage.getItem(LEGACY_CART_STORAGE_KEY + '_instructions');
      }

      setItems(storedItems ? JSON.parse(storedItems) : []);
      setRestaurant(storedRestaurant ? JSON.parse(storedRestaurant) : null);
      setSpecialInstructions(storedInstructions || '');
      setServerHydratedOwner(user?._id ? null : storageKeys.owner);
    } catch {
      localStorage.removeItem(storageKeys.items);
      localStorage.removeItem(storageKeys.restaurant);
      localStorage.removeItem(storageKeys.items + '_instructions');
      setItems([]);
      setRestaurant(null);
      setSpecialInstructions('');
      setServerHydratedOwner(user?._id ? null : storageKeys.owner);
    } finally {
      setHydratedOwner(storageKeys.owner);
    }
  }, [authLoading, storageKeys.items, storageKeys.restaurant, storageKeys.owner, user?._id]);

  useEffect(() => {
    if (authLoading || !user?._id || hydratedOwner !== storageKeys.owner) return;

    let cancelled = false;
    const localSnapshot = latestCartRef.current;

    const loadServerCart = async () => {
      try {
        const response = await authAPI.getCart();
        if (cancelled) return;

        const savedCart = response.data || {};
        const hasServerItems = Array.isArray(savedCart.items) && savedCart.items.length > 0;

        applyingServerCartRef.current = true;
        if (hasServerItems) {
          setItems(savedCart.items);
          setRestaurant(savedCart.restaurant || null);
        } else if (localSnapshot.items.length > 0) {
          await authAPI.updateCart({
            items: localSnapshot.items,
            restaurant: localSnapshot.restaurant
          });
        }
      } catch {
        // Keep the user-scoped browser cache available if the network is down.
      } finally {
        if (!cancelled) {
          setServerHydratedOwner(storageKeys.owner);
          setTimeout(() => {
            applyingServerCartRef.current = false;
          }, 0);
        }
      }
    };

    loadServerCart();

    return () => {
      cancelled = true;
    };
  }, [authLoading, hydratedOwner, storageKeys.owner, user?._id]);

  // Persist to the scoped storage only after the matching user cart is loaded.
  useEffect(() => {
    if (authLoading || hydratedOwner !== storageKeys.owner) return;
    localStorage.setItem(storageKeys.items, JSON.stringify(items));
    localStorage.setItem(storageKeys.items + '_instructions', specialInstructions);
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
    localStorage.removeItem(LEGACY_CART_STORAGE_KEY + '_instructions');
  }, [authLoading, hydratedOwner, items, specialInstructions, storageKeys.items, storageKeys.owner]);

  useEffect(() => {
    if (authLoading || hydratedOwner !== storageKeys.owner) return;
    if (restaurant) {
      localStorage.setItem(storageKeys.restaurant, JSON.stringify(restaurant));
    } else {
      localStorage.removeItem(storageKeys.restaurant);
    }
    localStorage.removeItem(LEGACY_CART_RESTAURANT_KEY);
  }, [authLoading, hydratedOwner, restaurant, storageKeys.restaurant, storageKeys.owner]);

  useEffect(() => {
    if (
      authLoading ||
      !user?._id ||
      hydratedOwner !== storageKeys.owner ||
      serverHydratedOwner !== storageKeys.owner ||
      applyingServerCartRef.current
    ) {
      return;
    }

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      authAPI.updateCart({ items, restaurant, specialInstructions }).catch(() => {});
    }, 450);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [authLoading, hydratedOwner, items, restaurant, specialInstructions, serverHydratedOwner, storageKeys.owner, user?._id]);

  const addItem = useCallback((item, restaurantData) => {
    // If adding from a different restaurant in marketplace mode, clear cart first
    if (restaurant && restaurantData && restaurant._id !== restaurantData._id) {
      return { conflict: true, pendingItem: item, pendingRestaurant: restaurantData };
    }

    if (restaurantData && !restaurant) {
      setRestaurant(restaurantData);
    }

    setItems(prev => {
      const targetId = item.menuItemId || item._id || item.id;
      
      // Check if item with same id or name, size, and addons already exists
      const existingIdx = prev.findIndex(i => {
        const iId = i.menuItemId || i._id || i.id;
        const sameIdOrName = (targetId && iId && iId === targetId) ||
          (i.name && item.name && i.name.toLowerCase().trim() === item.name.toLowerCase().trim());
        const sameSize = (i.selectedSize?.name || i.selectedSize?.label || null) === (item.selectedSize?.name || item.selectedSize?.label || null);
        const sameAddons = JSON.stringify(i.addOns || []) === JSON.stringify(item.addOns || []);
        return sameIdOrName && sameSize && sameAddons;
      });

      const addedQty = item.quantity || item.qty || 1;

      if (existingIdx > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIdx].quantity || updated[existingIdx].qty || 1;
        const newQty = currentQty + addedQty;
        const basePrice = updated[existingIdx].selectedSize?.price || updated[existingIdx].price;
        const addOnTotal = (updated[existingIdx].addOns || []).reduce((s, a) => s + (a.price || 0), 0);

        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          qty: newQty,
          lineTotal: (basePrice + addOnTotal) * newQty
        };
        return updated;
      }

      const quantity = addedQty;
      const basePrice = item.selectedSize?.price || item.price;
      const addOnTotal = (item.addOns || []).reduce((s, a) => s + (a.price || 0), 0);

      return [...prev, {
        ...item,
        menuItemId: targetId || item._id || item.id,
        quantity,
        qty: quantity,
        lineTotal: (basePrice + addOnTotal) * quantity
      }];
    });

    return { conflict: false };
  }, [restaurant]);

  const switchRestaurant = useCallback((item, newRestaurant) => {
    setItems([]);
    setRestaurant(newRestaurant);
    const quantity = item.quantity || item.qty || 1;
    const basePrice = item.selectedSize?.price || item.price;
    const addOnTotal = (item.addOns || []).reduce((s, a) => s + (a.price || 0), 0);

    const targetId = item.menuItemId || item._id || item.id;

    setItems([{
      ...item,
      menuItemId: targetId,
      quantity,
      qty: quantity,
      lineTotal: (basePrice + addOnTotal) * quantity
    }]);
  }, []);

  const updateQuantity = useCallback((index, newQuantity) => {
    if (newQuantity < 1) {
      removeItem(index);
      return;
    }
    setItems(prev => {
      if (!prev[index]) return prev;
      const updated = [...prev];
      const basePrice = updated[index].selectedSize?.price || updated[index].price;
      const addOnTotal = (updated[index].addOns || []).reduce((s, a) => s + (a.price || 0), 0);
      
      updated[index] = {
        ...updated[index],
        quantity: newQuantity,
        qty: newQuantity,
        lineTotal: (basePrice + addOnTotal) * newQuantity
      };
      return updated;
    });
  }, []);

  const removeItem = useCallback((index) => {
    setItems(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length === 0) setRestaurant(null);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setRestaurant(null);
  }, []);

  // ── Computed values ───────────────────────────────────────────────────
  const itemCount = items.reduce((sum, i) => sum + (i.quantity || i.qty || 0), 0);
  const subtotal = items.reduce((sum, i) => sum + (i.lineTotal || ((i.price || 0) * (i.quantity || i.qty || 1))), 0);

  const value = {
    items,
    restaurant,
    itemCount,
    subtotal,
    specialInstructions,
    setSpecialInstructions,
    addItem,
    switchRestaurant,
    updateQuantity,
    removeItem,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
