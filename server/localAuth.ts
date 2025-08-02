import type { Express, RequestHandler } from 'express';
import { insertUserSchema } from '@shared/validation';
import type { User } from '@shared/types';
import { localStorage } from './localStorage';
import { accountLockoutProtection, trackLoginAttempt } from './middleware/security';

// Simple in-memory session store for development
const sessions = new Map<string, any>();

// Simple in-memory user store for development
const users = new Map<string, User>();

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    // Try to get token from Authorization header first, then from cookies
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const session = sessions.get(token);
    
    if (!session) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = session.user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Setup authentication routes
export async function setupAuth(app: Express) {
  // Login endpoint - creates a mock user for development
  app.post('/api/auth/login', (req, res, next) => {
    // Apply auth rate limiting in development too for testing
    const authRateLimit = require('./services/rate-limit').rateLimiters.auth;
    if (process.env.ENABLE_RATE_LIMITING === 'true') {
      return authRateLimit(req, res, next);
    }
    next();
  }, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // For development, accept any email/password
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      // Create or get user
      const userId = `dev-user-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      let user = users.get(userId);
      
      if (!user) {
        // Create new user
        user = {
          id: userId,
          email: email,
          firstName: 'Dev',
          lastName: 'User',
          profileImageUrl: 'https://via.placeholder.com/150',
          role: null,
          location: 'Local',
          bio: 'Development user',
          subscriptionTier: 'free',
          totalIdeaScore: 0,
          profileViews: 0,
          profilePublic: true,
          ideasPublic: true,
          allowFounderMatching: true,
          allowDirectContact: true,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          subscriptionStatus: null,
          subscriptionPeriodEnd: null,
          subscriptionCancelAtPeriodEnd: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        users.set(userId, user);
        
        // Also store in localStorage for leaderboard integration
        const { id, createdAt, updatedAt, ...userWithoutId } = user;
        await localStorage.upsertUser(userWithoutId);
        
        // Create session
        const token = `dev-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessions.set(token, { user });

        // Set cookie with token
        res.cookie('access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.json({
          user,
          token,
          message: 'Logged in successfully (development mode)'
        });
      } else {
        // Ensure existing user is also in localStorage
        const { id, createdAt, updatedAt, ...userWithoutId } = user;
        await localStorage.upsertUser(userWithoutId);
        
        // Create session for existing user
        const token = `dev-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessions.set(token, { user });

        // Set cookie with token
        res.cookie('access_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.json({
          user,
          token,
          message: 'Logged in successfully (development mode)'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', async (req, res) => {
    try {
      // Get token from header or cookie
      let token: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
      }

      if (token) {
        sessions.delete(token);
      }

      // Clear the cookie
      res.clearCookie('access_token');

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // In development mode, just return the user from the session
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile endpoint
  app.put('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { role, location, bio } = req.body;

      // Update user in memory
      const user = users.get(userId);
      if (user) {
        user.bio = bio || user.bio;
        user.location = location || user.location;
        user.updatedAt = new Date();
        users.set(userId, user);

        // Update session
        const authHeader = req.headers.authorization;
        let token: string | undefined;

        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        } else if (req.cookies && req.cookies.access_token) {
          token = req.cookies.access_token;
        }

        if (token) {
          const session = sessions.get(token);
          if (session) {
            session.user = user;
            sessions.set(token, session);
          }
        }

        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Register endpoint for development
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email required' });
      }

      const userId = `dev-user-${email.replace(/[^a-zA-Z0-9]/g, '')}`;

      const newUser: User = {
        id: userId,
        email: email,
        firstName: firstName || 'Dev',
        lastName: lastName || 'User',
        profileImageUrl: 'https://via.placeholder.com/150',
        role: null,
        location: 'Local',
        bio: 'Development user',
        subscriptionTier: 'free',
        totalIdeaScore: 0,
        profileViews: 0,
        profilePublic: true,
        ideasPublic: true,
        allowFounderMatching: true,
        allowDirectContact: true,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionPeriodEnd: null,
        subscriptionCancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      users.set(userId, newUser);
      
      // Also store in localStorage for leaderboard integration
      const { id, createdAt, updatedAt, ...newUserWithoutId } = newUser;
      await localStorage.upsertUser(newUserWithoutId);

      // Create session
      const token = `dev-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessions.set(token, { user: newUser });

      // Set cookie with token
      res.cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      res.json({
        user: newUser,
        token,
        message: 'Registered successfully (development mode)'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });
} 