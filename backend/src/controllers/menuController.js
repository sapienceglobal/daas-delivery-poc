import mongoose from 'mongoose';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import { slugify } from '../utils/slugify.js';
import { triggerFrontendRevalidation } from '../utils/revalidateFrontend.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

const getModels = (req) => ({
  Category: req.getModel?.('Category') || Category,
  MenuItem: req.getModel?.('MenuItem') || MenuItem,
  Restaurant: req.getModel?.('Restaurant') || Restaurant,
});

const ensureOwner = async (restaurantId, user, RestaurantModel) => {
  if (user.role === 'admin') return;
  const restaurant = await RestaurantModel.findById(restaurantId);
  if (!restaurant) throw new AppError('Restaurant not found', 404);
  if (restaurant.ownerId?.toString() !== user._id.toString()) {
    throw new AppError('You can only manage your own restaurant menu', 403);
  }
};

// ── Public ──────────────────────────────────────────────────────────────────

// Accepts either a Mongo ObjectId, exact slug, slug prefix, or restaurant name
const resolveRestaurantId = async (identifier, RestaurantModel) => {
  if (!identifier) return null;
  if (mongoose.Types.ObjectId.isValid(identifier) && String(identifier).length === 24) {
    return new mongoose.Types.ObjectId(identifier);
  }
  let restaurant = await RestaurantModel.findOne({ slug: identifier }).select('_id').lean();
  if (!restaurant) {
    restaurant = await RestaurantModel.findOne({
      $or: [
        { slug: new RegExp(`^${identifier}`, 'i') },
        { name: new RegExp(identifier.replace(/[-_]/g, ' '), 'i') },
      ],
    }).select('_id').lean();
  }
  return restaurant?._id || null;
};


import { sanitizeMenuItem } from '../utils/imageUrl.js';

export const getMenuByRestaurant = asyncHandler(async (req, response) => {
  const { Category, MenuItem, Restaurant } = getModels(req);
  const restaurantId = await resolveRestaurantId(req.params.restaurantId, Restaurant);
  if (!restaurantId) throw new AppError('Restaurant not found', 404);

  const categories = await Category.find({ restaurantId, isActive: true })
    .sort({ sortOrder: 1 }).lean();

  const items = await MenuItem.find({ restaurantId })
    .sort({ sortOrder: 1 }).lean();

  const menu = categories.map(cat => ({
    ...cat,
    items: items
      .filter(item => item.categoryId.toString() === cat._id.toString())
      .map(sanitizeMenuItem)
  }));

  res.success(response, { data: menu });
});

/**
 * GET /api/menu/items/:id[?restaurant=<id|slug>]
 *
 * `:id` may be:
 *   1. a clean slug           -> "samosa"            (canonical, preferred)
 *   2. an old slug            -> "veg-samosa"        (item was renamed)
 *   3. a raw ObjectId         -> "6a7c9a99..."       (legacy links)
 *   4. legacy "slug-objectid" -> "samosa-6a7c9a99..." (legacy links)
 *
 * The response always contains the item's current canonical `slug`, so the
 * frontend can 301 / replace the URL whenever the requested key differs.
 */
export const getMenuItem = asyncHandler(async (req, response) => {
  const { MenuItem, Restaurant } = getModels(req);
  const identifier = String(req.params.id || '').trim();
  const restaurantId = await resolveRestaurantId(req.query.restaurant, Restaurant);
  const scope = restaurantId ? { restaurantId } : {};

  const populate = (q) => q.populate('categoryId', 'name').lean();
  let item = null;

  // 1 & 2. Clean slug or previous slug (fast indexed lookup)
  const key = identifier.toLowerCase();
  item = await populate(MenuItem.findOne({ ...scope, slug: key }));
  if (!item) item = await populate(MenuItem.findOne({ ...scope, previousSlugs: key }));

  // 3 & 4. Legacy links containing an ObjectId
  if (!item) {
    const legacyId = identifier.match(/[0-9a-fA-F]{24}$/)?.[0];
    if (legacyId) item = await populate(MenuItem.findOne({ ...scope, _id: legacyId }));
  }

  // 5. Items created before slugs existed (no stored slug yet) — match by slugified name
  if (!item) {
    const candidates = await MenuItem.find({ ...scope, $or: [{ slug: null }, { slug: { $exists: false } }] })
      .select('_id name').lean();
    const match = candidates.find(c => slugify(c.name) === key);
    if (match) item = await populate(MenuItem.findById(match._id));
  }

  if (!item) throw new AppError('Menu item not found', 404);
  if (!item.slug) item.slug = slugify(item.name);
  sanitizeMenuItem(item);

  res.success(response, { data: item });
});

