// Cloudflare Pages Function to handle API routes
import { registerRoutes } from '../../server/routes';
import express from 'express';
import cookieParser from 'cookie-parser';
import {
  corsMiddleware,
  helmetMiddleware,
  sanitizeInput,
  securityLogger
} from '../../server/middleware/security';
import {
  enhancedErrorHandler,
  notFoundHandler
} from '../../server/middleware/error-handler';

// Create Express app
const app = express();

// Add security middleware
app.use(corsMiddleware);
app.use(helmetMiddleware);
app.use(securityLogger());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Add input sanitization
app.use(sanitizeInput());

// Register routes
registerRoutes(app);

// Add error handlers
app.use(notFoundHandler());
app.use(enhancedErrorHandler());

// Export handler for Cloudflare Pages Functions
export const onRequest: PagesFunction = async (context) => {
  return new Promise((resolve) => {
    const { request } = context;
    const url = new URL(request.url);
    
    // Convert Cloudflare Request to Express-compatible request
    const req = {
      method: request.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.body,
    } as any;

    const res = {
      status: (code: number) => res,
      json: (data: any) => {
        resolve(new Response(JSON.stringify(data), {
          status: res.statusCode || 200,
          headers: {
            'Content-Type': 'application/json',
            ...res.headers,
          },
        }));
      },
      send: (data: any) => {
        resolve(new Response(data, {
          status: res.statusCode || 200,
          headers: res.headers,
        }));
      },
      headers: {} as Record<string, string>,
      statusCode: 200,
    } as any;

    // Process through Express app
    app(req, res);
  });
};