import mongoose from 'mongoose';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db.js';
import { autoSeedIfEmpty } from './utils/autoSeed.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import dailyFinanceRoutes from './routes/dailyFinanceRoutes.js';
import weeklyFinanceRoutes from './routes/weeklyFinanceRoutes.js';
import chittiRoutes from './routes/chittiRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

// Allowed origins parser (supports comma-separated origins)
const parseAllowedOrigins = (): string[] => {
  const envOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);

  return [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    ...envOrigins,
  ];
};

const allowedOrigins = parseAllowedOrigins();

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, Postman, server-to-server, curl)
    if (!origin) {
      return callback(null, true);
    }

    // Allow configured origins or any Vercel deployment preview / production domain
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }

    // Permissive fallback so production Vercel frontend is never blocked
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiter for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', apiLimiter);

// Database connection verification middleware
app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState < 1) {
      await connectDB();
      await autoSeedIfEmpty();
    }
    next();
  } catch (err) {
    console.error('Database connection middleware error:', err);
    next(err);
  }
});

// Root & Health check endpoints for Render/Vercel uptime monitoring
const healthResponse = (req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Smart Finance Management System API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development',
  });
};

app.get('/', healthResponse);
app.get('/health', healthResponse);
app.get('/api/health', healthResponse);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/daily-finance', dailyFinanceRoutes);
app.use('/api/weekly-finance', weeklyFinanceRoutes);
app.use('/api/chitti', chittiRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// Connect to DB, check auto-seed, and start local server if not in Vercel serverless environment
if (!process.env.VERCEL) {
  connectDB()
    .then(async () => {
      await autoSeedIfEmpty();
      app.listen(PORT, () => {
        console.log(`🚀 Smart Finance Server running on port ${PORT} [Mode: ${process.env.NODE_ENV || 'development'}]`);
      });
    })
    .catch((err) => {
      console.error('Failed to start server:', err);
    });
}

export default app;
