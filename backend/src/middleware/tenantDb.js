import { bindTenantContext } from '../utils/tenant.js';

/**
 * Resolve the request tenant and bind req.getModel(modelName).
 *
 * Important: this middleware never seeds, resets, or copies tenant data during
 * a live request. Tenant provisioning must happen through an explicit admin
 * script/migration so a public header cannot mutate customer databases.
 */
export default async (req, res, next) => {
  try {
    if (req.tenantDb && req.getModel) return next();

    bindTenantContext(req, req.headers['x-tenant-id'] || 'marketplace');
    return next();
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Invalid tenant'
    });
  }
};
