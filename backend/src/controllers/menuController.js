import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

const ensureOwner = async (restaurantId, user) => {
  if (user.role === 'admin') return;
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new AppError('Restaurant not found', 404);
  if (restaurant.ownerId?.toString() !== user._id.toString()) {
    throw new AppError('You can only manage your own restaurant menu', 403);
  }
};

// ── Public ──────────────────────────────────────────────────────────────────

export const getMenuByRestaurant = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;

  const categories = await Category.find({ restaurantId, isActive: true })
    .sort({ sortOrder: 1 }).lean();

  const items = await MenuItem.find({ restaurantId })
    .sort({ sortOrder: 1 }).lean();

  const menu = categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.categoryId.toString() === cat._id.toString())
  }));

  res.success(response, { data: menu });
});

export const getMenuItem = asyncHandler(async (req, response) => {
  const item = await MenuItem.findById(req.params.id)
    .populate('categoryId', 'name')
    .lean();
  if (!item) throw new AppError('Menu item not found', 404);
  res.success(response, { data: item });
});

export const getCategoriesByRestaurant = asyncHandler(async (req, response) => {
  const categories = await Category.find({ restaurantId: req.params.restaurantId })
    .sort({ sortOrder: 1 }).lean();
  res.success(response, { data: categories });
});

// ── Category CRUD ───────────────────────────────────────────────────────────

export const createCategory = asyncHandler(async (req, response) => {
  const { restaurantId, name, description, image, sortOrder } = req.body;
  if (!restaurantId || !name) throw new AppError('restaurantId and name are required', 400);

  await ensureOwner(restaurantId, req.user);

  const category = await Category.create({ restaurantId, name, description, image, sortOrder });
  res.created(response, { data: category });
});

export const updateCategory = asyncHandler(async (req, response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  await ensureOwner(category.restaurantId, req.user);

  const allowed = ['name', 'description', 'image', 'sortOrder', 'isActive'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) category[key] = req.body[key];
  }

  await category.save();
  res.success(response, { data: category, message: 'Category updated' });
});

export const deleteCategory = asyncHandler(async (req, response) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  await ensureOwner(category.restaurantId, req.user);

  // Delete associated menu items
  await MenuItem.deleteMany({ categoryId: category._id });
  await category.deleteOne();

  res.success(response, { message: 'Category and associated items deleted' });
});

// ── MenuItem CRUD ───────────────────────────────────────────────────────────

export const createMenuItem = asyncHandler(async (req, response) => {
  const { restaurantId, categoryId, name, price } = req.body;
  if (!restaurantId || !categoryId || !name || price === undefined) {
    throw new AppError('restaurantId, categoryId, name, and price are required', 400);
  }

  await ensureOwner(restaurantId, req.user);

  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) throw new AppError('Category not found', 404);

  const item = await MenuItem.create(req.body);
  res.created(response, { data: item });
});

export const updateMenuItem = asyncHandler(async (req, response) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new AppError('Menu item not found', 404);

  await ensureOwner(item.restaurantId, req.user);

  const allowed = [
    'name', 'description', 'price', 'image', 'images', 'categoryId',
    'sizeVariations', 'addOns', 'calories', 'preparationTime',
    'cookingMethod', 'ingredients',
    'tags', 'isVeg', 'isVegan', 'isSpicy', 'isGlutenFree', 'isBestseller',
    'isAvailable', 'sortOrder', 'discount'
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) item[key] = req.body[key];
  }

  await item.save();
  res.success(response, { data: item, message: 'Menu item updated' });
});

export const deleteMenuItem = asyncHandler(async (req, response) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new AppError('Menu item not found', 404);

  await ensureOwner(item.restaurantId, req.user);

  await item.deleteOne();
  res.success(response, { message: 'Menu item deleted' });
});

export const toggleItemAvailability = asyncHandler(async (req, response) => {
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new AppError('Menu item not found', 404);

  await ensureOwner(item.restaurantId, req.user);

  item.isAvailable = !item.isAvailable;
  await item.save();

  res.success(response, {
    data: item,
    message: `Item ${item.isAvailable ? 'enabled' : 'disabled'}`
  });
});

// ── Bulk Import ─────────────────────────────────────────────────────────────

export const bulkImportItems = asyncHandler(async (req, response) => {
  const { restaurantId, items } = req.body;
  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    throw new AppError('restaurantId and items array are required', 400);
  }

  await ensureOwner(restaurantId, req.user);

  const created = [];

  for (const item of items) {
    // Find or create category
    let category = await Category.findOne({ restaurantId, name: item.category || 'General' });
    if (!category) {
      category = await Category.create({ restaurantId, name: item.category || 'General' });
    }

    const menuItem = await MenuItem.create({
      ...item,
      restaurantId,
      categoryId: category._id
    });
    created.push(menuItem);
  }

  res.created(response, { data: created, message: `${created.length} items imported` });
});
