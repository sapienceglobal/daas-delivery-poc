import express from 'express';
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
  moveTable,
  mergeTables
} from '../controllers/tableController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/:restaurantId', getTables);
router.post('/', authorize('merchant', 'admin'), createTable);
router.put('/:id', authorize('merchant', 'admin'), updateTable);
router.delete('/:id', authorize('merchant', 'admin'), deleteTable);

// POS actions
router.put('/:id/status', updateTableStatus);
router.post('/move', moveTable);
router.post('/merge', mergeTables);

export default router;
