import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { bindTenantContext } from '../utils/tenant.js';

const JWT_SECRET = process.env.JWT_SECRET;
// H2 FIX: JWT_SECRET is mandatory in production. A missing secret allows any request
// to be authorized using the known fallback string — that is a critical vulnerability.
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    // fatal — crash the process so the deployment fails loudly rather than running insecurely.
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

    // protected routes always trust the signed JWT tenant, never the browser header.
    // however, if FORCE_TENANT_ID is set (single-tenant setup), it takes precedence over even the JWT.
    const forcedTenant = process.env.FORCE_TENANT_ID;
    bindTenantContext(req, forcedTenant || decoded.tenantId || 'marketplace');

    const user = await req.getModel('User').findById(decoded.id).select('-password -salt');

    if (!user) {
      return next(new AppError('Not authorized, user not found', 401));
    }

    // block deactivated accounts even if they have a valid token
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Contact support.', 403));
    }

    // invalidate old sessions if password was changed
    if ((decoded.tokenVersion || 0) !== (user.tokenVersion || 0)) {
      return next(new AppError('Session expired. Please log in again.', 401));
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Not authorized, token failed', 401));
    }
    // if it's a DB error or something else, pass it down so it's logged properly
    return next(error);
  }
};

/**
 * Optional Auth - if a valid token is provided, req.user will be populated,
 * else it will just proceed to the next middleware without throwing 401.
 */
export const optionalAuth = async (req, res, next) => {
  let token;
  if (req.cookies?.token || req.cookies?.marketplace_token) {
    token = req.cookies.token || req.cookies.marketplace_token;
  } else if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, resolvedJwtSecret);
    const forcedTenant = process.env.FORCE_TENANT_ID;
    bindTenantContext(req, forcedTenant || decoded.tenantId || 'marketplace');
    const user = await req.getModel('User').findById(decoded.id).select('-password -salt');
    if (user && user.isActive && (decoded.tokenVersion || 0) === (user.tokenVersion || 0)) {
      req.user = user;
    }
  } catch (error) {
    // Ignore invalid tokens for optional auth
  }
  return next();
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
