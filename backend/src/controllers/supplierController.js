import Supplier from '../models/Supplier.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';
import { ensureCanManageRestaurant } from './authController.js';

export const getSuppliers = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  ensureCanManageRestaurant(req, restaurantId);

  const suppliers = await Supplier.find({ restaurantId, isActive: true }).sort({ name: 1 });
  res.success(response, { data: suppliers });
});

export const createSupplier = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  ensureCanManageRestaurant(req, restaurantId);

  const supplier = await Supplier.create({ ...req.body, restaurantId });
  res.created(response, { data: supplier, message: 'Supplier created' });
});

export const updateSupplier = asyncHandler(async (req, response) => {
  const { id } = req.params;
  const supplier = await Supplier.findById(id);
  if (!supplier) throw new AppError('Supplier not found', 404);
  ensureCanManageRestaurant(req, supplier.restaurantId);

  Object.assign(supplier, req.body);
  await supplier.save();
  res.success(response, { data: supplier, message: 'Supplier updated' });
});

export const deleteSupplier = asyncHandler(async (req, response) => {
  const { id } = req.params;
  const supplier = await Supplier.findById(id);
  if (!supplier) throw new AppError('Supplier not found', 404);
  ensureCanManageRestaurant(req, supplier.restaurantId);

  supplier.isActive = false;
  await supplier.save();
  res.success(response, { message: 'Supplier deleted' });
});
