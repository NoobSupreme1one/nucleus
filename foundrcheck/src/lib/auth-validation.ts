import { NextRequest } from 'next/server';
import { pbAdmin } from './pocketbase';

export interface AuthValidationResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export async function validateAuthToken(request: NextRequest): Promise<AuthValidationResult> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false, error: 'Authentication required' };
  }

  const token = authHeader.substring(7);

  try {
    // Validate token with PocketBase
    const authStore = pbAdmin.authStore;
    authStore.loadFromCookie(`pb_auth=${token}`);
    
    if (!authStore.isValid || !authStore.model?.id) {
      return { success: false, error: 'Invalid or expired token' };
    }

    return { 
      success: true, 
      userId: authStore.model.id 
    };
  } catch {
    return { success: false, error: 'Token validation failed' };
  }
}

export async function validateUserAccess(userId: string, resourceOwnerId: string): Promise<boolean> {
  return userId === resourceOwnerId;
}

export function sanitizeInput(input: string, maxLength?: number): string {
  let sanitized = input.trim().replace(/[<>]/g, '');
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  return sanitized;
}