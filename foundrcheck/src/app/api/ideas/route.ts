import { NextRequest, NextResponse } from 'next/server';
import { pbAdmin } from '@/lib/pocketbase';
import { analyzeIdea } from '@/lib/perplexity';
import { calculateValidationScore, generateAnalysisSummary } from '@/lib/scoring';
import { validateAuthToken, sanitizeInput } from '@/lib/auth-validation';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description } = body;
    
    // Validate authentication
    const authResult = await validateAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }
    
    const userId = authResult.userId!;
    
    // Validate input
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }
    
    if (title.length > 120) {
      return NextResponse.json({ error: 'Title must be 120 characters or less' }, { status: 400 });
    }
    
    if (description.length > 2000) {
      return NextResponse.json({ error: 'Description must be 2000 characters or less' }, { status: 400 });
    }
    
    // Check rate limit (3 per day)
    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    
    const existingIdeas = await pbAdmin.collection('ideas').getList(1, 3, {
      filter: `owner = "${userId}" && created >= "${dayStart.toISOString()}"`,
    });
    
    if (existingIdeas.totalItems >= 3) {
      return NextResponse.json(
        { error: 'Daily limit reached. You can submit up to 3 ideas per day.' },
        { status: 429 }
      );
    }
    
    // Create idea with queued status
    const ideaData = {
      title: sanitizeInput(title, 120),
      description: sanitizeInput(description, 2000),
      status: 'queued',
      owner: userId,
    };
    
    const idea = await pbAdmin.collection('ideas').create(ideaData);
    
    // Trigger background analysis
    setImmediate(async () => {
      try {
        // Update status to analyzing
        await pbAdmin.collection('ideas').update(idea.id, { status: 'analyzing' });
        
        // Call Perplexity API
        const analysisData = await analyzeIdea(description);
        
        // Calculate score
        const score = calculateValidationScore(analysisData.rubric_inputs);
        
        // Generate summary
        const summary = generateAnalysisSummary(analysisData);
        
        // Update idea with results
        await pbAdmin.collection('ideas').update(idea.id, {
          status: 'scored',
          analysis_raw: analysisData,
          analysis_summary: summary,
          score: score,
        });
      } catch (error) {
        // Update status to failed
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await pbAdmin.collection('ideas').update(idea.id, {
          status: 'failed',
          analysis_summary: `Analysis failed: ${errorMessage}`,
        });
      }
    });
    
    return NextResponse.json({ 
      id: idea.id,
      status: 'queued'
    }, { status: 202 });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('API Error in POST /api/ideas', { error: errorMessage, stack });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}