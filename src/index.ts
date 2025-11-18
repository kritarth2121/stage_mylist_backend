import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { initRedis, closeRedis } from './services/cache';
import myListRoutes from './routes/mylist';
import { generateMockToken } from './utils/auth';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ott-mylist';

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test token generation endpoint for development
app.get('/auth/test-token', (req, res) => {
  const token = generateMockToken();
  res.status(200).json({
    success: true,
    token,
    message: 'Mock JWT token generated for testing. Use in Authorization header as: Bearer <token>',
  });
});

// API routes
app.use('/api/mylist', myListRoutes);

async function startServer() {
  try {
    await connectDatabase(MONGODB_URI);
    await initRedis();
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Redis caching enabled`);
      console.log(`Test token endpoint available at http://localhost:${PORT}/auth/test-token`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await closeRedis();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
