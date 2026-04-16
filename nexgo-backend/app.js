require('dotenv').config();

const express        = require('express');
const cors           = require('cors');
const helmet         = require('helmet');
const morgan         = require('morgan');
const rateLimit      = require('express-rate-limit');

// Routes
const authRoutes      = require('./src/routes/auth.routes');
const usersRoutes     = require('./src/routes/users.routes');
const shipmentsRoutes = require('./src/routes/shipments.routes');
const cotizarRoutes   = require('./src/routes/cotizar.routes');
const trackingRoutes  = require('./src/routes/tracking.routes');
const pricingRoutes   = require('./src/routes/pricing.routes');
const reportsRoutes   = require('./src/routes/reports.routes');

// Middleware
const { errorHandler, notFound } = require('./src/middleware/error.middleware');
const logger = require('./src/utils/logger');

const app = express();

// ============================================================
// SEGURIDAD
// ============================================================
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
}));

// CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.endsWith('.up.railway.app') || origin === 'http://localhost:4200' || origin === 'https://nexgo.vercel.app') {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  message: { success: false, message: 'Demasiadas solicitudes, intenta más tarde' },
});
app.use('/api/', limiter);

// Rate limit especial para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Demasiados intentos de login, intenta en 15 minutos' },
});
app.use('/api/auth/login', loginLimiter);

// ============================================================
// PARSERS Y LOGGING
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Nexgo API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth',      authRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/shipments', shipmentsRoutes);
app.use('/api/cotizar',   cotizarRoutes);
app.use('/api/tracking',  trackingRoutes);
app.use('/api/pricing',   pricingRoutes);
app.use('/api/reports',   reportsRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================
app.use(notFound);
app.use(errorHandler);

module.exports = app;
