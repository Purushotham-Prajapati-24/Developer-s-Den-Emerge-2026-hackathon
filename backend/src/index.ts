import * as dotenv from 'dotenv';
dotenv.config();

import path from 'path';

import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { initSocketService } from './services/socket.service';
import profileRoutes from './routes/profile.routes';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import executionRoutes from './routes/execution.routes';
import aiRoutes from './routes/ai.routes';
import notificationRoutes from './routes/notification.routes';

const validateEnv = () => {
  const required = ['MONGO_URI', 'JWT_SECRET', 'GROQ_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ CRITICAL: Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

validateEnv();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOWED_ORIGINS = [FRONTEND_URL, 'http://localhost:5174', 'http://localhost:5175'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// MongoDB connection
if (process.env.MONGO_URI && process.env.MONGO_URI.includes('mongodb')) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Database'))
    .catch((err) => console.error('MongoDB connection error:', err));
} else {
  console.warn('⚠️ MONGO_URI not set. Skipping database connection.');
}

// Routes

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/execute', executionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'Developer\'s Den Backend Engine' });
});

// Serve backend static files (usually for shared assets or the internal public folder)
const publicPath = path.resolve(process.cwd(), 'public');
app.use(express.static(publicPath));

// Specific 404 handler for API routes
app.use('/api', (req, res) => {
  res.status(404).json({ 
    message: `API Route not found: ${req.method} ${req.originalUrl}`,
    suggestion: 'Ensure you have restarted the backend server if you recently added this route.'
  });
});

// Catch-all route to serve index.html for SPA frontend routing
// (In production, this would be the frontend's built index.html)
app.use((req, res) => {
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).json({ 
        error: 'Not Found',
        message: `The requested resource was not found, and no default index.html was available at ${indexPath}`
      });
    }
  });
});

// Initialize WebSocket (Yjs CRDT collaborative sync)
initSocketService({ server, corsOrigin: ALLOWED_ORIGINS });

server.listen(PORT, () => {
  console.log(`🚀 Developer's Den Backend Server live on port ${PORT}`);
});
