import type { Express, RequestHandler } from 'express';
// Clerk express middleware and client
// These imports require @clerk/express to be installed at runtime
// We keep this module isolated so other auth modes still work without Clerk
import { clerkMiddleware, requireAuth, getAuth } from '@clerk/express';
import { storage } from './storage';
import { AvatarOverride } from './services/avatar';

// Map Clerk user to our InsertUser shape and upsert in storage
async function ensureUser(userId: string) {
  // Fetch user details via Clerk REST using the new Express client
  // Import lazily to avoid loading unless needed
  const { createClerkClient } = await import('@clerk/express');
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const user = await clerk.users.getUser(userId);

  // Build minimal profile; fallbacks keep schema happy
  const primaryEmail = user.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress
    || user.emailAddresses?.[0]?.emailAddress
    || `${user.id}@users.noreply.clerk.com`;

  await storage.upsertUser({
    email: primaryEmail,
    firstName: user.firstName || 'User',
    lastName: user.lastName || '',
    profileImageUrl: user.imageUrl || null,
    role: null,
    location: 'Unknown',
    bio: '',
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
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  try {
    const auth = getAuth(req);
    if (!auth?.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Try to ensure user exists in our storage, but don't fail if storage is unavailable
    try {
      await ensureUser(auth.userId);
    } catch (storageError) {
      console.warn('Storage error when ensuring user, continuing with Clerk auth:', storageError);
      // Continue with authentication even if storage fails
    }

    // Attach minimal user object expected by routes
    req.user = { id: auth.userId };
    next();
  } catch (err) {
    console.error('Clerk auth error:', err);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export async function setupAuth(app: Express) {
  // Attach Clerk middleware early to auth routes
  app.use(clerkMiddleware({
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
    secretKey: process.env.CLERK_SECRET_KEY!
  }));

  // Current user endpoint using Clerk context
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Fetch enriched profile for the current user
      const { createClerkClient } = await import('@clerk/express');
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
      const auth = getAuth(req);
      
      if (!auth?.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      const user = await clerk.users.getUser(auth.userId);
      const override = AvatarOverride.get(auth.userId);

      res.json({
        id: user.id,
        email: user.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || null,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: override || user.imageUrl,
      });
    } catch (error) {
      console.error('Error fetching Clerk user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });
}
