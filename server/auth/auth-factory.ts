import type { Express } from 'express';
import { setupAuth as setupCognitoAuth, isAuthenticated as cognitoAuth } from '../cognitoAuth';
import { setupAuth as setupLocalAuth, isAuthenticated as localAuth } from '../localAuth';
import { accountLockoutProtection } from '../middleware/security';

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
 * Get authentication middleware based on environment
 */
export function getAuthMiddleware(): any {
  const useCognito = process.env.AWS_COGNITO_USER_POOL_ID && 
                    process.env.AWS_COGNITO_CLIENT_ID;

  if (useCognito) {
    return cognitoAuth;
  } else {
    return localAuth;
  }
}

/**
 * Legacy compatibility functions for existing code
 */
export const isAuthenticated = getAuthMiddleware();
