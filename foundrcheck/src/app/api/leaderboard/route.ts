import { NextRequest, NextResponse } from 'next/server';
import { pbAdmin } from '@/lib/pocketbase';
import { sanitizeLeaderboardEntry } from '@/lib/sanitize';
import { logger } from '@/lib/logger';
import type { Idea } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 100);
    
    // Get top ideas by score
    const ideas = await pbAdmin.collection('ideas').getList(1, limit, {
      sort: '-score,-created',
      filter: 'status = "scored" && score != null',
      expand: 'owner',
    });
    
    // Sanitize the response
    const sanitized = ideas.items.map(item => sanitizeLeaderboardEntry(item as unknown as Idea));
    
    return NextResponse.json({
      items: sanitized,
      totalItems: ideas.totalItems,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('API Error in GET /api/leaderboard', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}