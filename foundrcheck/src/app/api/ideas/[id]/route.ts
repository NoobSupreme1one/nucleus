import { NextRequest, NextResponse } from 'next/server';
import { pbAdmin } from '@/lib/pocketbase';
import { sanitizeIdea } from '@/lib/sanitize';
import { validateAuthToken } from '@/lib/auth-validation';
import { logger } from '@/lib/logger';
import type { Idea } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the idea
    const idea = await pbAdmin.collection('ideas').getOne(id, {
      expand: 'owner',
    });
    
    // Check if requester is the owner
    let isOwner = false;
    const authResult = await validateAuthToken(request);
    if (authResult.success) {
      isOwner = authResult.userId === idea.owner;
    }
    
    // Sanitize the response
    const sanitized = sanitizeIdea(idea as unknown as Idea, isOwner);
    
    return NextResponse.json(sanitized);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('API Error in GET /api/ideas/[id]', { error: errorMessage, ideaId: params.id });
    
    if (error instanceof Error && 'status' in error && error.status === 404) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}