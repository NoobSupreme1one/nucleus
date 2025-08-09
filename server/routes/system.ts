import { Router } from "express";
import { CloudStorageService } from '../services/s3-storage';
import { getStorage } from "./shared";

export const systemRouter = Router();

// Leaderboard route
systemRouter.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const storage = await getStorage();
    const leaderboard = await storage.getLeaderboard(limit);
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
});

// API root endpoint - endpoint discovery
systemRouter.get('/', async (req, res) => {
  res.json({
    name: 'Nucleus API',
    version: '1.0.0',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        logout: 'POST /api/auth/logout',
        user: 'GET /api/auth/user',
        updateUser: 'PUT /api/auth/user'
      },
      ideas: {
        validate: 'POST /api/ideas/validate',
        list: 'GET /api/ideas',
        detail: 'GET /api/ideas/:id',
        generateReport: 'POST /api/ideas/:id/generate-pro-report'
      },
      submissions: {
        create: 'POST /api/submissions',
        list: 'GET /api/submissions',
        update: 'PUT /api/submissions/:id'
      },
      matching: {
        potential: 'GET /api/matches/potential',
        create: 'POST /api/matches',
        list: 'GET /api/matches',
        mutual: 'GET /api/matches/mutual'
      },
      subscription: {
        status: 'GET /api/subscription/status',
        checkout: 'POST /api/subscription/create-checkout-session',
        portal: 'POST /api/subscription/create-portal-session'
      },
      users: {
        privacy: 'GET /api/users/privacy-settings',
        updatePrivacy: 'PUT /api/users/privacy-settings'
      },
      leaderboard: 'GET /api/leaderboard'
    }
  });
});

// Health check endpoint
systemRouter.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      cloudStorage: CloudStorageService.isConfigured() ? 'configured' : 'local_fallback',
      auth: process.env.NODE_ENV === 'production' ? 'cognito' : 'local',
    }
  };
  
  res.json(health);
});