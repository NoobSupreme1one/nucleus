import { NextRequest, NextResponse } from 'next/server';
import { pbAdmin } from '@/lib/pocketbase';
import { sanitizeLeaderboardEntry } from '@/lib/sanitize';
import { getDayWindow } from '@/lib/time';
import { logger } from '@/lib/logger';
import type { Idea } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timezone = searchParams.get('tz') || process.env.APP_TIMEZONE || 'America/Los_Angeles';
    
    // Get today's window for the specified timezone
    const { start, end } = getDayWindow(timezone);
    
    // Get highest scoring idea from today
    const ideas = await pbAdmin.collection('ideas').getList(1, 1, {
      sort: '-score,-created',
      filter: `status = "scored" && score != null && created >= "${start.toISOString()}" && created <= "${end.toISOString()}"`,
      expand: 'owner',
    });
    
    if (ideas.items.length === 0) {
      return NextResponse.json({ bestIdea: null });
    }
    
    // Sanitize the response
    const bestIdea = sanitizeLeaderboardEntry(ideas.items[0] as unknown as Idea);
    
    return NextResponse.json({ bestIdea });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('API Error in GET /api/best-of-day', { error: errorMessage });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}