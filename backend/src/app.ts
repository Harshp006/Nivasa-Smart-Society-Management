import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import config from './config/env';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import apartmentsRoutes from './modules/apartments/apartments.routes';
import residentsRoutes from './modules/residents/residents.routes';
import familyRoutes from './modules/family/family.routes';
import vehiclesRoutes from './modules/vehicles/vehicles.routes';
import visitorsRoutes from './modules/visitors/visitors.routes';
import gateRoutes from './modules/gate/gate.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import complaintsRoutes from './modules/complaints/complaints.routes';
import amenitiesRoutes from './modules/amenities/amenities.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import announcementsRoutes from './modules/announcements/announcements.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import reportsRoutes from './modules/reports/reports.routes';

const app = express();

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  message: { success: false, message: 'Too many requests, please try again later' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.LOGIN_RATE_LIMIT_MAX,
  message: { success: false, message: 'Too many login attempts, please try again later' },
});

app.use('/api/', limiter as any);
app.use('/api/v1/auth/login', loginLimiter as any);

// ============================================================
// General Middleware
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(config.COOKIE_SECRET) as any);

// Logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim()),
  },
}));

// ============================================================
// Swagger / OpenAPI
// ============================================================
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nivasa Smart Society Management API',
      version: '1.0.0',
      description: 'REST API documentation for Nivasa Smart Society Management System',
    },
    servers: [{ url: `http://localhost:${config.PORT}`, description: 'Development server' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve as any, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Nivasa API Docs',
}) as any);
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

// ============================================================
// Health Check
// ============================================================
app.get('/api/health', async (req, res) => {
  try {
    const prisma = (await import('./config/prisma')).default;
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// ============================================================
// API Routes
// ============================================================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/apartments', apartmentsRoutes);
app.use('/api/v1/residents', residentsRoutes);
app.use('/api/v1/family-members', familyRoutes);
app.use('/api/v1/vehicles', vehiclesRoutes);
app.use('/api/v1/visitors', visitorsRoutes);
app.use('/api/v1/gate', gateRoutes);
app.use('/api/v1/maintenance', maintenanceRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/complaints', complaintsRoutes);
app.use('/api/v1/amenities', amenitiesRoutes);
app.use('/api/v1/bookings', bookingsRoutes);
app.use('/api/v1/announcements', announcementsRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/reports', reportsRoutes);

// ============================================================
// Error Handling
// ============================================================
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
