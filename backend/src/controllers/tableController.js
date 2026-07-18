import Table from '../models/Table.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import * as res from '../utils/responseFormatter.js';


/**
 * @desc    Get all tables for a restaurant
 * @route   GET /api/tables/:restaurantId
 * @access  Private (Merchant/Admin/Employee)
 */
export const getTables = asyncHandler(async (req, response) => {
  const { restaurantId } = req.params;
  const tables = await Table.find({ restaurantId, isActive: true }).populate('currentOrderId', 'orderNumber status subtotal items').sort('tableNumber');
  res.success(response, { data: tables });
});

/**
 * @desc    Create a new table
 * @route   POST /api/tables
 * @access  Private (Merchant/Admin)
 */
export const createTable = asyncHandler(async (req, response) => {
  const { restaurantId, tableNumber, capacity, floor, positionX, positionY, shape } = req.body;

  const exists = await Table.findOne({ restaurantId, tableNumber });
  if (exists) throw new AppError('Table number already exists', 400);

  const table = await Table.create({
    restaurantId,
    tableNumber,
    capacity,
    floor,
    positionX,
    positionY,
    shape
  });

  res.created(response, { data: table });
});

/**
 * @desc    Update a table's details or position
 * @route   PUT /api/tables/:id
 * @access  Private (Merchant/Admin)
 */
export const updateTable = asyncHandler(async (req, response) => {
  const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!table) throw new AppError('Table not found', 404);
  res.success(response, { data: table });
});

/**
 * @desc    Delete (deactivate) a table
 * @route   DELETE /api/tables/:id
 * @access  Private (Merchant/Admin)
 */
export const deleteTable = asyncHandler(async (req, response) => {
  const table = await Table.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!table) throw new AppError('Table not found', 404);
  res.success(response, { message: 'Table deleted successfully' });
});

export const moveTable = asyncHandler(async (req, response) => {
  const { sourceTableId, targetTableId } = req.body;

  const sourceTable = await Table.findById(sourceTableId);
  const targetTable = await Table.findById(targetTableId);

  if (!sourceTable || !targetTable) throw new AppError('Table not found', 404);
  if (sourceTable.status !== 'occupied') throw new AppError('Source table is not occupied', 400);
  if (targetTable.status === 'occupied') throw new AppError('Target table is already occupied', 400);

  // Transfer order
  targetTable.currentOrderId = sourceTable.currentOrderId;
  targetTable.status = 'occupied';
  targetTable.occupiedAt = sourceTable.occupiedAt;

  // Clear source
  sourceTable.currentOrderId = null;
  sourceTable.status = 'available';
  sourceTable.occupiedAt = null;

  await sourceTable.save();
  await targetTable.save();

  res.success(response, { message: 'Table moved successfully', targetTable });
});

export const mergeTables = asyncHandler(async (req, response) => {
  const { mainTableId, mergeTableId } = req.body;

  const mainTable = await Table.findById(mainTableId);
  const mergeTable = await Table.findById(mergeTableId);

  if (!mainTable || !mergeTable) throw new AppError('Table not found', 404);
  if (mainTable.status !== 'occupied') throw new AppError('Main table must be occupied', 400);
  
  // Actually transferring orders or just marking it as merged
  mergeTable.mergedWith = [...new Set([...(mergeTable.mergedWith || []), mainTable._id])];
  mergeTable.status = 'occupied';
  
  await mergeTable.save();

  res.success(response, { message: 'Tables merged successfully', mainTable, mergeTable });
});

/**
 * @desc    Update table status (e.g., occupied, available, assign order)
 * @route   PUT /api/tables/:id/status
 * @access  Private (Merchant/Employee)
 */
export const updateTableStatus = asyncHandler(async (req, response) => {
  const { status, currentOrderId } = req.body;
  const updateData = { status };
  
  if (status === 'occupied') {
    updateData.occupiedAt = new Date();
    if (currentOrderId) updateData.currentOrderId = currentOrderId;
  } else if (status === 'available') {
    updateData.occupiedAt = null;
    updateData.currentOrderId = null;
  }

  const table = await Table.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('currentOrderId', 'orderNumber status subtotal items');
  if (!table) throw new AppError('Table not found', 404);

  // Notify KDS / POS clients about table update
  const io = req.app.get('io');
  if (io) io.to(table.restaurantId.toString()).emit('table_update', table);

  res.success(response, { data: table });
});
