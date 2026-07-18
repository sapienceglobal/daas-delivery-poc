import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import * as supplierController from '../controllers/supplierController.js';

const router = Router();

router.get('/restaurant/:restaurantId', protect, authorize('merchant', 'admin'), supplierController.getSuppliers);
router.post('/restaurant/:restaurantId', protect, authorize('merchant', 'admin'), supplierController.createSupplier);
router.put('/:id', protect, authorize('merchant', 'admin'), supplierController.updateSupplier);
router.delete('/:id', protect, authorize('merchant', 'admin'), supplierController.deleteSupplier);

export default router;
