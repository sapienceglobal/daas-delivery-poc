import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from '../middleware/schemas.js';
import * as authController from '../controllers/authController.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many attempts. Try again after 15 minutes.' }
});

// ── Public Routes ───────────────────────────────────────────────────────────
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/google', authLimiter, authController.googleLogin);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password/:token', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// ── Protected Routes ────────────────────────────────────────────────────────
router.get('/me', protect, authController.getMe);
router.put('/me', protect, authController.updateProfile);
router.put('/me/password', protect, validate(changePasswordSchema), authController.changePassword);
router.post('/logout', protect, authController.logout);

// ── Addresses ───────────────────────────────────────────────────────────────
router.post('/me/addresses', protect, authController.addAddress);
router.put('/me/addresses/:addressId', protect, authController.editAddress);
router.delete('/me/addresses/:addressId', protect, authController.removeAddress);
router.patch('/me/addresses/:addressId/default', protect, authController.setDefaultAddress);

// ── Payment Methods ─────────────────────────────────────────────────────────
router.post('/me/cards', protect, authController.addCard);
router.delete('/me/cards/:cardId', protect, authController.removeCard);
router.patch('/me/cards/:cardId/default', protect, authController.setDefaultCard);

// ── Saved Cart ──────────────────────────────────────────────────────────────
router.get('/me/cart', protect, authController.getSavedCart);
router.put('/me/cart', protect, authController.updateSavedCart);
router.delete('/me/cart', protect, authController.clearSavedCart);

// ── Favorites ───────────────────────────────────────────────────────────────
router.post('/me/favorites/restaurants/:restaurantId', protect, authController.toggleFavoriteRestaurant);
router.post('/me/favorites/items/:itemId', protect, authController.toggleFavoriteItem);

export default router;
