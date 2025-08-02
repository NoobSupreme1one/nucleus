import type { Express, RequestHandler } from 'express';
import type { User } from '@shared/types';

/**
 * Unified authentication interface that abstracts different auth providers
 */
export interface AuthProvider {
  /**
   * Initialize the authentication provider
   */
  initialize(): Promise<void>;

  /**
   * Verify a token and return user information
   */
  verifyToken(token: string): Promise<AuthUser | null>;

  /**
   * Authenticate user with email/password
   */
  authenticate(email: string, password: string): Promise<AuthResult>;

  /**
   * Register a new user
   */
  register(userData: RegisterData): Promise<AuthResult>;

  /**
   * Logout user and invalidate token
   */
  logout(token: string): Promise<void>;

  /**
   * Refresh an access token
   */
  refreshToken(refreshToken: string): Promise<AuthResult>;

  /**
   * Get user profile information
   */
  getUserProfile(userId: string): Promise<AuthUser | null>;
}

export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  metadata?: Record<string, any>;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  metadata?: Record<string, any>;
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
  }
}
