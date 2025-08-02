import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { AuthProvider, AuthUser, AuthResult, RegisterData } from './auth-interface';
import { storage } from '../storage';
import { trackLoginAttempt } from '../middleware/security';

export class SupabaseAuthProvider implements AuthProvider {
  private client: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

    this.client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async initialize(): Promise<void> {
    // Verify Supabase connection
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) {
        console.warn('Supabase connection warning:', error.message);
      }
      console.log('Supabase auth provider initialized');
    } catch (error) {
      console.error('Failed to initialize Supabase auth provider:', error);
      throw error;
    }
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.client.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      // Get or create user in our database
      let dbUser = await storage.getUser(user.id);
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
        dbUser = await storage.getUser(user.id);
      }

      return {
        id: user.id,
        email: user.email || undefined,
        firstName: user.user_metadata?.first_name || dbUser?.firstName || undefined,
        lastName: user.user_metadata?.last_name || dbUser?.lastName || undefined,
        profileImageUrl: user.user_metadata?.avatar_url || dbUser?.profileImageUrl || undefined,
        metadata: user.user_metadata
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  async authenticate(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        // Track failed login attempt
        trackLoginAttempt(false, email);
        return {
          success: false,
          error: error?.message || 'Authentication failed'
        };
      }

      // Track successful login
      trackLoginAttempt(true, email);

      const user = data.user;
      
      // Get or create user in our database
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

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || undefined,
          firstName: user.user_metadata?.first_name || undefined,
          lastName: user.user_metadata?.last_name || undefined,
          profileImageUrl: user.user_metadata?.avatar_url || undefined,
          metadata: user.user_metadata
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in ? data.session.expires_in * 1000 : undefined
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
      const { data, error } = await this.client.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            ...userData.metadata
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Registration failed'
        };
      }

      const user = data.user;

      // Create user in our database
      await storage.upsertUser({
        email: user.email || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
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

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || undefined,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: user.user_metadata?.avatar_url || undefined,
          metadata: user.user_metadata
        },
        accessToken: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresIn: data.session?.expires_in ? data.session.expires_in * 1000 : undefined
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
      await this.client.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Don't throw error for logout failures
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (error || !data.session) {
        return {
          success: false,
          error: error?.message || 'Token refresh failed'
        };
      }

      const user = data.user;
      if (!user) {
        return {
          success: false,
          error: 'Token refresh failed'
        };
      }

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email || undefined,
          firstName: user.user_metadata?.first_name || undefined,
          lastName: user.user_metadata?.last_name || undefined,
          profileImageUrl: user.user_metadata?.avatar_url || undefined,
          metadata: user.user_metadata
        },
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in ? data.session.expires_in * 1000 : undefined
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
      const dbUser = await storage.getUser(userId);
      
      if (!dbUser) {
        return null;
      }

      return {
        id: dbUser.id,
        email: dbUser.email || undefined,
        firstName: dbUser.firstName || undefined,
        lastName: dbUser.lastName || undefined,
        profileImageUrl: dbUser.profileImageUrl || undefined,
        metadata: {}
      };
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  }
}
