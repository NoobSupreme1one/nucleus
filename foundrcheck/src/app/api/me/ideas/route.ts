import { NextRequest, NextResponse } from 'next/server';
import { pbAdmin } from '@/lib/pocketbase';
import { sanitizeIdea } from '@/lib/sanitize';
import { validateAuthToken } from '@/lib/auth-validation';
import { logger } from '@/lib/logger';
import type { Idea } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    
    const userId = authResult.userId!;
    
    // Get user's ideas
    const ideas = await pbAdmin.collection('ideas').getList(1, 50, {
      sort: '-created',
      filter: `owner = "${userId}"`,
      expand: 'owner',
    });
    
    // Sanitize the response (owner view, so include raw analysis)
    const sanitized = ideas.items.map(item => sanitizeIdea(item as unknown as Idea, true));
    
    return NextResponse.json({
      items: sanitized,
      totalItems: ideas.totalItems,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('API Error in GET /api/me/ideas', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}