require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const { initChangeStreams } = require('./config/changeStreams');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const authRoutes = require('./routes/authRoutes');

const PORT = Number(process.env.PORT || 5001);
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
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const validateEnvironment = () => {
  if (!isProduction) return;

  const requiredVariables = ['MONGODB_URI', 'JWT_SECRET', 'CORS_ORIGINS'];
  const missingVariables = requiredVariables.filter((name) => !process.env[name]);

  if (missingVariables.length > 0) {
    throw new Error(`Missing required production environment variables: ${missingVariables.join(', ')}`);
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production.');
  }
};

const corsOrigin = (origin, callback) => {
  // Native mobile clients and server-to-server calls do not send an Origin header.
  if (!origin) return callback(null, true);

  const normalizedOrigin = origin.replace(/\/$/, '');
  if (allowedOrigins.includes(normalizedOrigin)) {
    return callback(null, true);
  }

  // Reject the origin gracefully via (null, false) instead of passing a Node error object
  return callback(null, false);
};

// Initialize express app
const app = express();
app.disable('x-powered-by');

if (process.env.TRUST_PROXY) {
  const trustProxy = Number(process.env.TRUST_PROXY);
  app.set('trust proxy', Number.isNaN(trustProxy) ? process.env.TRUST_PROXY : trustProxy);
} else if (isProduction) {
  app.set('trust proxy', 1);
}

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Save io reference on app
app.set('io', io);

// Socket Authentication Middleware
const APP_SECRET = process.env.APP_SECRET || 'DAAS_MOBILE_SECRET_2026';
io.use((socket, next) => {
  const secret = socket.handshake.auth?.appSecret || socket.handshake.headers['x-app-secret'];
  if (secret === APP_SECRET) {
    return next();
  }
  return next(new Error('Authentication error: Invalid App Secret'));
});

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`\x1b[36m[Socket.io]\x1b[0m New client connected: ${socket.id}`);
  
  socket.on('join_restaurant', (restaurantId) => {
    socket.join(restaurantId.toString());
    console.log(`\x1b[36m[Socket.io]\x1b[0m Client joined restaurant room: ${restaurantId}`);
  });

  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    console.log(`\x1b[36m[Socket.io]\x1b[0m Client joined order room: order_${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`\x1b[36m[Socket.io]\x1b[0m Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'x-app-secret', 'x-tenant-id', 'x-restaurant-id', 'X-Requested-With']
}));

// Cookie Parser
app.use(cookieParser());

// Express json parser capturing raw body buffer (needed for Webhook HMAC Signature checks)
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Multi-Tenant database connection routing middleware
const tenantDb = require('./middleware/tenantDb');
app.use(tenantDb);

// Health endpoints
app.get('/api/health/live', (req, res) => {
  res.json({ status: 'alive', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;

  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: databaseReady ? 'connected' : 'disconnected',
    daasProvider: 'DoorDash Drive API v2 Sandbox'
  });
});

// Do not let database-backed requests wait for Mongoose buffering timeouts.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Database connection is not ready.'
    });
  }
  return next();
});

// Main Service Routes
const fs = require('fs');
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/upload', (req, res) => {
  const { image, name } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, message: 'No image data provided.' });
  }

  try {
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const fileExt = name ? path.extname(name) : '.jpg';
    const fileName = `banner_${Date.now()}${fileExt}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileName}`;
    return res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error('[Upload API] Error saving image:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to upload image.' });
  }
});

app.use('/api/orders', orderRoutes);
app.use('/api/delivery-webhook', webhookRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/auth', authRoutes);

// Root endpoint redirect or info page
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: system-ui, -apple-system, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background-color: #0b0f19; color: #f3f4f6;">
      <div style="padding: 2.5rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 1rem; box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); max-width: 500px; text-align: center;">
        <h2 style="color: #10b981; margin-bottom: 0.5rem; font-weight: 800; font-size: 1.75rem; letter-spacing: -0.025em;">DaaS PoC Express Backend</h2>
        <p style="color: #9ca3af; margin-bottom: 1.5rem; font-size: 0.95rem;">Active Service Layer for testing DoorDash Drive API Sandbox</p>
        <div style="display: flex; flex-direction: column; gap: 0.75rem; text-align: left; font-size: 0.85rem; font-family: monospace; background: #070a13; padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.05);">
          <div><span style="color: #06b6d4;">[POST]</span> /api/orders - Create & trigger DaaS</div>
          <div><span style="color: #06b6d4;">[GET]</span>  /api/orders/:id - Fetch live status</div>
          <div><span style="color: #06b6d4;">[POST]</span> /api/orders/:id/simulate - Advance status</div>
          <div><span style="color: #3b82f6;">[POST]</span> /api/delivery-webhook - DoorDash Webhooks</div>
        </div>
        <p style="color: #4b5563; font-size: 0.75rem; margin-top: 1.5rem;">WebForge DaaS Engine v1.0.0</p>
      </div>
    </div>
  `);
});

// Handle 404 Routes
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

app.use((error, req, res, next) => {
  console.error('[HTTP Error]', error.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

const startServer = async () => {
  validateEnvironment();
  await connectDB();

  // Initialize safe MongoDB Change Streams listener to sync Socket.io events across multiple processes
  initChangeStreams(io);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n\x1b[32m%s\x1b[0m`, `DaaS PoC Server running on port ${PORT}`);
    console.log(`\x1b[36m%s\x1b[0m`, 'Database connected and APIs are ready.');
  });
};

let isShuttingDown = false;
const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Shutdown] Received ${signal}. Closing connections...`);

  const forceExitTimer = setTimeout(() => process.exit(1), 10000);
  forceExitTimer.unref();

  server.close(async () => {
    await mongoose.connection.close();
    console.log('[Shutdown] Complete.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer().catch((error) => {
  console.error(`\x1b[31m%s\x1b[0m`, `Startup failed: ${error.message}`);
  process.exit(1);
});
