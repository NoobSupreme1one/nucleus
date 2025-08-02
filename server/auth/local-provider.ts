import type { AuthProvider, AuthUser, AuthResult, RegisterData } from './auth-interface';
import type { User } from '@shared/types';
import { localStorage } from '../localStorage';
import { trackLoginAttempt } from '../middleware/security';
import { randomBytes } from 'crypto';

interface LocalSession {
  user: AuthUser;
  expiresAt: number;
}

export class LocalAuthProvider implements AuthProvider {
  private sessions = new Map<string, LocalSession>();
  private users = new Map<string, AuthUser>();
  private refreshTokens = new Map<string, string>(); // refreshToken -> accessToken

  async initialize(): Promise<void> {
    // Create some default users for development
    const defaultUsers = [
      {
        id: 'dev-user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123'
      },
      {
        id: 'dev-user-2',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'admin123'
      }
    ];

    for (const userData of defaultUsers) {
      const { password, ...user } = userData;
      this.users.set(user.email, user);
      
      // Also store in localStorage for persistence
      await localStorage.upsertUser({
        email: user.email || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
      });
    }

    console.log('Local auth provider initialized with default users');
    console.log('Available test accounts:');
    console.log('- test@example.com / password123');
    console.log('- admin@example.com / admin123');
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const session = this.sessions.get(token);

      if (!session) {
        return null;
      }

      // Check if session has expired
      if (Date.now() > session.expiresAt) {
        this.sessions.delete(token);
        return null;
      }

      return session.user;
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  async authenticate(email: string, password: string): Promise<AuthResult> {
    try {
      // Simple password validation for development
      const validCredentials = [
        { email: 'test@example.com', password: 'password123' },
        { email: 'admin@example.com', password: 'admin123' }
      ];

      const isValid = validCredentials.some(
        cred => cred.email === email && cred.password === password
      );

      if (!isValid) {
        // Track failed login attempt
        trackLoginAttempt(false, email);
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Track successful login
      trackLoginAttempt(true, email);

      const user = this.users.get(email);
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Generate tokens
      const accessToken = this.generateToken();
      const refreshToken = this.generateToken();
      const expiresIn = 60 * 60 * 1000; // 1 hour

      // Store session
      this.sessions.set(accessToken, {
        user,
        expiresAt: Date.now() + expiresIn
      });

      // Store refresh token mapping
      this.refreshTokens.set(refreshToken, accessToken);

      return {
        success: true,
        user,
        accessToken,
        refreshToken,
        expiresIn
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  async register(userData: RegisterData): Promise<AuthResult> {
    try {
      // Check if user already exists
      if (this.users.has(userData.email)) {
        return {
          success: false,
          error: 'User already exists'
        };
      }

      // Create new user
      const user: AuthUser = {
        id: `dev-user-${Date.now()}`,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        metadata: userData.metadata
      };

      // Store user
      this.users.set(userData.email, user);

      // Store in localStorage for persistence
      await localStorage.upsertUser({
        email: user.email || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
      });

      // Generate tokens
      const accessToken = this.generateToken();
      const refreshToken = this.generateToken();
      const expiresIn = 60 * 60 * 1000; // 1 hour

      // Store session
      this.sessions.set(accessToken, {
        user,
        expiresAt: Date.now() + expiresIn
      });

      // Store refresh token mapping
      this.refreshTokens.set(refreshToken, accessToken);

      return {
        success: true,
        user,
        accessToken,
        refreshToken,
        expiresIn
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  async logout(token: string): Promise<void> {
    try {
      // Remove session
      this.sessions.delete(token);

      // Remove associated refresh tokens
      for (const [refreshToken, accessToken] of Array.from(this.refreshTokens.entries())) {
        if (accessToken === token) {
          this.refreshTokens.delete(refreshToken);
          break;
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout failures
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const oldAccessToken = this.refreshTokens.get(refreshToken);
      
      if (!oldAccessToken) {
        return {
          success: false,
          error: 'Invalid refresh token'
        };
      }

      const session = this.sessions.get(oldAccessToken);
      
      if (!session) {
        this.refreshTokens.delete(refreshToken);
        return {
          success: false,
          error: 'Session not found'
        };
      }

      // Generate new tokens
      const newAccessToken = this.generateToken();
      const newRefreshToken = this.generateToken();
      const expiresIn = 60 * 60 * 1000; // 1 hour

      // Remove old tokens
      this.sessions.delete(oldAccessToken);
      this.refreshTokens.delete(refreshToken);

      // Store new session
      this.sessions.set(newAccessToken, {
        user: session.user,
        expiresAt: Date.now() + expiresIn
      });

      // Store new refresh token mapping
      this.refreshTokens.set(newRefreshToken, newAccessToken);

      return {
        success: true,
        user: session.user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: 'Token refresh failed'
      };
    }
  }

  async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      // Find user by ID
      for (const user of Array.from(this.users.values())) {
        if (user.id === userId) {
          return user;
        }
      }

      // Try localStorage as fallback
      const dbUser = await localStorage.getUser(userId);
      if (dbUser) {
        return {
          id: dbUser.id,
          email: dbUser.email || undefined,
          firstName: dbUser.firstName || undefined,
          lastName: dbUser.lastName || undefined,
          profileImageUrl: dbUser.profileImageUrl || undefined,
          metadata: {}
        };
      }

      return null;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Development helper methods
  getActiveSessionsCount(): number {
    return this.sessions.size;
  }

  getUsersCount(): number {
    return this.users.size;
  }

  clearExpiredSessions(): void {
    const now = Date.now();
    for (const [token, session] of Array.from(this.sessions.entries())) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
      }
    }
  }
}
