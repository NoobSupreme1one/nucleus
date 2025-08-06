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
    // Initialize provider if it has an initialize method
    if ('initialize' in this.provider && typeof this.provider.initialize === 'function') {
      await (this.provider as any).initialize();
    }
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

        const user = await this.provider.getUser(token);

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
  setAuthCookies(res: any, result: { user: AuthUser; accessToken?: string; refreshToken?: string; expiresIn?: number }): void {
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

        const result = await this.provider.login({ email, password });

        // Provider throws on error, so we can assume success here

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

        // Provider throws on error, so we can assume success here

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
        const user = await this.provider.getUser(this.extractToken(req) || '');
        
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

        // Refresh token functionality would need to be added to the provider interface
        throw new Error('Refresh token not implemented');

        // This code is unreachable due to the throw above
      } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    });

    // OAuth routes would be implemented here for providers that support it
    // Currently using AWS Cognito which has different OAuth flow
  }
}
