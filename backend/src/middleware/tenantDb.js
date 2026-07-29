import { bindTenantContext, getAllowedTenantIds, normalizeTenantId } from '../utils/tenant.js';

/**
 * Resolve the request tenant and bind req.getModel(modelName).
 *
 * Security rules:
 * 1. If FORCE_TENANT_ID is set (single-restaurant deployment), ALWAYS use it.
 *    The x-tenant-id header from the client is completely ignored.
 * 2. Otherwise, validate the header value against the allowed tenant whitelist
 *    before using it. An unknown tenant ID is rejected.
 *
 * Note: For all AUTHENTICATED routes, auth.js (protect middleware) re-binds the
 * tenant from the signed JWT payload, overriding whatever this middleware set.
 * So this middleware only affects public (unauthenticated) routes.
 */
export default async (req, res, next) => {
  try {
    if (req.tenantDb && req.getModel) return next();

    // M2 + H4 FIX: FORCE_TENANT_ID takes absolute precedence — client header is ignored.
    const forcedTenant = process.env.FORCE_TENANT_ID || process.env.DEPLOYMENT_TENANT_ID;
    if (forcedTenant) {
      bindTenantContext(req, forcedTenant);
      return next();
    }

    // Validate the client-supplied x-tenant-id against the allowed whitelist.
    const headerTenantId = req.headers['x-tenant-id'];
    if (headerTenantId) {
      const normalized = normalizeTenantId(headerTenantId);
      const allowed = getAllowedTenantIds();
      if (!allowed.has(normalized)) {
        // Unknown tenant — silently fall back to marketplace instead of erroring,
        // to avoid leaking information about configured tenants.
        bindTenantContext(req, 'marketplace');
        return next();
      }
      bindTenantContext(req, normalized);
      return next();
    }

    // No header — default to marketplace
    bindTenantContext(req, 'marketplace');
    return next();
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Invalid tenant'
    });
  }
};
