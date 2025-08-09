import type { Express } from 'express';
import { setupAuth as setupCognitoAuth, isAuthenticated as cognitoAuth } from '../cognitoAuth';
import { setupAuth as setupLocalAuth, isAuthenticated as localAuth } from '../localAuth';
import { setupAuth as setupClerkAuth, isAuthenticated as clerkAuth } from '../clerkAuth';

/**
 * Setup authentication based on environment configuration
 */
export async function setupAuth(app: Express): Promise<void> {
  // Determine which auth provider to use based on environment
  const useClerk = !!process.env.CLERK_SECRET_KEY;
  const useCognito = process.env.AWS_COGNITO_USER_POOL_ID && 
                    process.env.AWS_COGNITO_CLIENT_ID;

  if (useClerk) {
    console.log('Using Clerk authentication provider');
    await setupClerkAuth(app);
  } else if (useCognito) {
    console.log('Using AWS Cognito authentication provider');
    await setupCognitoAuth(app);
  } else {
    console.log('Using local development authentication provider');
    await setupLocalAuth(app);
  }
}

/**
 * Get authentication middleware based on environment
 */
export function getAuthMiddleware(): any {
  const useClerk = !!process.env.CLERK_SECRET_KEY;
  const useCognito = process.env.AWS_COGNITO_USER_POOL_ID && 
                    process.env.AWS_COGNITO_CLIENT_ID;

  if (useClerk) return clerkAuth;
  if (useCognito) return cognitoAuth;
  return localAuth;
}

/**
 * Legacy compatibility functions for existing code
 */
export const isAuthenticated = getAuthMiddleware();
