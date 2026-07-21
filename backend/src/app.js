import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import tenantDb from './middleware/tenantDb.js';

// ── Route Imports ───────────────────────────────────────────────────────────
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import reservationRoutes from './routes/reservationRoutes.js';
import cateringRoutes from './routes/cateringRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import crmRoutes from './routes/crmRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// ── Environment ─────────────────────────────────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://195.35.20.207:3001'
];

const allowedOrigins = (process.env.CORS_ORIGINS || defaultAllowedOrigins.join(','))
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true); // mobile / server-to-server
  const normalized = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(normalized)) return callback(null, true);
  return callback(null, false);
};

// ── Express App ─────────────────────────────────────────────────────────────
const app = express();
app.disable('x-powered-by');

if (process.env.TRUST_PROXY) {
  const tp = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isNaN(tp) ? process.env.TRUST_PROXY : tp);
} else if (isProduction) {
  app.set('trust proxy', 1);
}

// ── Global Middleware ───────────────────────────────────────────────────────
app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-app-secret', 'x-tenant-id']
}));

app.use(cookieParser());
app.use(tenantDb);

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => { req.rawBody = buf; }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── NoSQL Injection Protection ─────────────────────────────────────────────
app.use(mongoSanitize());

// ── App Secret Security Middleware ──────────────────────────────────────────
const APP_SECRET = process.env.APP_SECRET;
if (!APP_SECRET) {
  logger.warn('APP_SECRET is not set. Using default — NOT SAFE FOR PRODUCTION.');
}
const resolvedAppSecret = APP_SECRET || 'DAAS_MOBILE_SECRET_2026';
app.use('/api', (req, res, next) => {
  // Exempt webhooks from secret check (they have their own HMAC)
  if (req.path.includes('webhook')) return next();
  // Exempt health checks
  if (req.path.includes('health')) return next();
  // Exempt static uploads GET requests
  if (req.path.includes('upload') && req.method === 'GET') return next();

  const clientSecret = req.headers['x-app-secret'];
  if (clientSecret !== resolvedAppSecret) {
    return res.status(403).json({ success: false, message: 'Forbidden: Invalid App Secret' });
  }
  next();
});

// ── Health Endpoints ────────────────────────────────────────────────────────
app.get('/api/health/live', (_req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/api/health', (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: dbReady ? 'connected' : 'disconnected',
    version: '2.0.0'
  });
});

// ── DB Guard: reject requests when Mongo is disconnected ────────────────────
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/health')) return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Database not ready.'
    });
  }
  return next();
});

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/delivery-webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/catering', cateringRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/ai', aiRoutes);

// ── Root Info Page ──────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'Restaurant Commerce Platform API',
    version: '2.0.0',
    status: 'running',
    docs: '/api/health'
  });
});

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res, _next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// ── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
