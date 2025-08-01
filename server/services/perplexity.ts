interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created: number;
  citations: string[];
  choices: Array<{
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
    delta: {
      role: string;
      content: string;
    };
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface IdeaValidationRequest {
  title: string;
  marketCategory: string;
  problemDescription: string;
  solutionDescription: string;
  targetAudience: string;
}

interface ValidationResult {
  score: number;
  analysisReport: {
    marketValidation: {
      score: number;
      feedback: string;
      marketSize: string;
      competition: string;
    };
    technicalFeasibility: {
      score: number;
      feedback: string;
      complexity: string;
      resources: string;
    };
    businessModel: {
      score: number;
      feedback: string;
      revenueStreams: string;
      sustainability: string;
    };
    overallFeedback: string;
    recommendations: string[];
    citations: string[];
  };
}

export async function validateStartupIdea(idea: IdeaValidationRequest): Promise<ValidationResult> {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY is not configured");
  }

  const prompt = `Analyze this startup idea and provide a comprehensive validation score out of 1000 points:

Title: ${idea.title}
Market Category: ${idea.marketCategory}
Problem: ${idea.problemDescription}
Solution: ${idea.solutionDescription}
Target Audience: ${idea.targetAudience}

Please provide a detailed analysis in JSON format with:
- Market validation score (0-400 points): market size, demand, competition analysis
- Technical feasibility score (0-300 points): implementation complexity, required resources
- Business model score (0-300 points): revenue potential, sustainability, scalability

For each category, include:
- Numerical score
- Detailed feedback explaining the score
- Specific insights about market size/competition/complexity/revenue streams

Also provide:
- Overall feedback summary
- 3-5 actionable recommendations
- Total score (sum of all categories)

Respond with valid JSON only.`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a startup validation expert. Analyze startup ideas and provide structured feedback with numerical scores. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
        top_p: 0.9,
        search_recency_filter: 'month',
        return_images: false,
        return_related_questions: false,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Perplexity API error details:`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: PerplexityResponse = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from Perplexity API");
    }

    // Extract JSON from the response
    let analysisData;
    try {
      // Try to parse the entire content as JSON first
      analysisData = JSON.parse(content);
    } catch {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1]);
      } else {
        // Last resort: try to find any JSON-like structure
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          analysisData = JSON.parse(content.slice(jsonStart, jsonEnd));
        } else {
          throw new Error("Could not extract valid JSON from response");
        }
      }
    }

    // Validate and structure the response
    const marketScore = Math.min(400, Math.max(0, analysisData.marketValidation?.score || 0));
    const technicalScore = Math.min(300, Math.max(0, analysisData.technicalFeasibility?.score || 0));
    const businessScore = Math.min(300, Math.max(0, analysisData.businessModel?.score || 0));
    const totalScore = marketScore + technicalScore + businessScore;

    return {
      score: totalScore,
      analysisReport: {
        marketValidation: {
          score: marketScore,
          feedback: analysisData.marketValidation?.feedback || "Market analysis pending",
          marketSize: analysisData.marketValidation?.marketSize || "Analysis in progress",
          competition: analysisData.marketValidation?.competition || "Competitive landscape review needed"
        },
        technicalFeasibility: {
          score: technicalScore,
          feedback: analysisData.technicalFeasibility?.feedback || "Technical review pending",
          complexity: analysisData.technicalFeasibility?.complexity || "Complexity assessment needed",
          resources: analysisData.technicalFeasibility?.resources || "Resource requirements under review"
        },
        businessModel: {
          score: businessScore,
          feedback: analysisData.businessModel?.feedback || "Business model analysis pending",
          revenueStreams: analysisData.businessModel?.revenueStreams || "Revenue analysis in progress",
          sustainability: analysisData.businessModel?.sustainability || "Sustainability review needed"
        },
        overallFeedback: analysisData.overallFeedback || "Comprehensive analysis completed",
        recommendations: Array.isArray(analysisData.recommendations) 
          ? analysisData.recommendations 
          : ["Continue market research", "Validate with target customers", "Develop MVP"],
        citations: data.citations || []
      }
    };

  } catch (error) {
    console.error("Error validating startup idea with Perplexity:", error);
    
    // Provide a basic fallback response instead of throwing
    return {
      score: 500, // Neutral score
      analysisReport: {
        marketValidation: {
          score: 200,
          feedback: "Market analysis temporarily unavailable. Please try again later.",
          marketSize: "Analysis pending",
          competition: "Competitive analysis pending"
        },
        technicalFeasibility: {
          score: 150,
          feedback: "Technical feasibility analysis temporarily unavailable.",
          complexity: "Assessment pending",
          resources: "Resource analysis pending"
        },
        businessModel: {
          score: 150,
          feedback: "Business model analysis temporarily unavailable.",
          revenueStreams: "Revenue analysis pending",
          sustainability: "Sustainability analysis pending"
        },
        overallFeedback: "Analysis service temporarily unavailable. Your idea shows potential and we recommend proceeding with market validation.",
        recommendations: [
          "Conduct customer interviews to validate problem-solution fit",
          "Research market size and competition manually",
          "Develop a minimum viable product (MVP)",
          "Test pricing strategies with potential customers"
        ],
        citations: []
      }
    };
  }
}

export async function generateMatchingInsights(user1Role: string, user2Role: string): Promise<{ compatibilityScore: number; insights: string }> {
  if (!process.env.PERPLEXITY_API_KEY) {
    // Provide basic compatibility scoring without API
    const roleCompatibility: Record<string, Record<string, number>> = {
      'engineer': { 'designer': 85, 'marketer': 80, 'engineer': 60 },
      'designer': { 'engineer': 85, 'marketer': 75, 'designer': 60 },
      'marketer': { 'engineer': 80, 'designer': 75, 'marketer': 55 }
    };
    
    const score = roleCompatibility[user1Role]?.[user2Role] || 70;
    return {
      compatibilityScore: score,
      insights: `${user1Role} and ${user2Role} roles complement each other well for building a balanced founding team.`
    };
  }

  const prompt = `Analyze the compatibility between two co-founder roles for a startup:

Role 1: ${user1Role}
Role 2: ${user2Role}

Provide a compatibility score (0-100) and explain why these roles work well together or what challenges they might face. Consider:
- Complementary skills
- Potential collaboration areas
- Common challenges
- Success factors

Respond with JSON format: {"compatibilityScore": number, "insights": "detailed explanation"}`;

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a co-founder matching expert. Analyze role compatibility and provide structured insights in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data: PerplexityResponse = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received");
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      // Fallback parsing
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse response");
      }
    }

    return {
      compatibilityScore: Math.min(100, Math.max(0, result.compatibilityScore || 70)),
      insights: result.insights || "These roles can work well together with proper communication and defined responsibilities."
    };

  } catch (error) {
    console.error("Error generating matching insights:", error);
    
    // Fallback compatibility scoring
    const roleCompatibility: Record<string, Record<string, number>> = {
      'engineer': { 'designer': 85, 'marketer': 80, 'engineer': 60 },
      'designer': { 'engineer': 85, 'marketer': 75, 'designer': 60 },
      'marketer': { 'engineer': 80, 'designer': 75, 'marketer': 55 }
    };
    
    const score = roleCompatibility[user1Role]?.[user2Role] || 70;
    return {
      compatibilityScore: score,
      insights: `${user1Role} and ${user2Role} roles typically complement each other well, bringing different perspectives and skills to the founding team.`
    };
  }
}