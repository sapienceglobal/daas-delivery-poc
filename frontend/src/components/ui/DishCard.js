'use client';

import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { showToast } from '@/components/ui';

/**
 * DishCard — image, name, description, price, and dynamic "- qty +" or "+" add button.
 * Fully synchronized with global CartContext across all pages (Home, Menu, Detail).
 */
export default function DishCard({ item }) {
  const { items, addItem, updateQuantity, removeItem } = useCart();
  const displayPrice = item.sizes?.[0]?.price ?? item.price;

  const targetId = item.menuItemId || item._id || item.id;

  // Find all matching items in global cart by ID or by Name
  const matchingItems = items.filter(i => {
    const iId = i.menuItemId || i._id || i.id;
    const sameId = targetId && iId && iId === targetId;
    const sameName = i.name && item.name && i.name.toLowerCase().trim() === item.name.toLowerCase().trim();
    return sameId || sameName;
  });

  const cartQty = matchingItems.reduce((sum, i) => sum + (i.quantity || i.qty || 0), 0);

  const handleAddToCart = (e) => {
    if (e) e.stopPropagation();

    if (matchingItems.length > 0) {
      const lastMatchingItem = matchingItems[matchingItems.length - 1];
      const lastIndex = items.indexOf(lastMatchingItem);
      if (lastIndex > -1) {
        updateQuantity(lastIndex, (items[lastIndex].quantity || items[lastIndex].qty || 1) + 1);
        showToast(`Added another ${item.name} to cart`, 'success');
      }
    } else {
      addItem({
        menuItemId: targetId || 'dish-' + Date.now(),
        name: item.name,
        price: displayPrice,
        image: item.image,
        quantity: 1,
        qty: 1,
        selectedSize: item.sizes?.[0] ? { name: item.sizes[0].label || item.sizes[0].name, price: item.sizes[0].price } : null,
        addOns: [],
        lineTotal: displayPrice
      });
      showToast(`${item.name} added to cart`, 'success');
    }
  };

  const handleDecrement = (e) => {
    if (e) e.stopPropagation();

    if (matchingItems.length > 0) {
      const lastMatchingItem = matchingItems[matchingItems.length - 1];
      const lastIndex = items.indexOf(lastMatchingItem);
      if (lastIndex > -1) {
        const currentQty = items[lastIndex].quantity || items[lastIndex].qty || 1;
        if (currentQty > 1) {
          updateQuantity(lastIndex, currentQty - 1);
        } else {
          removeItem(lastIndex);
          showToast(`Removed ${item.name} from cart`, 'info');
        }
      }
    }
  };

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-md flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group border border-border/40 select-none">
      <div className="w-full h-32 relative overflow-hidden bg-surface">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="(min-width: 1024px) 16vw, 45vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-3 flex flex-col flex-1 justify-between">
  <div>
    <h4 className="text-background-alt font-bold text-xs md:text-sm mb-1 line-clamp-1">{item.name}</h4>
    <p className="text-background-alt opacity-70 text-[10px] leading-tight line-clamp-2">{item.description}</p>
  </div>

  <div className="mt-3 flex items-center justify-between pt-1">
    <span className="text-accent-400 font-bold text-xs md:text-sm">${displayPrice.toFixed(2)}</span>

    {cartQty > 0 ? (
      <div className="flex items-center border border-primary-600/40 rounded-lg h-7 bg-white shadow-sm overflow-hidden select-none shrink-0">
        <button
          type="button"
          onClick={handleDecrement}
          aria-label={`Remove one ${item.name}`}
          // Hover background effect hataya hai yahan se
          className="w-6 h-full flex items-center justify-center text-primary-600 transition-colors font-bold hover:text-primary-700"
        >
          <Minus size={12} strokeWidth={3} />
        </button>
        <span className="px-1 text-xs font-black text-primary-600 text-center min-w-[18px]">
          {cartQty}
        </span>
        <button
          type="button"
          onClick={handleAddToCart}
          aria-label={`Add one more ${item.name}`}
          // Hover background effect hataya hai yahan se
          className="w-6 h-full flex items-center justify-center text-primary-600 transition-colors font-bold hover:text-primary-700"
        >
          <Plus size={12} strokeWidth={3} />
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={handleAddToCart}
        aria-label={`Add ${item.name} to cart`}
        // Hover background effect hataya hai yahan se
        className="w-6 h-6 rounded-full border border-primary-600 flex items-center justify-center text-primary-600 transition-colors shadow-sm shrink-0 hover:border-primary-700 hover:text-primary-700"
      >
        <Plus size={13} strokeWidth={3} />
      </button>
    )}
  </div>
</div>
    </div>
  );
}