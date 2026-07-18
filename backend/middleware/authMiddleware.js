const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in cookies first (HttpOnly secure token storage)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to authorization headers (for backward compatibility and api client calls)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'DEV_MARKETPLACE_JWT_SECRET');

    // Dynamically align tenant DB connection context based on the signed JWT token payload
    const tenantId = decoded.tenantId || 'marketplace';
    const mongoose = require('mongoose');
    if (tenantId === 'marketplace') {
      req.tenantDb = mongoose.connection;
    } else {
      const dbName = `daas_poc_${tenantId.replace(/[^a-zA-Z0-9_]/g, '_')}`;
      req.tenantDb = mongoose.connection.useDb(dbName, { useCache: true });
    }

    // Fetch user from tenant database and attach to request context (excluding password hash)
    req.user = await req.getModel('User').findById(decoded.id).select('-password -salt');
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    return next();
  } catch (error) {
    console.error('[Auth Middleware] JWT Verification Error:', error.message);
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

module.exports = { protect };