export const getCategoriesByRestaurant = asyncHandler(async (req, response) => {
  const { Category } = getModels(req);
  const categories = await Category.find({ restaurantId: req.params.restaurantId })
    .sort({ sortOrder: 1 }).lean();
  res.success(response, { data: categories });
});

// ── Category CRUD ───────────────────────────────────────────────────────────

export const createCategory = asyncHandler(async (req, response) => {
  const { Category, Restaurant } = getModels(req);
  const { restaurantId, name, description, image, sortOrder } = req.body;
  if (!restaurantId || !name) throw new AppError('restaurantId and name are required', 400);

  await ensureOwner(restaurantId, req.user, Restaurant);

  const category = await Category.create({ restaurantId, name, description, image, sortOrder });
  res.created(response, { data: category });
});

export const updateCategory = asyncHandler(async (req, response) => {
  const { Category, Restaurant } = getModels(req);
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  await ensureOwner(category.restaurantId, req.user, Restaurant);

  const allowed = ['name', 'description', 'image', 'sortOrder', 'isActive'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) category[key] = req.body[key];
  }

  await category.save();
  res.success(response, { data: category, message: 'Category updated' });
});

export const deleteCategory = asyncHandler(async (req, response) => {
  const { Category, MenuItem, Restaurant } = getModels(req);
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);

  await ensureOwner(category.restaurantId, req.user, Restaurant);

  // delete associated menu items
  await MenuItem.deleteMany({ categoryId: category._id });
  await category.deleteOne();

  res.success(response, { message: 'Category and associated items deleted' });
});

// ── MenuItem CRUD ───────────────────────────────────────────────────────────

export const createMenuItem = asyncHandler(async (req, response) => {
  const { Category, MenuItem, Restaurant } = getModels(req);
  const { restaurantId, categoryId, name, price } = req.body;
  if (!restaurantId || !categoryId || !name || price === undefined) {
    throw new AppError('restaurantId, categoryId, name, and price are required', 400);
  }

  await ensureOwner(restaurantId, req.user, Restaurant);

  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) throw new AppError('Category not found', 404);

  const item = await MenuItem.create(req.body);

  // Trigger frontend revalidation for the new item, its OG images, and menu listing
  const slug = item.slug;
  const id = item._id.toString();
  const revalPaths = [
    `/item/${id}`,
    `/item/${id}/opengraph-image`,
    '/menu',
    '/sitemap.xml',
  ];
  if (slug) {
    revalPaths.push(`/item/${slug}`);
    revalPaths.push(`/item/${slug}/opengraph-image`);
  }
  triggerFrontendRevalidation(revalPaths);

  res.created(response, { data: item });
});

export const updateMenuItem = asyncHandler(async (req, response) => {
  const { MenuItem, Restaurant } = getModels(req);
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new AppError('Menu item not found', 404);

  await ensureOwner(item.restaurantId, req.user, Restaurant);

  // Authorization check: Only authorized roles (merchant, admin) can edit menu items & SEO
  if (!['admin', 'merchant'].includes(req.user?.role)) {
    throw new AppError('Forbidden: Only merchants and admins are authorized to edit menu items', 403);
  }

  const allowed = [
    'name', 'description', 'price', 'image', 'images', 'categoryId',
    'sizeVariations', 'addOns', 'calories', 'preparationTime',
    'cookingMethod', 'ingredients',
    'tags', 'isVeg', 'isVegan', 'isSpicy', 'isGlutenFree', 'isBestseller',
    'isAvailable', 'sortOrder', 'discount',
    'seoTitle', 'seoDescription', 'seoKeywords', 'seoImage'
  ];

  for (const key of allowed) {
    if (req.body[key] !== undefined) item[key] = req.body[key];
  }

  await item.save();

  // Trigger frontend on-demand revalidation for both slug, id, OG images, and sitemap
  const slug = item.slug;
  const id = item._id.toString();
  const revalPaths = [
    `/item/${id}`,
    `/item/${id}/opengraph-image`,
    '/menu',
    '/sitemap.xml',
  ];
  if (slug) {
    revalPaths.push(`/item/${slug}`);
    revalPaths.push(`/item/${slug}/opengraph-image`);
  }
  triggerFrontendRevalidation(revalPaths);

  res.success(response, { data: item, message: 'Menu item updated' });
});

