import mongoose from 'mongoose';
import xss from 'xss';
import Coupon from '../models/Coupon.js';
import MenuItem from '../models/MenuItem.js';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import User from '../models/User.js';
import { PLATFORM_DEFAULTS, LOYALTY_CONFIG } from '../config/constants.js';
import { AppError } from '../middleware/errorHandler.js';

const roundMoney = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getDiscountedPrice = (item) => {
  let price = Number(item.price) || 0;
  if (item.discount?.type === 'flat') {
    price = Math.max(0, price - (Number(item.discount.value) || 0));
  }
  if (item.discount?.type === 'percentage') {
    price = Math.max(0, price * (1 - (Number(item.discount.value) || 0) / 100));
  }
  return roundMoney(price);
};

const findSelectedSize = (menuItem, requestedSize) => {
  if (!requestedSize?.name) return null;
  const selected = menuItem.sizeVariations?.find((size) => size.name === requestedSize.name);
  if (!selected) {
    throw new AppError(`Selected size is not available for ${menuItem.name}`, 400);
  }
  return { name: selected.name, price: roundMoney(selected.price) };
};

const findSelectedAddOns = (menuItem, requestedAddOns = []) => {
  if (!Array.isArray(requestedAddOns) || requestedAddOns.length === 0) return [];

  return requestedAddOns.map((requested) => {
    const requestedId = requested._id?.toString();
    const selected = menuItem.addOns?.find((addOn) => (
      requestedId
        ? addOn._id?.toString() === requestedId
        : addOn.name === requested.name
    ));

    if (!selected) {
      throw new AppError(`Selected add-on is not available for ${menuItem.name}`, 400);
    }

    return {
      name: selected.name,
      price: roundMoney(selected.price)
    };
  });
};

