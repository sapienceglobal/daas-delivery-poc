'use client';
import { useCart } from './CartContext';
import { useModal } from './ModalContext';

/**
 * useAddToCart — single shared entry point for "add this dish to cart"
 * across the entire app (marketplace restaurant pages + every branded
 * landing page). Section/card components never decide the branching logic
 * themselves; they just call handleAddToCart(item).
 *
 * - Simple items (no sizes, no add-ons) → added directly with qty: 1.
 * - Customizable items (item.sizes.length > 1 OR item.addOns.length > 0)
 *   → opens ItemCustomizationModal via ModalContext instead of adding
 *     immediately.
 */
export function useAddToCart() {
  const { addItem } = useCart();
  const { openModal } = useModal();

  return function handleAddToCart(item) {
    const needsCustomization = (item.sizes?.length ?? 0) > 1 || (item.addOns?.length ?? 0) > 0;

    if (needsCustomization) {
      openModal('itemCustomization', { item });
      return;
    }

    addItem({
      ...item,
      qty: 1,
      finalPrice: item.sizes?.[0]?.price ?? item.price,
    });
  };
}