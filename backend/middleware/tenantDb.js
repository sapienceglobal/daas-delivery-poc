const mongoose = require('mongoose');

/**
 * Multi-Tenancy database connection switching middleware.
 * Reads 'x-tenant-id' header and dynamically binds connection context to req.tenantDb.
 * Provides req.getModel(modelName) helper to resolve models on the active connection.
 */
module.exports = (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || 'marketplace';

  if (tenantId === 'marketplace') {
    req.tenantDb = mongoose.connection;
  } else {
    // Sanitize tenant ID to create a safe database name (e.g. daas_poc_lassi_lounge)
    const dbName = `daas_poc_${tenantId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
    req.tenantDb = mongoose.connection.useDb(dbName, { useCache: true });
  }

  // Bind helper function to get model under this connection context
  req.getModel = (modelName) => {
    // If it's marketplace (default main pool), return default mongoose model
    if (req.tenantDb === mongoose.connection) {
      return mongoose.model(modelName);
    }

    // For other tenants, check if the model is already compiled on their connection
    if (!req.tenantDb.models[modelName]) {
      // Find the schema from the default connection's model
      const defaultModel = mongoose.model(modelName);
      req.tenantDb.model(modelName, defaultModel.schema);
    }

    return req.tenantDb.model(modelName);
  };

  next();
};
