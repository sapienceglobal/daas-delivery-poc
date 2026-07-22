import mongoose from 'mongoose';

const DEFAULT_TENANT_IDS = ['marketplace', 'lassi-lounge'];
const TENANT_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,62}$/i;

export const normalizeTenantId = (tenantId) => (
  String(tenantId || 'marketplace').trim().toLowerCase()
);

export const getAllowedTenantIds = () => {
  const configured = (process.env.TENANT_IDS || process.env.ALLOWED_TENANT_IDS || '')
    .split(',')
    .map((tenantId) => normalizeTenantId(tenantId))
    .filter(Boolean);

  const tenants = configured.length > 0 ? configured : DEFAULT_TENANT_IDS;
  return new Set(['marketplace', ...tenants]);
};

export const resolveTenantId = (tenantId) => {
  const resolved = normalizeTenantId(tenantId);
  const allowedTenantIds = getAllowedTenantIds();

  if (!TENANT_ID_PATTERN.test(resolved) || !allowedTenantIds.has(resolved)) {
    const error = new Error('Invalid tenant');
    error.statusCode = 400;
    throw error;
  }

  return resolved;
};

export const getTenantConnection = (tenantId) => {
  const resolved = resolveTenantId(tenantId);
  if (resolved === 'marketplace') return mongoose.connection;

  const dbName = `daas_poc_${resolved.replace(/[^a-zA-Z0-9_]/g, '_')}`;
  return mongoose.connection.useDb(dbName, { useCache: true });
};

export const getTenantModel = (tenantId, modelName) => {
  const connection = getTenantConnection(tenantId);
  if (connection === mongoose.connection) return mongoose.model(modelName);

  if (!connection.models[modelName]) {
    const defaultModel = mongoose.model(modelName);
    connection.model(modelName, defaultModel.schema);
  }

  return connection.model(modelName);
};

export const bindTenantContext = (req, tenantId) => {
  const resolved = resolveTenantId(tenantId);
  req.tenantId = resolved;
  req.tenantDb = getTenantConnection(resolved);

  req.getModel = (modelName) => {
    if (req.tenantDb === mongoose.connection) return mongoose.model(modelName);
    return getTenantModel(resolved, modelName);
  };

  return req;
};
