import type { Express } from 'express';
import { AuthService } from './auth-interface';
import { SupabaseAuthProvider } from './supabase-provider';
import { LocalAuthProvider } from './local-provider';
import { accountLockoutProtection } from '../middleware/security';

/**
 * Factory function to create the appropriate auth service based on environment
 */
export function createAuthService(): AuthService {
  // Determine which auth provider to use
  const useSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                     process.env.SUPABASE_SERVICE_ROLE_KEY &&
                     process.env.NODE_ENV === 'production';

  if (useSupabase) {
    console.log('Using Supabase authentication provider');
    return new AuthService(new SupabaseAuthProvider());
  } else {
    console.log('Using local development authentication provider');
    return new AuthService(new LocalAuthProvider());
  }
}

/**
 * Setup authentication for the Express app
 */
export async function setupAuth(app: Express): Promise<AuthService> {
  const authService = createAuthService();
  
  // Initialize the auth service
  await authService.initialize();

  // Apply security middleware to auth routes
  app.use('/api/auth/login', accountLockoutProtection());
  app.use('/api/auth/register', accountLockoutProtection());

  // Setup auth routes
  authService.setupRoutes(app);

  return authService;
}

/**
 * Get authentication middleware
 */
export function getAuthMiddleware(): any {
  const authService = createAuthService();
  return authService.createAuthMiddleware();
}

/**
 * Legacy compatibility functions for existing code
 */
export const isAuthenticated = getAuthMiddleware();

// Export for backward compatibility
export { AuthService } from './auth-interface';
export { SupabaseAuthProvider } from './supabase-provider';
export { LocalAuthProvider } from './local-provider';
