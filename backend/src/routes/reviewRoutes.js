import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import * as reviewController from '../controllers/reviewController.js';

const router = Router();

router.get('/restaurant/:restaurantId', reviewController.getRestaurantReviews);
router.get('/item/:itemId', reviewController.getItemReviews);
router.get('/item/:itemId/my-review', protect, reviewController.getMyItemReview);

router.post('/', protect, reviewController.createReview);
router.put('/:id', protect, reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview);

router.post('/:id/reply', protect, reviewController.replyToReview);
router.post('/:id/helpful', protect, reviewController.markHelpful);

export default router;
