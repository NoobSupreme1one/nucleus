import serverlessExpress from '@vendia/serverless-express';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { registerRoutes } from './routes';
import { setupAuth } from './auth/auth-factory';
import helmet from 'helmet';
import path from 'path';

// Create Express app
const app = express();

// Configure trust proxy for Lambda API Gateway
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration for AWS
app.use(cors({
  origin: [
    'http://localhost:5000',
    'http://localhost:3000',
    'https://*.amazonaws.com',
    'https://*.cloudfront.net'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from dist/public with correct MIME types
app.use(express.static(path.join(process.cwd(), 'dist/public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// API routes will be registered later via registerRoutes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Initialize the handler after routes are registered
let handlerInstance: any = null;

const initializeHandler = async () => {
  if (handlerInstance) return handlerInstance;
  
  try {
    await registerRoutes(app);
    console.log('Routes registered successfully');
    
    // Error handling middleware
    app.use((error: any, req: any, res: any, next: any) => {
      console.error('Lambda error:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });

    // Catch-all handler - serve React app for SPA routing
    app.get('*', (req, res) => {
      // Don't serve index.html for API routes or asset files
      if (req.path.startsWith('/api') || req.path.startsWith('/assets')) {
        return res.status(404).json({ message: 'Route not found' });
      }
      
      // Serve React app for all other routes
      res.sendFile(path.join(process.cwd(), 'dist/public/index.html'));
    });

    handlerInstance = serverlessExpress({ app });
    return handlerInstance;
  } catch (error) {
    console.error('Failed to register routes:', error);
    throw error;
  }
};

// Lambda handler that initializes on first call
export const handler = async (event: any, context: any) => {
  const handlerFn = await initializeHandler();
  return handlerFn(event, context);
};

// Export app for local testing
export { app };