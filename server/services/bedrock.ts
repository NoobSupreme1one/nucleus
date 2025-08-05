import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

// Function to initialize Amazon Bedrock client with credential validation
function createBedrockClient() {
  const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'us-east-2';

  if (!awsAccessKeyId || !awsSecretAccessKey) {
    throw new Error('AWS credentials are missing from environment variables');
  }

  return new BedrockRuntimeClient({
    region: awsRegion,
    credentials: {
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
    }
  });
}

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
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials are not configured");
    }

    const prompt = `
    You are a startup validation expert specializing in solo developer startups. Analyze the following startup idea using our Enhanced 1000-Point Scoring System designed specifically for solo developers who struggle with focus and follow-through.

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
        "score": number (0-150)
      },
      "technicalFeasibility": {
        "complexity": "low" | "medium" | "high",
        "resourcesNeeded": "minimal" | "reasonable" | "significant",
        "timeToMarket": "estimated timeframe",
        "score": number (0-140)
      },
      "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3", "actionable recommendation 4", "actionable recommendation 5"],
      "detailedAnalysis": "comprehensive analysis paragraph explaining the scoring rationale with focus on solo developer feasibility"
    }

    Enhanced 1000-Point Scoring Framework (10 categories):
    1. Market Opportunity (150 points): Market size, competition analysis, market validation
    2. Problem-Solution Fit (120 points): Problem validation, solution quality
    3. Execution Feasibility (140 points): Technical requirements, business operations
    4. Personal Fit (100 points): Founder-market fit, execution alignment
    5. Focus & Momentum (120 points): Simplicity & focus, momentum building opportunities
    6. Financial Viability (100 points): Revenue model clarity, financial requirements
    7. Customer Validation (90 points): Customer understanding, validation methods
    8. Competitive Intelligence (80 points): Direct/indirect competition analysis
    9. Resource Requirements (70 points): Human resources, physical/digital resources
    10. Risk Assessment (130 points): Market risks, execution risks

    Special focus areas for solo developers:
    - Can this be built and executed by one person?
    - Are there clear, achievable milestones to maintain motivation?
    - How resistant is this idea to scope creep and distractions?
    - What's the minimum viable version that can generate feedback?
    - How quickly can the founder see progress and get user validation?

    Provide specific, actionable recommendations tailored for a solo developer starting this venture.
    `;

    // Prepare the request for Amazon Nova Pro
    const requestBody = {
      messages: [
        {
          role: "user",
          content: [
            {
              text: prompt
            }
          ]
        }
      ],
      inferenceConfig: {
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9
      }
    };

    const command = new InvokeModelCommand({
      modelId: "us.amazon.nova-pro-v1:0", // Using Nova Pro inference profile for complex analysis
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody)
    });

    const bedrockClient = createBedrockClient();
    const response = await bedrockClient.send(command);
    
    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    // Parse the response
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const text = responseBody.output?.message?.content?.[0]?.text;
    
    if (!text) {
      throw new Error('No text content in Bedrock response');
    }
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Bedrock response');
    }

    const resultData = JSON.parse(jsonMatch[0]);
    
    // Validate the response structure
    if (!resultData.overallScore || !resultData.marketAnalysis || !resultData.technicalFeasibility) {
      throw new Error('Invalid response structure from Bedrock');
    }

    // Ensure score is within valid range
    resultData.overallScore = Math.max(0, Math.min(1000, resultData.overallScore));
    resultData.marketAnalysis.score = Math.max(0, Math.min(150, resultData.marketAnalysis.score));
    resultData.technicalFeasibility.score = Math.max(0, Math.min(140, resultData.technicalFeasibility.score));

    return resultData as IdeaValidationResult;
  } catch (error) {
    console.error('Error validating startup idea with Bedrock:', error);
    throw new Error('Failed to validate startup idea: ' + (error as Error).message);
  }
}

export async function generateMatchingInsights(user1: any, user2: any): Promise<{
  compatibilityScore: number;
  strengths: string[];
  considerations: string[];
}> {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials are not configured");
    }

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

    const requestBody = {
      messages: [
        {
          role: "user",
          content: [
            {
              text: prompt
            }
          ]
        }
      ],
      inferenceConfig: {
        maxTokens: 1000,
        temperature: 0.5,
        topP: 0.8
      }
    };

    const command = new InvokeModelCommand({
      modelId: "us.amazon.nova-lite-v1:0", // Using Nova Lite inference profile for simpler analysis
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody)
    });

    const bedrockClient = createBedrockClient();
    const response = await bedrockClient.send(command);
    
    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const text = responseBody.output?.message?.content?.[0]?.text;
    
    if (!text) {
      throw new Error('No text content in Bedrock response');
    }
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Bedrock response');
    }

    const resultData = JSON.parse(jsonMatch[0]);
    resultData.compatibilityScore = Math.max(0, Math.min(100, resultData.compatibilityScore));
    
    return resultData;
  } catch (error) {
    console.error('Error generating matching insights with Bedrock:', error);
    // Return default compatibility score based on role complementarity
    const roleCompat = user1.role !== user2.role ? 85 : 60;
    return {
      compatibilityScore: roleCompat,
      strengths: ['Complementary skill sets', 'Shared entrepreneurial vision'],
      considerations: ['Different locations', 'Communication styles may vary']
    };
  }
}

export async function generateText(prompt: string): Promise<string> {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials are not configured");
    }

    const requestBody = {
      messages: [
        {
          role: "user",
          content: [
            {
              text: prompt
            }
          ]
        }
      ],
      inferenceConfig: {
        maxTokens: 2000,
        temperature: 0.7,
        topP: 0.9
      }
    };

    const command = new InvokeModelCommand({
      modelId: "us.amazon.nova-lite-v1:0", // Using Nova Lite inference profile
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody)
    });

    const bedrockClient = createBedrockClient();
    const response = await bedrockClient.send(command);
    
    if (!response.body) {
      throw new Error('No response body from Bedrock');
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const text = responseBody.output?.message?.content?.[0]?.text;
    
    if (!text) {
      throw new Error('No text content in Bedrock response');
    }

    return text;
  } catch (error) {
    console.error('Error generating text with Bedrock:', error);
    throw new Error('Failed to generate text: ' + (error as Error).message);
  }
}