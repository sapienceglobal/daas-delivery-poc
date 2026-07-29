import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { bindTenantContext } from '../utils/tenant.js';

const JWT_SECRET = process.env.JWT_SECRET;
// H2 FIX: JWT_SECRET is mandatory in production. A missing secret allows any request
// to be authorized using the known fallback string — that is a critical vulnerability.
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    // Fatal — crash the process so the deployment fails loudly rather than running insecurely.
    console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start in production with an insecure default.');
    process.exit(1);
  } else {
    console.warn('[AUTH] WARNING: JWT_SECRET is not set. Using insecure default — NOT SAFE FOR PRODUCTION.');
  }
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

    // Protected routes always trust the signed JWT tenant, never the browser header.
    bindTenantContext(req, decoded.tenantId || 'marketplace');

    const user = await req.getModel('User').findById(decoded.id).select('-password -salt');

    if (!user) {
      return next(new AppError('Not authorized, user not found', 401));
    }

    // Block deactivated accounts even if they have a valid token
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact support.', 403));
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
