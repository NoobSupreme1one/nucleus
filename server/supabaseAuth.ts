import { createClient } from '@supabase/supabase-js';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get or create user in our database
    const dbUser = await storage.getUser(user.id);
    if (!dbUser) {
      // Create user if they don't exist
      await storage.upsertUser({
        id: user.id,
        email: user.email || undefined,
        firstName: user.user_metadata?.first_name || undefined,
        lastName: user.user_metadata?.last_name || undefined,
        profileImageUrl: user.user_metadata?.avatar_url || undefined,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Setup authentication routes
export async function setupAuth(app: Express) {
  // Login endpoint - redirects to Supabase Auth
  app.get('/api/auth/login', (req, res) => {
    const redirectUrl = `${process.env.SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(process.env.FRONTEND_URL || 'http://localhost:5000')}/auth/callback`;
    res.redirect(redirectUrl);
  });

  // Auth callback endpoint
  app.get('/api/auth/callback', async (req, res) => {
    try {
      const { access_token, refresh_token } = req.query;
      
      if (!access_token) {
        return res.status(400).json({ message: 'No access token provided' });
      }

      // Set cookies with tokens
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      if (refresh_token) {
        res.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.redirect('/');
    } catch (error) {
      console.error('Auth callback error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // Logout endpoint
  app.get('/api/auth/logout', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await supabase.auth.admin.signOut(token);
      }

      // Clear cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      
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
        firstName: req.user.user_metadata?.first_name,
        lastName: req.user.user_metadata?.last_name,
        profileImageUrl: req.user.user_metadata?.avatar_url,
        role,
        location,
        bio,
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
} 