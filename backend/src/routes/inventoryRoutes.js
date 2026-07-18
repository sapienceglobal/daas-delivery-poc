import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';
import * as inventoryController from '../controllers/inventoryController.js';

const router = express.Router();

router.use(protect);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.MERCHANT));

// Routes mounted at /api/inventory
router.get('/restaurant/:restaurantId', inventoryController.getInventory);
router.post('/restaurant/:restaurantId', inventoryController.createInventoryItem);

router.put('/:itemId', inventoryController.updateInventoryItem);
router.delete('/:itemId', inventoryController.deleteInventoryItem);

router.post('/:itemId/receive', inventoryController.receiveShipment);
router.post('/:itemId/wastage', inventoryController.logWastage);

export default router;
