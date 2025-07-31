import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export interface IdeaValidationResult {
  overallScore: number;
  marketAnalysis: {
    marketSize: 'small' | 'medium' | 'large';
    competition: 'low' | 'moderate' | 'high';
    trends: 'declining' | 'stable' | 'growing';
    score: number;
  };
  technicalFeasibility: {
    complexity: 'low' | 'medium' | 'high';
    resourcesNeeded: 'minimal' | 'reasonable' | 'significant';
    timeToMarket: string;
    score: number;
  };
  recommendations: string[];
  detailedAnalysis: string;
}

export async function validateStartupIdea(
  title: string,
  marketCategory: string,
  problemDescription: string,
  solutionDescription: string,
  targetAudience: string
): Promise<IdeaValidationResult> {
  try {
    const prompt = `
    You are a startup validation expert. Analyze the following startup idea and provide a comprehensive assessment with a score out of 1000 points.

    Startup Idea:
    - Title: ${title}
    - Market Category: ${marketCategory}
    - Problem: ${problemDescription}
    - Solution: ${solutionDescription}
    - Target Audience: ${targetAudience}

    Please provide a detailed analysis in JSON format with the following structure:
    {
      "overallScore": number (0-1000),
      "marketAnalysis": {
        "marketSize": "small" | "medium" | "large",
        "competition": "low" | "moderate" | "high", 
        "trends": "declining" | "stable" | "growing",
        "score": number (0-400)
      },
      "technicalFeasibility": {
        "complexity": "low" | "medium" | "high",
        "resourcesNeeded": "minimal" | "reasonable" | "significant",
        "timeToMarket": "estimated timeframe",
        "score": number (0-300)
      },
      "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"],
      "detailedAnalysis": "comprehensive analysis paragraph explaining the scoring rationale"
    }

    Scoring criteria:
    - Market Analysis (400 points): Market size, competition level, growth trends
    - Technical Feasibility (300 points): Implementation complexity, resource requirements
    - Problem-Solution Fit (200 points): How well the solution addresses the problem
    - Target Market Clarity (100 points): How well-defined and reachable the target audience is

    Provide specific, actionable recommendations and be realistic in your assessment.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a startup validation expert with deep knowledge of market analysis, technical feasibility, and business strategy. Provide thorough, realistic assessments."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate the response structure
    if (!result.overallScore || !result.marketAnalysis || !result.technicalFeasibility) {
      throw new Error('Invalid response structure from OpenAI');
    }

    // Ensure score is within valid range
    result.overallScore = Math.max(0, Math.min(1000, result.overallScore));
    result.marketAnalysis.score = Math.max(0, Math.min(400, result.marketAnalysis.score));
    result.technicalFeasibility.score = Math.max(0, Math.min(300, result.technicalFeasibility.score));

    return result as IdeaValidationResult;
  } catch (error) {
    console.error('Error validating startup idea:', error);
    throw new Error('Failed to validate startup idea: ' + (error as Error).message);
  }
}

export async function generateMatchingInsights(user1: any, user2: any): Promise<{
  compatibilityScore: number;
  strengths: string[];
  considerations: string[];
}> {
  try {
    const prompt = `
    Analyze the compatibility between these two potential co-founders and provide matching insights.

    Person 1:
    - Role: ${user1.role}
    - Location: ${user1.location}
    - Bio: ${user1.bio}
    - Idea Score: ${user1.totalIdeaScore}

    Person 2:
    - Role: ${user2.role}
    - Location: ${user2.location}
    - Bio: ${user2.bio}
    - Idea Score: ${user2.totalIdeaScore}

    Provide analysis in JSON format:
    {
      "compatibilityScore": number (0-100),
      "strengths": ["strength 1", "strength 2", "strength 3"],
      "considerations": ["consideration 1", "consideration 2"]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    result.compatibilityScore = Math.max(0, Math.min(100, result.compatibilityScore));
    
    return result;
  } catch (error) {
    console.error('Error generating matching insights:', error);
    // Return default compatibility score based on role complementarity
    const roleCompat = user1.role !== user2.role ? 85 : 60;
    return {
      compatibilityScore: roleCompat,
      strengths: ['Complementary skill sets', 'Shared entrepreneurial vision'],
      considerations: ['Different locations', 'Communication styles may vary']
    };
  }
}
