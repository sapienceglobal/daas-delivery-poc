'use client';

/**
 * Google Tag Manager & GA4 Enhanced E-commerce DataLayer Tracking
 * 
 * Complies with Google's official GA4 e-commerce standard:
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce
 */

/**
 * Safely push an event to window.dataLayer
 */
export function pushToDataLayer(payload) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
  if (payload.event) {
    console.log(`📊 [Analytics GTM] ${payload.event}:`, payload);
  }
}

/**
 * 1. ADD TO CART
 * Triggered whenever a customer adds any food item to their cart.
 *
 * @param {Object} item
 * @param {string} [item.id]
 * @param {string} [item.menuItemId]
 * @param {string} item.name
 * @param {number} item.price
 * @param {number} [item.quantity=1]
 * @param {string} [item.category]
 * @param {string} [item.size]
 */
export function trackAddToCart(item) {
  if (!item || typeof window === 'undefined') return;

  const itemPrice = Number(item.price || item.finalPrice || 0);
  const itemQty = Number(item.quantity || item.qty || 1);
  const totalValue = Number((itemPrice * itemQty).toFixed(2));
  const itemId = String(item.menuItemId || item._id || item.id || '');
  const itemName = String(item.name || 'Food Item');
  const itemCategory = item.categoryName || item.category || 'Food & Beverage';
  const itemVariant = item.selectedSize?.name || item.selectedSize?.label || item.size || undefined;

  // Clear previous ecommerce object (GA4 requirement)
  pushToDataLayer({ ecommerce: null });

  pushToDataLayer({
    event: 'add_to_cart',
    ecommerce: {
      currency: 'USD',
      value: totalValue,
      items: [
        {
          item_id: itemId,
          item_name: itemName,
          price: Number(itemPrice.toFixed(2)),
          quantity: itemQty,
          item_category: itemCategory,
          ...(itemVariant && { item_variant: itemVariant })
        }
      ]
    },
    // Top-level parameters for direct GTM variable mapping
    item_name: itemName,
    price: Number(itemPrice.toFixed(2)),
    quantity: itemQty,
    value: totalValue,
    currency: 'USD'
  });
}

/**
 * 2. BEGIN CHECKOUT
 * Triggered when a customer starts the checkout process with their cart.
 *
 * @param {Array} items
 * @param {number} totalAmount
 */
let lastBeginCheckoutTime = 0;
export function trackBeginCheckout(items = [], totalAmount = 0) {
  if (typeof window === 'undefined') return;

  // Debounce to prevent double-firing if both sidebar click and checkout page mount fire within 6 seconds
  const now = Date.now();
  if (now - lastBeginCheckoutTime < 6000) return;
  lastBeginCheckoutTime = now;

  const validItems = Array.isArray(items) ? items : [];
  const parsedTotal = Number(totalAmount || 0);

  const formattedItems = validItems.map((item, idx) => {
    const itemPrice = Number(item.selectedSize?.price || item.finalPrice || item.price || 0);
    const itemQty = Number(item.quantity || item.qty || 1);
    return {
      item_id: String(item.menuItemId || item._id || item.id || `item_${idx + 1}`),
      item_name: String(item.name || 'Food Item'),
      price: Number(itemPrice.toFixed(2)),
      quantity: itemQty,
      item_category: item.categoryName || item.category || 'Food & Beverage',
      item_variant: item.selectedSize?.name || item.selectedSize?.label || item.size || undefined
    };
  });

  const computedValue = parsedTotal > 0
    ? parsedTotal
    : formattedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);

  pushToDataLayer({ ecommerce: null });

  pushToDataLayer({
    event: 'begin_checkout',
    ecommerce: {
      currency: 'USD',
      value: Number(computedValue.toFixed(2)),
      items: formattedItems
    },
    // Top-level parameters for direct GTM variable mapping
    value: Number(computedValue.toFixed(2)),
    currency: 'USD',
    num_items: formattedItems.reduce((sum, i) => sum + i.quantity, 0)
  });
}

/**
 * 3. PURCHASE (ORDER SUCCESSFUL)
 * Triggered once an order is successfully confirmed in our system.
 * Guaranteed to fire ONLY ONCE per confirmed order ID.
 *
 * @param {Object} order
 */
export function trackPurchase(order) {
  if (!order || typeof window === 'undefined') return;

  const orderId = String(order._id || order.id || order.orderNumber || '');
  if (!orderId) return;

  // Deduplication check: prevent multiple fires on reload / navigation
  const dedupKey = `ga4_purchase_fired_${orderId}`;
  try {
    if (sessionStorage.getItem(dedupKey) || localStorage.getItem(dedupKey)) {
      return; // Already tracked for this order
    }
    sessionStorage.setItem(dedupKey, 'true');
    localStorage.setItem(dedupKey, 'true');
  } catch (_) {}

  const orderTotal = Number(
    order.total ?? order.pricing?.total ?? order.pricing?.subtotal ?? 0
  );
  const tax = Number(order.tax ?? order.pricing?.tax ?? 0);
  const shipping = Number(order.deliveryFee ?? order.pricing?.deliveryFee ?? 0);
  const coupon = order.couponCode || order.coupon?.code || order.appliedCoupon?.code || undefined;
  const transactionId = String(order.orderNumber || order._id || orderId);

  const rawItems = Array.isArray(order.items) ? order.items : [];
  const formattedItems = rawItems.map((item, idx) => {
    const itemPrice = Number(item.price ?? item.unitPrice ?? item.finalPrice ?? 0);
    const itemQty = Number(item.quantity ?? item.qty ?? 1);
    return {
      item_id: String(item.menuItemId || item._id || item.id || `item_${idx + 1}`),
      item_name: String(item.name || 'Food Item'),
      price: Number(itemPrice.toFixed(2)),
      quantity: itemQty,
      item_category: item.categoryName || item.category || 'Food & Beverage',
      item_variant: item.size || item.selectedSize?.name || undefined
    };
  });

  pushToDataLayer({ ecommerce: null });

  pushToDataLayer({
    event: 'purchase',
    ecommerce: {
      transaction_id: transactionId,
      value: Number(orderTotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      currency: 'USD',
      ...(coupon && { coupon }),
      items: formattedItems
    },
    // Top-level parameters for direct GTM / Google Ads conversion variables
    transaction_id: transactionId,
    order_id: orderId,
    value: Number(orderTotal.toFixed(2)),
    currency: 'USD',
    payment_type: order.paymentMethod || 'standard',
    order_type: order.orderType || 'delivery'
  });
}
