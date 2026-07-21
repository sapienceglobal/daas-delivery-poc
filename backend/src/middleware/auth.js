import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { AppError } from './errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('[AUTH] WARNING: JWT_SECRET is not set in environment. Using insecure default — NOT SAFE FOR PRODUCTION.');
}
const resolvedJwtSecret = JWT_SECRET || 'DEV_MARKETPLACE_JWT_SECRET';

/**
 * Protects a route — verifies JWT from cookie or Authorization header
 * and attaches the user document to req.user.
 */
export const protect = async (req, _res, next) => {
  let token;

  // 1. Check httpOnly cookie first
  if (req.cookies?.token || req.cookies?.marketplace_token) {
    token = req.cookies.token || req.cookies.marketplace_token;
  }
  // 2. Fallback to Authorization: Bearer <token>
  else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized, no token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, resolvedJwtSecret);

    // Switch the request tenant db connection dynamically based on the signed JWT token payload
    const tenantId = decoded.tenantId || 'marketplace';
    if (tenantId === 'marketplace') {
      req.tenantDb = mongoose.connection;
    } else {
      const dbName = `daas_poc_${tenantId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      req.tenantDb = mongoose.connection.useDb(dbName, { useCache: true });
    }

    const user = await req.getModel('User').findById(decoded.id).select('-password -salt');

    if (!user) {
      return next(new AppError('Not authorized, user not found', 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(new AppError('Not authorized, token failed', 401));
  }
};

/**
 * Role-based authorization middleware.
 * Must be used AFTER protect().
 *
 * Usage:
 *   router.get('/admin-only', protect, authorize('admin'), controller.fn);
 *   router.get('/staff', protect, authorize('admin', 'merchant'), controller.fn);
 */
export const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('Forbidden: Insufficient privileges', 403));
    }
    return next();
  };
};