export const deleteMenuItem = asyncHandler(async (req, response) => {
  const { MenuItem, Restaurant } = getModels(req);
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new AppError('Menu item not found', 404);

  await ensureOwner(item.restaurantId, req.user, Restaurant);

  if (!['admin', 'merchant'].includes(req.user?.role)) {
    throw new AppError('Forbidden: Only merchants and admins are authorized to delete menu items', 403);
  }

  const slug = item.slug;
  const id = item._id.toString();
  await item.deleteOne();

  const revalPaths = [
    `/item/${id}`,
    `/item/${id}/opengraph-image`,
    '/menu',
    '/sitemap.xml',
  ];
  if (slug) {
    revalPaths.push(`/item/${slug}`);
    revalPaths.push(`/item/${slug}/opengraph-image`);
  }
  triggerFrontendRevalidation(revalPaths);

  res.success(response, { message: 'Menu item deleted' });
});

export const toggleItemAvailability = asyncHandler(async (req, response) => {
  const { MenuItem, Restaurant } = getModels(req);
  const item = await MenuItem.findById(req.params.id);
  if (!item) throw new AppError('Menu item not found', 404);

  await ensureOwner(item.restaurantId, req.user, Restaurant);

  if (!['admin', 'merchant'].includes(req.user?.role)) {
    throw new AppError('Forbidden: Only merchants and admins are authorized to toggle availability', 403);
  }

  item.isAvailable = !item.isAvailable;
  await item.save();

  const slug = item.slug;
  const id = item._id.toString();
  const revalPaths = [
    `/item/${id}`,
    `/item/${id}/opengraph-image`,
    '/menu',
    '/sitemap.xml',
  ];
  if (slug) {
    revalPaths.push(`/item/${slug}`);
    revalPaths.push(`/item/${slug}/opengraph-image`);
  }
  triggerFrontendRevalidation(revalPaths);

  res.success(response, { data: item, message: `Menu item is now ${item.isAvailable ? 'active' : 'inactive'}` });
});

export const bulkDeleteItems = asyncHandler(async (req, response) => {
  const { MenuItem, Restaurant } = getModels(req);
  const { itemIds } = req.body;
  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    throw new AppError('Please provide an array of item IDs to delete', 400);
  }

  const items = await MenuItem.find({ _id: { $in: itemIds } });
  if (items.length === 0) throw new AppError('No matching items found', 404);

  // ensure owner for at least the first item (assuming all from same restaurant in UI)
  if (items[0]) {
    await ensureOwner(items[0].restaurantId, req.user, Restaurant);
  }

  await MenuItem.deleteMany({ _id: { $in: itemIds } });
  res.success(response, { message: `Successfully deleted ${items.length} items` });
});

export const bulkUpdateItems = asyncHandler(async (req, response) => {
  const { MenuItem, Restaurant } = getModels(req);
  const { itemIds, updateData } = req.body;
  if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
    throw new AppError('Please provide an array of item IDs to update', 400);
  }

  const items = await MenuItem.find({ _id: { $in: itemIds } });
  if (items.length === 0) throw new AppError('No matching items found', 404);

  if (items[0]) {
    await ensureOwner(items[0].restaurantId, req.user, Restaurant);
  }

  const allowedUpdates = ['isAvailable', 'categoryId', 'isVeg', 'isSpicy'];
  const updateObj = {};
  for (const key of allowedUpdates) {
    if (updateData[key] !== undefined) {
      updateObj[key] = updateData[key];
    }
  }

  if (Object.keys(updateObj).length === 0) {
    throw new AppError('No valid fields provided to update', 400);
  }

  await MenuItem.updateMany({ _id: { $in: itemIds } }, { $set: updateObj });
  res.success(response, { message: `Successfully updated ${items.length} items` });
});

// ── Bulk Import ─────────────────────────────────────────────────────────────

export const bulkImportItems = asyncHandler(async (req, response) => {
  const { Category, MenuItem, Restaurant } = getModels(req);
  const { restaurantId, items } = req.body;
  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    throw new AppError('restaurantId and items array are required', 400);
  }

  await ensureOwner(restaurantId, req.user, Restaurant);

  const created = [];

  for (const item of items) {
    // find or create category
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