export const calculateOrderPricing = async ({
  restaurantId,
  items,
  orderType = 'delivery',
  tip = 0,
  couponCode,
  userId,
  useLoyaltyPoints = false,
  deliveryFeeOverride = null,
  getModel = null
}) => {
  const getPricingModel = (modelName, defaultModel) => {
    return getModel ? getModel(modelName) : defaultModel;
  };
  const RestaurantModel = getPricingModel('Restaurant', Restaurant);
  const MenuItemModel = getPricingModel('MenuItem', MenuItem);
  const CouponModel = getPricingModel('Coupon', Coupon);
  const OrderModel = getPricingModel('Order', Order);
  const UserModel = getPricingModel('User', User);

  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new AppError('Invalid restaurantId', 400);
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Order must contain at least one item', 400);
  }

  const restaurant = await RestaurantModel.findById(restaurantId);
  if (!restaurant) throw new AppError('Restaurant not found', 404);
  if (restaurant.status !== 'approved' || !restaurant.isActive || !restaurant.acceptsOnlineOrders) {
    throw new AppError('Restaurant is not accepting online orders right now', 400);
  }
  if (orderType === 'delivery' && restaurant.acceptsOnlineOrders === false) {
    throw new AppError('Restaurant is not accepting delivery orders right now', 400);
  }
  if (orderType === 'pickup' && !restaurant.acceptsPickup) {
    throw new AppError('Restaurant is not accepting pickup orders right now', 400);
  }
  if (orderType === 'dine_in' && !restaurant.acceptsDineIn) {
    throw new AppError('Restaurant is not accepting dine-in orders right now', 400);
  }

  const menuItemIds = items.map((item) => item.menuItemId || item._id);
  if (menuItemIds.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
    throw new AppError('Invalid menu item in cart', 400);
  }

  const menuItems = await MenuItemModel.find({
    _id: { $in: menuItemIds },
    restaurantId,
    isAvailable: true
  });

  if (menuItems.length !== new Set(menuItemIds.map(String)).size) {
    throw new AppError('One or more cart items are unavailable', 400);
  }

  const menuItemById = new Map(menuItems.map((item) => [item._id.toString(), item]));
  let subtotal = 0;

  const orderItems = items.map((requested) => {
    const menuItem = menuItemById.get((requested.menuItemId || requested._id).toString());
    const quantity = Math.max(1, Math.min(99, parseInt(requested.quantity, 10) || 1));
    const selectedSize = findSelectedSize(menuItem, requested.selectedSize);
    const addOns = findSelectedAddOns(menuItem, requested.addOns);
    const basePrice = selectedSize?.price ?? getDiscountedPrice(menuItem);
    const addOnTotal = addOns.reduce((sum, addOn) => sum + addOn.price, 0);
    const lineTotal = roundMoney((basePrice + addOnTotal) * quantity);
    subtotal = roundMoney(subtotal + lineTotal);

    return {
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: getDiscountedPrice(menuItem),
      quantity,
      selectedSize,
      addOns,
      specialInstructions: xss(String(requested.specialInstructions || '').slice(0, 500)),
      lineTotal
    };
  });

  if (restaurant.minimumOrder && subtotal < restaurant.minimumOrder) {
    throw new AppError(`Minimum order amount is $${restaurant.minimumOrder.toFixed(2)}`, 400);
  }

  const taxRate = restaurant.taxRate ?? PLATFORM_DEFAULTS.DEFAULT_TAX_RATE;
  const tax = roundMoney(subtotal * taxRate);
  const deliveryFee = orderType === 'delivery'
    ? roundMoney(deliveryFeeOverride ?? restaurant.deliveryFee ?? 0)
    : 0;
  const platformFee = roundMoney(PLATFORM_DEFAULTS.PLATFORM_FEE);
  const serviceFee = roundMoney(subtotal * 0.03);
  const safeTip = roundMoney(Math.max(0, Number(tip) || 0));

  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const coupon = await CouponModel.findOne({ code: couponCode.toUpperCase().trim() });
    if (!coupon) throw new AppError('Invalid coupon code', 400);
    if (coupon.specificRestaurant && coupon.specificRestaurant.toString() !== restaurant._id.toString()) {
      throw new AppError('Coupon is not valid for this restaurant', 400);
    }
    const isFirstOrder = userId ? (await OrderModel.countDocuments({ userId })) === 0 : false;
    const validation = coupon.isValid(subtotal, userId, isFirstOrder);
    if (!validation.valid) throw new AppError(validation.reason || 'Coupon is not valid', 400);
    discount = coupon.type === 'free_delivery'
      ? deliveryFee
      : roundMoney(coupon.calculateDiscount(subtotal));
    appliedCoupon = coupon;
  }

  let loyaltyDiscount = 0;
  let pointsUsed = 0;
  if (useLoyaltyPoints && userId) {
    const user = await UserModel.findById(userId).select('loyaltyPoints');
    pointsUsed = Math.max(0, Number(user?.loyaltyPoints) || 0);
    const maxRedeemable = roundMoney(subtotal + tax + deliveryFee + platformFee + serviceFee + safeTip - discount);
    loyaltyDiscount = Math.min(roundMoney(pointsUsed / 100), maxRedeemable);
    pointsUsed = Math.floor(loyaltyDiscount * 100);
  }

  const totalBeforeLoyalty = roundMoney(subtotal + tax + deliveryFee + platformFee + serviceFee + safeTip - discount);
  const total = Math.max(0, roundMoney(totalBeforeLoyalty - loyaltyDiscount));
  const pointsEarned = Math.floor(total * LOYALTY_CONFIG.POINTS_PER_DOLLAR);

  return {
    restaurant,
    orderItems,
    subtotal,
    tax,
    deliveryFee,
    platformFee,
    serviceFee,
    tip: safeTip,
    discount,
    loyaltyDiscount,
    pointsUsed,
    pointsEarned,
    total,
    coupon: appliedCoupon
  };
};

export { roundMoney };
