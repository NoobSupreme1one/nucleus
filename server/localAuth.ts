import type { Express, RequestHandler } from 'express';
import { storage } from './storage';
import { insertUserSchema } from '@shared/validation';

// Simple in-memory session store for development
const sessions = new Map<string, any>();

// Middleware to check if user is authenticated
export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
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
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // For development, accept any email/password
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
      }

      // Create or get user
      const userId = `dev-user-${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      const user = await storage.getUser(userId);
      
      if (!user) {
        // Create new user
        const newUser = await storage.upsertUser({
          id: userId,
          email: email,
          firstName: 'Dev',
          lastName: 'User',
          profileImageUrl: 'https://via.placeholder.com/150',
        });
        
        // Create session
        const token = `dev-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessions.set(token, { user: newUser });
        
        res.json({ 
          user: newUser, 
          token,
          message: 'Logged in successfully (development mode)' 
        });
      } else {
        // Create session for existing user
        const token = `dev-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        sessions.set(token, { user });
        
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
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        sessions.delete(token);
      }
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
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
      
      const updatedUser = await storage.upsertUser({
        id: userId,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        profileImageUrl: req.user.profileImageUrl,
        role,
        location,
        bio,
      });
      
      // Update session
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const session = sessions.get(token);
        if (session) {
          session.user = updatedUser;
          sessions.set(token, session);
        }
      }
      
      res.json(updatedUser);
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
      
      const newUser = await storage.upsertUser({
        id: userId,
        email: email,
        firstName: firstName || 'Dev',
        lastName: lastName || 'User',
        profileImageUrl: 'https://via.placeholder.com/150',
      });
      
      // Create session
      const token = `dev-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessions.set(token, { user: newUser });
      
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