import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeSentry, sentryRequestHandler, sentryErrorHandler, isSentryConfigured } from "./services/sentry";
import {
  corsMiddleware,
  helmetMiddleware,
  sanitizeInput,
  securityLogger
} from "./middleware/security";
import {
  enhancedErrorHandler,
  notFoundHandler,
  setupGracefulShutdown,
  setupUnhandledErrorHandlers
} from "./middleware/error-handler";

// Initialize Sentry as early as possible
const sentryEnabled = initializeSentry();

// Setup unhandled error handlers
setupUnhandledErrorHandlers();

const app = express();

// Add Sentry request handler first (before other middleware)
if (sentryEnabled) {
  app.use(sentryRequestHandler());
}

// Add security middleware
app.use(corsMiddleware);
app.use(helmetMiddleware);
app.use(securityLogger());

app.use(express.json({ limit: '10mb' })); // Add size limit
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Add input sanitization (after body parsing)
app.use(sanitizeInput());

// Serve local uploads in development or when using local storage fallback
import path from 'path';
import fs from 'fs';
const uploadsDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
}
app.use('/uploads', express.static(uploadsDir));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Add Sentry error handler before custom error handler
  if (sentryEnabled) {
    app.use(sentryErrorHandler());
  }

  // Add 404 handler for unmatched routes (after Vite setup)
  app.use(notFoundHandler());

  // Use enhanced error handler
  app.use(enhancedErrorHandler());

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Setup graceful shutdown
  setupGracefulShutdown(server);
})();
