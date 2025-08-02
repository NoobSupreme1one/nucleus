import { createClient } from '@supabase/supabase-js';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';
import { accountLockoutProtection, trackLoginAttempt } from './middleware/security';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
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
        email: user.email || null,
        firstName: user.user_metadata?.first_name || null,
        lastName: user.user_metadata?.last_name || null,
        profileImageUrl: user.user_metadata?.avatar_url || null,
        role: null,
        location: null,
        bio: null,
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
  // Login endpoint - handle email/password authentication
  app.post('/api/auth/login', accountLockoutProtection(), async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        // Track failed login attempt
        trackLoginAttempt(false, email);
        return res.status(401).json({ message: error?.message || 'Login failed' });
      }

      // Track successful login
      trackLoginAttempt(true, email);

      // Set cookies with tokens
      res.cookie('access_token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      if (data.session.refresh_token) {
        res.cookie('refresh_token', data.session.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      // Get or create user in our database
      const user = data.user;
      await storage.upsertUser({
        email: user.email || null,
        firstName: user.user_metadata?.first_name || null,
        lastName: user.user_metadata?.last_name || null,
        profileImageUrl: user.user_metadata?.avatar_url || null,
        role: null,
        location: null,
        bio: null,
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
      });

      res.json({ 
        message: 'Logged in successfully',
        user: await storage.getUser(user.id)
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      if (!data.user) {
        return res.status(400).json({ message: 'Registration failed' });
      }

      // If user is immediately confirmed (like in development)
      if (data.session) {
        // Set cookies with tokens
        res.cookie('access_token', data.session.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 1000 // 1 hour
        });

        if (data.session.refresh_token) {
          res.cookie('refresh_token', data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          });
        }

        // Create user in our database
        await storage.upsertUser({
          email: data.user.email || null,
          firstName: firstName || null,
          lastName: lastName || null,
          profileImageUrl: data.user.user_metadata?.avatar_url || null,
          role: null,
          location: null,
          bio: null,
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
        });

        res.json({ 
          message: 'Registration successful',
          user: await storage.getUser(data.user.id)
        });
      } else {
        // User needs to confirm email
        res.json({ 
          message: 'Registration successful. Please check your email to confirm your account.',
          needsConfirmation: true
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Registration failed' });
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
        // Sign out from Supabase
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
        email: req.user.email || null,
        firstName: req.user.user_metadata?.first_name || null,
        lastName: req.user.user_metadata?.last_name || null,
        profileImageUrl: req.user.user_metadata?.avatar_url || null,
        role: role || null,
        location: location || null,
        bio: bio || null,
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
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
} 