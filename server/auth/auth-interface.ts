import type { Express, RequestHandler } from 'express';
import type { User } from '@shared/types';

/**
 * Unified authentication interface that abstracts different auth providers
 */
export interface AuthProvider {
  /**
   * Authenticate user with email/password
   */
  login(credentials: LoginCredentials): Promise<{ user: AuthUser; accessToken: string; refreshToken?: string }>;

  /**
   * Register a new user
   */
  register(credentials: RegisterCredentials): Promise<{ user: AuthUser; needsConfirmation: boolean; accessToken?: string; refreshToken?: string }>;

  /**
   * Get user by access token
   */
  getUser(accessToken: string): Promise<AuthUser | null>;

  /**
   * Logout user and invalidate token
   */
  logout(accessToken: string): Promise<void>;

  /**
   * Confirm user signup (for providers that require email confirmation)
   */
  confirmSignUp?(email: string, confirmationCode: string): Promise<boolean>;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Unified authentication service that manages different providers
 */
export class AuthService {
  private provider: AuthProvider;

  constructor(provider: AuthProvider) {
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
  }

  /**
   * Extract token from request headers or cookies
   */
  extractToken(req: any): string | null {
    // Try Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Try cookies
    if (req.cookies && req.cookies.access_token) {
      return req.cookies.access_token;
    }

    return null;
  }

  /**
   * Create authentication middleware
   */
  createAuthMiddleware(): RequestHandler {
    return async (req: any, res, next) => {
      try {
        const token = this.extractToken(req);

        if (!token) {
          return res.status(401).json({ 
            success: false,
            error: 'No authentication token provided' 
          });
        }

        const user = await this.provider.verifyToken(token);

        if (!user) {
          return res.status(401).json({ 
            success: false,
            error: 'Invalid or expired token' 
          });
        }

        // Attach user to request
        req.user = user;
        next();
      } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ 
          success: false,
          error: 'Authentication failed' 
        });
      }
    };
  }

  /**
   * Set authentication cookies
   */
  setAuthCookies(res: any, result: AuthResult): void {
    if (result.accessToken) {
      res.cookie('access_token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: result.expiresIn || 60 * 60 * 1000, // Default 1 hour
        sameSite: 'strict'
      });
    }

    if (result.refreshToken) {
      res.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict'
      });
    }
  }

  /**
   * Clear authentication cookies
   */
  clearAuthCookies(res: any): void {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
  }

  /**
   * Setup authentication routes
   */
  setupRoutes(app: Express): void {
    // Login endpoint
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            success: false,
            error: 'Email and password are required'
          });
        }

        const result = await this.provider.authenticate(email, password);

        if (!result.success) {
          return res.status(401).json({
            success: false,
            error: result.error || 'Authentication failed'
          });
        }

        // Set authentication cookies
        this.setAuthCookies(res, result);

        res.json({
          success: true,
          user: result.user
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // Register endpoint
    app.post('/api/auth/register', async (req, res) => {
      try {
        const result = await this.provider.register(req.body);

        if (!result.success) {
          return res.status(400).json({
            success: false,
            error: result.error || 'Registration failed'
          });
        }

        // Set authentication cookies
        this.setAuthCookies(res, result);

        res.status(201).json({
          success: true,
          user: result.user
        });
      } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // Logout endpoint
    app.post('/api/auth/logout', async (req, res) => {
      try {
        const token = this.extractToken(req);
        
        if (token) {
          await this.provider.logout(token);
        }

        this.clearAuthCookies(res);

        res.json({
          success: true,
          message: 'Logged out successfully'
        });
      } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // User profile endpoint
    app.get('/api/auth/user', this.createAuthMiddleware(), async (req: any, res) => {
      try {
        const user = await this.provider.getUserProfile(req.user.id);
        
        if (!user) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }

        res.json(user);
      } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // Refresh token endpoint
    app.post('/api/auth/refresh', async (req, res) => {
      try {
        const refreshToken = req.cookies?.refresh_token;

        if (!refreshToken) {
          return res.status(401).json({
            success: false,
            error: 'No refresh token provided'
          });
        }

        const result = await this.provider.refreshToken(refreshToken);

        if (!result.success) {
          this.clearAuthCookies(res);
          return res.status(401).json({
            success: false,
            error: result.error || 'Token refresh failed'
          });
        }

        // Set new authentication cookies
        this.setAuthCookies(res, result);

        res.json({
          success: true,
          user: result.user
        });
      } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // Google OAuth routes (only for Supabase provider)
    if (this.provider.constructor.name === 'SupabaseAuthProvider') {
      // Google OAuth login endpoint
      app.get('/api/auth/google', async (req, res) => {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
          
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${req.protocol}://${req.get('host')}/auth/google/callback`,
            },
          });

          if (error) {
            console.error('Google OAuth error:', error);
            return res.status(500).json({ 
              success: false,
              error: 'OAuth initialization failed' 
            });
          }

          // Redirect to Google OAuth
          res.redirect(data.url);
        } catch (error) {
          console.error('Google OAuth error:', error);
          res.status(500).json({ 
            success: false,
            error: 'OAuth initialization failed' 
          });
        }
      });

      // Google OAuth callback endpoint
      app.get('/auth/google/callback', async (req, res) => {
        try {
          const { code, error: oauthError } = req.query;

          if (oauthError) {
            console.error('OAuth error:', oauthError);
            return res.redirect('/login?error=oauth_error');
          }

          if (!code) {
            return res.redirect('/login?error=no_code');
          }

          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
          const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';
          
          const supabase = createClient(supabaseUrl, supabaseAnonKey);

          // Exchange code for session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code as string);

          if (error || !data.session) {
            console.error('Code exchange error:', error);
            return res.redirect('/login?error=exchange_failed');
          }

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

          // Get or create user in our database using the provider
          const user = data.user;
          const { storage } = await import('../storage');
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

          // Redirect to dashboard
          res.redirect('/');
        } catch (error) {
          console.error('OAuth callback error:', error);
          res.redirect('/login?error=callback_failed');
        }
      });
    }
  }
}
