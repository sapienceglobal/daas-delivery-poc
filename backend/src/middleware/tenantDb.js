import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Multi-Tenancy database connection switching middleware.
 * Reads 'x-tenant-id' header and dynamically binds connection context to req.tenantDb.
 * Provides req.getModel(modelName) helper to resolve models on the active connection.
 */
export default async (req, res, next) => {
  try {
    // If the auth middleware already derived tenantDb from the JWT token, trust it
    // and skip header-based tenant selection to prevent spoofing.
    if (req.tenantDb) {
      // tenantDb was already set by a prior middleware (e.g. auth.js from JWT).
      // Just ensure req.getModel exists and move on.
      if (!req.getModel) {
        req.getModel = (modelName) => {
          if (req.tenantDb === mongoose.connection) {
            return mongoose.model(modelName);
          }
          if (!req.tenantDb.models[modelName]) {
            const defaultModel = mongoose.model(modelName);
            req.tenantDb.model(modelName, defaultModel.schema);
          }
          return req.tenantDb.model(modelName);
        };
      }
      return next();
    }

    const tenantId = req.headers['x-tenant-id'] || 'marketplace';

    if (tenantId === 'marketplace') {
      req.tenantDb = mongoose.connection;
    } else {
      // Sanitize tenant ID to create a safe database name (e.g. daas_poc_lassi_lounge)
      const dbName = `daas_poc_${tenantId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      req.tenantDb = mongoose.connection.useDb(dbName, { useCache: true });

      // Compile Restaurant schema and check if tenant DB has restaurant data
      const defaultRestModel = mongoose.model('Restaurant');
      const tenantRestaurantModel = req.tenantDb.models['Restaurant'] || req.tenantDb.model('Restaurant', defaultRestModel.schema);

      const count = await tenantRestaurantModel.countDocuments();
      if (count === 0) {
        // Automatically populate tenant database from main marketplace database for Lassi Lounge
        const lassiLounge = await defaultRestModel.findOne({ name: { $regex: /^lassi lounge$/i } }).lean();
        if (lassiLounge) {
          // Copy restaurant
          try {
            await tenantRestaurantModel.create(lassiLounge);
          } catch (err) {
            logger.warn('Tenant restaurant copy warning (possibly duplicate):', { error: err.message });
          }

          // Copy Categories
          try {
            const defaultCatModel = mongoose.model('Category');
            const tenantCatModel = req.tenantDb.models['Category'] || req.tenantDb.model('Category', defaultCatModel.schema);
            const categories = await defaultCatModel.find({ restaurantId: lassiLounge._id }).lean();
            if (categories.length > 0) {
              await tenantCatModel.insertMany(categories, { ordered: false });
            }
          } catch (err) {
            logger.warn('Tenant categories copy warning (possibly duplicate):', { error: err.message });
          }

          // Copy MenuItems
          try {
            const defaultItemModel = mongoose.model('MenuItem');
            const tenantItemModel = req.tenantDb.models['MenuItem'] || req.tenantDb.model('MenuItem', defaultItemModel.schema);
            const items = await defaultItemModel.find({ restaurantId: lassiLounge._id }).lean();
            if (items.length > 0) {
              await tenantItemModel.insertMany(items, { ordered: false });
            }
          } catch (err) {
            logger.warn('Tenant menu items copy warning (possibly duplicate):', { error: err.message });
          }

          // Copy Tables
          try {
            const defaultTableModel = mongoose.model('Table');
            const tenantTableModel = req.tenantDb.models['Table'] || req.tenantDb.model('Table', defaultTableModel.schema);
            const tables = await defaultTableModel.find({ restaurantId: lassiLounge._id }).lean();
            if (tables.length > 0) {
              await tenantTableModel.insertMany(tables, { ordered: false });
            }
          } catch (err) {
            logger.warn('Tenant tables copy warning (possibly duplicate):', { error: err.message });
          }

          // Copy Users (non-admins) so they exist in tenant DB
          try {
            const defaultUserModel = mongoose.model('User');
            const tenantUserModel = req.tenantDb.models['User'] || req.tenantDb.model('User', defaultUserModel.schema);
            const users = await defaultUserModel.find({ role: { $ne: 'admin' } }).lean();
            if (users.length > 0) {
              await tenantUserModel.insertMany(users, { ordered: false });
            }
          } catch (err) {
            logger.warn('Tenant users copy warning (possibly duplicate):', { error: err.message });
          }
        }
      }
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
  } catch (error) {
    next(error);
  }
};
