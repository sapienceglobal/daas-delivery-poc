import 'dotenv/config';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import seedDemoData from './src/config/seed.js';
import { initChangeStreams } from './src/config/changeStreams.js';
import { startDoorDashPolling } from './src/services/doordashSyncService.js';
import logger from './src/utils/logger.js';

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

const APP_SECRET = process.env.APP_SECRET || 'DAAS_MOBILE_SECRET_2026';
io.use((socket, next) => {
  const secret = socket.handshake.auth?.appSecret || socket.handshake.headers['x-app-secret'];
  if (secret === APP_SECRET) return next();
  return next(new Error('Authentication error: Invalid App Secret'));
});

io.on('connection', (socket) => {
  logger.debug(`Socket connected: ${socket.id}`);

  socket.on('join_restaurant', (restaurantId) => {
    socket.join(restaurantId.toString());
    logger.debug(`Socket ${socket.id} joined restaurant room: ${restaurantId}`);
  });

  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    logger.debug(`Socket ${socket.id} joined order room: ${orderId}`);
  });

  socket.on('join_driver', (driverId) => {
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
