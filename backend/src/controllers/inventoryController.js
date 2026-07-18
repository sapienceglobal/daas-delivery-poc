import Inventory from '../models/Inventory.js';
import Restaurant from '../models/Restaurant.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';

// Get all inventory for a restaurant
export const getInventory = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  
  // Ensure the restaurant belongs to the merchant (if merchant)
  if (req.user.role === 'merchant') {
    const owns = await Restaurant.exists({ _id: restaurantId, ownerId: req.user._id });
    if (!owns) throw new AppError('Not authorized for this restaurant', 403);
  }

  const items = await Inventory.find({ restaurantId, isActive: true }).sort({ name: 1 });
  res.success(response, items);
});

// Create inventory item
export const createInventoryItem = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const data = req.body;

  if (req.user.role === 'merchant') {
    const owns = await Restaurant.exists({ _id: restaurantId, ownerId: req.user._id });
    if (!owns) throw new AppError('Not authorized for this restaurant', 403);
  }

  const existing = await Inventory.findOne({ restaurantId, name: data.name });
  if (existing) {
    throw new AppError('Item with this name already exists in inventory', 400);
  }

  const item = await Inventory.create({ ...data, restaurantId });
  res.success(response, item, 201);
});

// Update inventory item
export const updateInventoryItem = asyncHandler(async (req, response) => {
  const { itemId } = req.params;
  const data = req.body;

  const item = await Inventory.findById(itemId);
  if (!item) throw new AppError('Item not found', 404);

  if (req.user.role === 'merchant') {
    const owns = await Restaurant.exists({ _id: item.restaurantId, ownerId: req.user._id });
    if (!owns) throw new AppError('Not authorized for this restaurant', 403);
  }

  const updated = await Inventory.findByIdAndUpdate(itemId, data, { new: true, runValidators: true });
  res.success(response, updated);
});

// Receive shipment (add to stock)
export const receiveShipment = asyncHandler(async (req, response) => {
  const { itemId } = req.params;
  const { quantity, costPerUnit, supplier } = req.body;

  if (!quantity || quantity <= 0) throw new AppError('Invalid quantity', 400);

  const item = await Inventory.findById(itemId);
  if (!item) throw new AppError('Item not found', 404);

  if (req.user.role === 'merchant') {
    const owns = await Restaurant.exists({ _id: item.restaurantId, ownerId: req.user._id });
    if (!owns) throw new AppError('Not authorized for this restaurant', 403);
  }

  const totalCost = quantity * (costPerUnit || item.costPerUnit || 0);

  item.quantity += quantity;
  item.lastRestockedAt = new Date();
  if (costPerUnit) item.costPerUnit = costPerUnit;
  
  item.purchases.push({
    quantity,
    costPerUnit: costPerUnit || item.costPerUnit || 0,
    totalCost,
    supplier: supplier || item.supplier?.name || null,
    purchasedBy: req.user._id
  });

  await item.save();
  res.success(response, item);
});

// Log wastage (reduce stock)
export const logWastage = asyncHandler(async (req, response) => {
  const { itemId } = req.params;
  const { quantity, reason } = req.body;

  if (!quantity || quantity <= 0) throw new AppError('Invalid quantity', 400);

  const item = await Inventory.findById(itemId);
  if (!item) throw new AppError('Item not found', 404);

  if (req.user.role === 'merchant') {
    const owns = await Restaurant.exists({ _id: item.restaurantId, ownerId: req.user._id });
    if (!owns) throw new AppError('Not authorized for this restaurant', 403);
  }

  if (item.quantity < quantity) {
    throw new AppError('Cannot waste more than current stock', 400);
  }

  item.quantity -= quantity;
  
  item.wastageLog.push({
    quantity,
    reason,
    loggedBy: req.user._id
  });

  await item.save();
  res.success(response, item);
});

// Delete (soft delete)
export const deleteInventoryItem = asyncHandler(async (req, response) => {
  const { itemId } = req.params;

  const item = await Inventory.findById(itemId);
  if (!item) throw new AppError('Item not found', 404);

  if (req.user.role === 'merchant') {
    const owns = await Restaurant.exists({ _id: item.restaurantId, ownerId: req.user._id });
    if (!owns) throw new AppError('Not authorized for this restaurant', 403);
  }

  item.isActive = false;
  await item.save();
  res.success(response, { message: 'Item removed from inventory' });
});
