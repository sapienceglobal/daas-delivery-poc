import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { USER_ROLES } from '../config/constants.js';
import * as crmController from '../controllers/crmController.js';

const router = express.Router();

router.use(protect);
router.use(authorize(USER_ROLES.ADMIN, USER_ROLES.MERCHANT));

router.get('/restaurant/:restaurantId/customers', crmController.getCustomers);
router.post('/restaurant/:restaurantId/customers', crmController.createCustomer);
router.put('/restaurant/:restaurantId/customers/bulk', crmController.bulkUpdateCustomers);
router.delete('/restaurant/:restaurantId/customers/bulk', crmController.bulkDeleteCustomers);
router.get('/restaurant/:restaurantId/customers/:customerId/profile', crmController.getCustomerProfile);
router.put('/restaurant/:restaurantId/customers/:customerId', crmController.updateCustomer);
router.delete('/restaurant/:restaurantId/customers/:customerId', crmController.deleteCustomer);
router.post('/restaurant/:restaurantId/promo', crmController.sendPromo);

export default router;
