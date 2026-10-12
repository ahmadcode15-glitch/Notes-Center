import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import apiRoutes from './routes';
import { checkMaintenance } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins (reflect origin) so Vercel, localhost, and custom domains work seamlessly
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'],
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    platform: 'Notes Center API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Maintenance check middleware
app.use(checkMaintenance);

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Mount main API routes (both /api and root for maximum proxy compatibility)
app.use('/api', apiRoutes);
app.use(apiRoutes);

// Fallback 404 for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

import bcrypt from 'bcryptjs';
import { prisma } from './db/prisma';

// Start server in non-serverless environments
if (!process.env.VERCEL) {
  const server = app.listen(config.port, async () => {
    console.log(`=========================================`);
    console.log(`🚀 Notes Center API Server is running!`);
    console.log(`📡 URL: http://localhost:${config.port}`);
    console.log(`⚙️  Environment: ${config.nodeEnv}`);
    console.log(`=========================================`);

    try {
      // 1. Ensure user 'laiba' has ADMIN role
      const laibaUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: 'laiba' },
            { username: 'Laiba' },
            { fullName: 'laiba' },
            { fullName: 'Laiba' },
          ],
        },
      });

      if (laibaUser && laibaUser.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: laibaUser.id },
          data: { role: 'ADMIN', status: 'ACTIVE' },
        });
        console.log(`✅ User '${laibaUser.username}' upgraded to ADMIN.`);
      }

      // 2. Ensure student user exists with username 'student'
      const studentUser = await prisma.user.findUnique({
        where: { username: 'student' },
      });
      if (!studentUser) {
        const studentPass = await bcrypt.hash('Student123!', 10);
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 180);
        await prisma.user.create({
          data: {
            username: 'student',
            fullName: 'Student User',
            passwordHash: studentPass,
            role: 'USER',
            status: 'ACTIVE',
            maxDevices: 2,
            accessExpiry: expiry,
          },
        });
        console.log('✅ Student user @student created with password Student123!');
      }
    } catch (err) {
      console.error('Startup user check error:', err);
    }
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated.');
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated.');
    });
  });
}

export default app;

