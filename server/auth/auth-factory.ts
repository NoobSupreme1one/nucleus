import type { Express, RequestHandler } from 'express';
import { setupAuth as setupCognitoAuth, isAuthenticated as cognitoAuth } from '../cognitoAuth';
import { LocalAuthProvider } from './local-provider';
import { storage } from '../storage';
import { accountLockoutProtection } from '../middleware/security';

// Initialize local auth provider
const localProvider = new LocalAuthProvider();

/**
 * Setup authentication based on environment configuration
 */
export async function setupAuth(app: Express): Promise<void> {
  // Determine which auth provider to use based on environment
  const useCognito = process.env.AWS_COGNITO_USER_POOL_ID && 
                    process.env.AWS_COGNITO_CLIENT_ID;

  if (useCognito) {
    console.log('Using AWS Cognito authentication provider');
    await setupCognitoAuth(app);
  } else {
    console.log('Using local development authentication provider');
    await setupLocalAuth(app);
  }
}

/**
 * Setup local authentication routes
 */
async function setupLocalAuth(app: Express): Promise<void> {
  await localProvider.initialize();

  // Login endpoint
  app.post('/api/auth/login', accountLockoutProtection(), async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const result = await localProvider.login({ email, password });

      // Set cookies with tokens
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1000 // 1 hour
      });

      if (result.refreshToken) {
        res.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.json({ 
        message: 'Logged in successfully',
        user: await storage.getUser(result.user.id)
      });
    } catch (error: any) {
      console.error('Local login error:', error);
      res.status(401).json({ message: error.message || 'Login failed' });
    }
  });

  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      const result = await localProvider.register({
        email,
        password,
        firstName,
        lastName
      });

      if (result.accessToken && result.refreshToken) {
        // Set cookies with tokens
        res.cookie('access_token', result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 1000 // 1 hour
        });

        res.cookie('refresh_token', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
      }

      res.json({ 
        message: 'Registration successful',
        user: await storage.getUser(result.user.id),
        needsConfirmation: result.needsConfirmation
      });
    } catch (error: any) {
      console.error('Local registration error:', error);
      res.status(400).json({ message: error.message || 'Registration failed' });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', async (req, res) => {
    try {
      let token: string | undefined;

      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (req.cookies && req.cookies.access_token) {
        token = req.cookies.access_token;
      }

      if (token) {
        await localProvider.logout(token);
      }

      // Clear cookies
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Local logout error:', error);
      res.status(500).json({ message: 'Logout failed' });
    }
  });

  // Get current user endpoint
  app.get('/api/auth/user', localAuthMiddleware, async (req: any, res) => {
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
  app.put('/api/auth/user', localAuthMiddleware, async (req: any, res) => {
    try {
      const { role, location, bio } = req.body;
      
      const updatedUser = await storage.upsertUser({
        id: req.user.id,
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

/**
 * Local auth middleware
 */
const localAuthMiddleware: RequestHandler = async (req: any, res, next) => {
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
    
    const user = await localProvider.getUser(token);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Local auth error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

/**
 * Get authentication middleware based on environment
 */
export function getAuthMiddleware(): RequestHandler {
  const useCognito = process.env.AWS_COGNITO_USER_POOL_ID && 
                    process.env.AWS_COGNITO_CLIENT_ID;

  if (useCognito) {
    return cognitoAuth;
  } else {
    return localAuthMiddleware;
  }
}

/**
 * Legacy compatibility functions for existing code
 */
export const isAuthenticated = getAuthMiddleware();
