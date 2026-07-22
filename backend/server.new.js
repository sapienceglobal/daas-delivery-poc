import 'dotenv/config';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import seedDemoData from './src/config/seed.js';
import { initChangeStreams } from './src/config/changeStreams.js';
import { startDoorDashPolling } from './src/services/doordashSyncService.js';
import logger from './src/utils/logger.js';
import { getTenantModel, resolveTenantId } from './src/utils/tenant.js';

const PORT = Number(process.env.PORT || 5000);
const isProduction = process.env.NODE_ENV === 'production';

// ── Validate Production Env ─────────────────────────────────────────────────
const validateEnvironment = () => {
  if (!isProduction) return;
  const required = ['MONGODB_URI', 'JWT_SECRET', 'CORS_ORIGINS'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required production env: ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
};

// ── CORS origins for Socket.io ──────────────────────────────────────────────
const defaultAllowedOrigins = [
  'http://localhost:3000', 'http://localhost:3001',
  'http://127.0.0.1:3000', 'http://127.0.0.1:3001',
  'http://195.35.20.207:3001'
];
const allowedOrigins = (process.env.CORS_ORIGINS || defaultAllowedOrigins.join(','))
  .split(',').map(o => o.trim().replace(/\/$/, '')).filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true);
  return callback(null, false);
};

// ── HTTP & Socket.io ────────────────────────────────────────────────────────
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach io to Express app so controllers can emit events
app.set('io', io);

const parseCookies = (cookieHeader = '') => cookieHeader
  .split(';')
  .map((part) => part.trim())
  .filter(Boolean)
  .reduce((cookies, part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) return cookies;
    const key = decodeURIComponent(part.slice(0, separatorIndex));
    const value = decodeURIComponent(part.slice(separatorIndex + 1));
    cookies[key] = value;
    return cookies;
  }, {});

const getSocketToken = (socket) => {
  const cookies = parseCookies(socket.handshake.headers.cookie || '');
  if (cookies.token || cookies.marketplace_token) return cookies.token || cookies.marketplace_token;
  if (socket.handshake.auth?.token) return socket.handshake.auth.token;

  const authHeader = socket.handshake.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
};

const canManageRestaurant = (user, restaurantId) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.role === 'merchant' && user.restaurantId?.toString() === restaurantId?.toString();
};

const APP_SECRET = process.env.APP_SECRET;
io.use(async (socket, next) => {
  const secret = socket.handshake.auth?.appSecret || socket.handshake.headers['x-app-secret'];
  const hasBrowserOrigin = Boolean(socket.handshake.headers.origin);

  if (!hasBrowserOrigin && APP_SECRET && secret !== APP_SECRET) {
    return next(new Error('Authentication error: Invalid App Secret'));
  }

  const token = getSocketToken(socket);
  if (!token) {
    try {
      socket.data.user = null;
      socket.data.tenantId = resolveTenantId(socket.handshake.headers['x-tenant-id'] || 'marketplace');
      return next();
    } catch {
      return next(new Error('Authentication error: Invalid tenant'));
    }
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'DEV_MARKETPLACE_JWT_SECRET');
    const tenantId = resolveTenantId(decoded.tenantId || 'marketplace');
    const User = getTenantModel(tenantId, 'User');
    const user = await User.findById(decoded.id).select('_id role restaurantId isActive').lean();

    if (!user || user.isActive === false) {
      return next(new Error('Authentication error: Invalid user'));
    }

    socket.data.user = user;
    socket.data.tenantId = tenantId;
    return next();
  } catch {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);

  socket.on('join_restaurant', (restaurantId) => {
    if (!canManageRestaurant(socket.data.user, restaurantId)) {
      socket.emit('room_error', { room: 'restaurant', message: 'Not authorized for this restaurant room' });
      return;
    }

    socket.join(restaurantId.toString());
    logger.debug(`Socket ${socket.id} joined restaurant room: ${restaurantId}`);
  });

  socket.on('join_order', async (orderId) => {
    try {
      const user = socket.data.user;
      if (!user || !mongoose.Types.ObjectId.isValid(orderId)) {
        socket.emit('room_error', { room: 'order', message: 'Not authorized for this order room' });
        return;
      }

      const Order = getTenantModel(socket.data.tenantId || 'marketplace', 'Order');
      const order = await Order.findById(orderId).select('userId restaurantId').lean();
      const canJoin =
        order &&
        (
          user.role === 'admin' ||
          (user.role === 'customer' && order.userId?.toString() === user._id.toString()) ||
          canManageRestaurant(user, order.restaurantId)
        );

      if (!canJoin) {
        socket.emit('room_error', { room: 'order', message: 'Not authorized for this order room' });
        return;
      }

      socket.join(`order_${orderId}`);
      logger.debug(`Socket ${socket.id} joined order room: ${orderId}`);
    } catch (error) {
      logger.warn('Socket join_order authorization failed', { error: error.message });
      socket.emit('room_error', { room: 'order', message: 'Unable to join order room' });
    }
  });

  socket.on('join_driver', (driverId) => {
    const user = socket.data.user;
    if (!user || (user.role !== 'driver' && user.role !== 'admin') || (user.role === 'driver' && user._id.toString() !== driverId.toString())) {
      socket.emit('room_error', { room: 'driver', message: 'Not authorized for this driver room' });
      return;
    }

    socket.join(`driver_${driverId}`);
    logger.debug(`Socket ${socket.id} joined driver room: ${driverId}`);
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

// ── Start Server ────────────────────────────────────────────────────────────
const startServer = async () => {
  validateEnvironment();
  await connectDB();
  await seedDemoData();
  initChangeStreams(io);
  startDoorDashPolling(io);

  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Restaurant Commerce Platform running on port ${PORT}`);
    logger.info('Database connected — APIs ready');
  });
};

// ── Graceful Shutdown ───────────────────────────────────────────────────────
let isShuttingDown = false;
const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Received ${signal}. Shutting down...`);

  const forceTimer = setTimeout(() => process.exit(1), 10000);
  forceTimer.unref();

  server.close(async () => {
    await mongoose.connection.close();
    logger.info('Shutdown complete');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer().catch((error) => {
  logger.error(`Startup failed: ${error.message}`);
  process.exit(1);
});
