require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const authRoutes = require('./routes/authRoutes');

// Initialize express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Save io reference on app
app.set('io', io);

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log(`\x1b[36m[Socket.io]\x1b[0m New client connected: ${socket.id}`);
  
  socket.on('join_restaurant', (restaurantId) => {
    socket.join(restaurantId.toString());
    console.log(`\x1b[36m[Socket.io]\x1b[0m Client joined restaurant room: ${restaurantId}`);
  });

  socket.on('disconnect', () => {
    console.log(`\x1b[36m[Socket.io]\x1b[0m Client disconnected: ${socket.id}`);
  });
});

// Set port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Cookie Parser
app.use(cookieParser());

// Express json parser capturing raw body buffer (needed for Webhook HMAC Signature checks)
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Main Service Routes
app.use('/api/orders', orderRoutes);
app.use('/api/delivery-webhook', webhookRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    daasProvider: 'DoorDash Drive API v2 Sandbox'
  });
});

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

// Start Express Server
server.listen(PORT, () => {
  console.log(`\n\x1b[32m%s\x1b[0m`, `🚀 DaaS PoC Server running on http://localhost:${PORT}`);
  console.log(`\x1b[36m%s\x1b[0m`, `🔗 Active APIs ready for local/sandbox testing.`);
  console.log(`\x1b[33m%s\x1b[0m`, `📡 Configure Webhooks at: http://localhost:${PORT}/api/delivery-webhook\n`);
});
