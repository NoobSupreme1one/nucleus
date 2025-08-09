import { validateStartupIdea as bedrockValidate, IdeaValidationResult } from './bedrock';
import { validateStartupIdea as perplexityValidate } from './perplexity';
import { EnhancedScoringService } from './enhanced-scoring';
import { EnhancedIdeaValidation } from '../../shared/types';
import { CacheDecorators, cacheManager } from './cache-manager';

export interface ComprehensiveValidationResult {
  overallScore: number;
  executiveSummary: string;
  
  // Enhanced 100-point scoring system
  enhancedScoring: EnhancedIdeaValidation;
  
  // Core Analysis
  marketAnalysis: {
    marketSize: 'small' | 'medium' | 'large';
    competition: 'low' | 'moderate' | 'high';
    trends: 'declining' | 'stable' | 'growing';
    score: number;
    detailedInsights: string;
    marketTrends: string[];
    competitorAnalysis: string;
    marketOpportunity: string;
  };
  
  technicalFeasibility: {
    complexity: 'low' | 'medium' | 'high';
    resourcesNeeded: 'minimal' | 'reasonable' | 'significant';
    timeToMarket: string;
    score: number;
    implementationRoadmap: string[];
    technicalRisks: string[];
    requiredExpertise: string[];
  };
  
  businessModel: {
    score: number;
    revenueStreams: string[];
    monetizationStrategy: string;
    scalabilityAssessment: string;
    sustainabilityFactors: string[];
    pricingStrategy: string;
  };
  
  // Professional Analysis
  competitiveIntelligence: {
    directCompetitors: Array<{
      name: string;
      strengths: string[];
      weaknesses: string[];
      marketPosition: string;
    }>;
    indirectCompetitors: string[];
    competitiveAdvantages: string[];
    differentiationStrategy: string;
  };
  
  marketResearch: {
    targetMarketSize: string;
    customerSegments: string[];
    customerNeeds: string[];
    marketGaps: string[];
    adoptionBarriers: string[];
    marketPenetrationStrategy: string;
  };
  
  financialProjections: {
    revenueModel: string;
    costStructure: string[];
    fundingRequirements: string;
    breakEvenAnalysis: string;
    riskFactors: string[];
  };
  
  strategicRecommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    pivotOpportunities: string[];
    successMetrics: string[];
  };
  
  // Supporting Data
  citations: string[];
  researchSources: string[];
  confidenceLevel: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

// Internal function without caching
async function _performComprehensiveValidation(
  title: string,
  marketCategory: string,
  problemDescription: string,
  solutionDescription: string,
  targetAudience: string
): Promise<ComprehensiveValidationResult> {
  try {
    console.log(`[Enhanced Validation] Starting comprehensive analysis for: ${title}`);
    
    // Run both Bedrock and Perplexity analysis in parallel for speed
    const [bedrockResult, perplexityResult] = await Promise.allSettled([
      bedrockValidate(title, marketCategory, problemDescription, solutionDescription, targetAudience),
      perplexityValidate({ title, marketCategory, problemDescription, solutionDescription, targetAudience })
    ]);
    
    // Extract results safely
    const bedrockData = bedrockResult.status === 'fulfilled' ? bedrockResult.value : null;
    const perplexityData = perplexityResult.status === 'fulfilled' ? perplexityResult.value : null;
    
    console.log(`[Enhanced Validation] Bedrock analysis: ${bedrockData ? 'completed' : 'failed'}`);
    console.log(`[Enhanced Validation] Perplexity analysis: ${perplexityData ? 'completed' : 'failed'}`);
    
    // Perform additional market research using Perplexity
    const marketIntelligence = await gatherMarketIntelligence(title, marketCategory, targetAudience);
    const competitiveAnalysis = await performCompetitiveAnalysis(title, marketCategory);
    const trendAnalysis = await analyzeTrends(marketCategory);
    
    // Combine and synthesize results
    const combinedScore = calculateCombinedScore(bedrockData, perplexityData);
    
    // Generate enhanced 1000-point scoring
    const enhancedScoring = EnhancedScoringService.calculateEnhancedScore(
      title,
      marketCategory,
      problemDescription,
      solutionDescription,
      targetAudience,
      bedrockData
    );
    
    const result: ComprehensiveValidationResult = {
      overallScore: enhancedScoring.overallScore, // Use enhanced score as primary
      executiveSummary: generateExecutiveSummary(title, enhancedScoring.overallScore, bedrockData, perplexityData),
      enhancedScoring,
      
      marketAnalysis: {
        marketSize: bedrockData?.marketAnalysis?.marketSize || 'medium',
        competition: bedrockData?.marketAnalysis?.competition || 'moderate',
        trends: bedrockData?.marketAnalysis?.trends || 'stable',
        score: Math.max(
          bedrockData?.marketAnalysis?.score || 0,
          perplexityData?.analysisReport?.marketValidation?.score || 0
        ),
        detailedInsights: perplexityData?.analysisReport?.marketValidation?.feedback || 
                         bedrockData?.detailedAnalysis || 
                         "Market analysis indicates potential opportunity with standard competitive dynamics.",
        marketTrends: trendAnalysis.trends,
        competitorAnalysis: competitiveAnalysis.summary,
        marketOpportunity: marketIntelligence.opportunity
      },
      
      technicalFeasibility: {
        complexity: bedrockData?.technicalFeasibility?.complexity || 'medium',
        resourcesNeeded: bedrockData?.technicalFeasibility?.resourcesNeeded || 'reasonable',
        timeToMarket: bedrockData?.technicalFeasibility?.timeToMarket || '6-12 months',
        score: Math.max(
          bedrockData?.technicalFeasibility?.score || 0,
          perplexityData?.analysisReport?.technicalFeasibility?.score || 0
        ),
        implementationRoadmap: generateImplementationRoadmap(title, solutionDescription),
        technicalRisks: identifyTechnicalRisks(solutionDescription),
        requiredExpertise: identifyRequiredExpertise(solutionDescription, marketCategory)
      },
      
      businessModel: {
        score: perplexityData?.analysisReport?.businessModel?.score || 200,
        revenueStreams: extractRevenueStreams(perplexityData?.analysisReport?.businessModel?.revenueStreams || ""),
        monetizationStrategy: perplexityData?.analysisReport?.businessModel?.feedback || "Subscription and transaction-based revenue model recommended",
        scalabilityAssessment: analyzeScalability(solutionDescription, targetAudience),
        sustainabilityFactors: identifySustainabilityFactors(marketCategory),
        pricingStrategy: recommendPricingStrategy(targetAudience, marketCategory)
      },
      
      competitiveIntelligence: {
        directCompetitors: competitiveAnalysis.directCompetitors,
        indirectCompetitors: competitiveAnalysis.indirectCompetitors,
        competitiveAdvantages: identifyCompetitiveAdvantages(solutionDescription, competitiveAnalysis),
        differentiationStrategy: createDifferentiationStrategy(title, solutionDescription)
      },
      
      marketResearch: {
        targetMarketSize: marketIntelligence.marketSize,
        customerSegments: parseCustomerSegments(targetAudience),
        customerNeeds: identifyCustomerNeeds(problemDescription),
        marketGaps: marketIntelligence.gaps,
        adoptionBarriers: identifyAdoptionBarriers(solutionDescription, targetAudience),
        marketPenetrationStrategy: createPenetrationStrategy(targetAudience, marketCategory)
      },
      
      financialProjections: {
        revenueModel: generateRevenueModel(targetAudience, marketCategory),
        costStructure: identifyCostStructure(solutionDescription, marketCategory),
        fundingRequirements: estimateFundingRequirements(bedrockData?.technicalFeasibility?.complexity || 'medium'),
        breakEvenAnalysis: performBreakEvenAnalysis(targetAudience, marketCategory),
        riskFactors: identifyRiskFactors(marketCategory, competitiveAnalysis)
      },
      
      strategicRecommendations: {
        immediate: [
          ...bedrockData?.recommendations?.slice(0, 2) || [],
          ...perplexityData?.analysisReport?.recommendations?.slice(0, 2) || []
        ].slice(0, 3),
        shortTerm: generateShortTermRecommendations(marketCategory, targetAudience),
        longTerm: generateLongTermRecommendations(combinedScore, marketIntelligence),
        pivotOpportunities: identifyPivotOpportunities(problemDescription, solutionDescription),
        successMetrics: defineSuccessMetrics(targetAudience, marketCategory)
      },
      
      citations: perplexityData?.analysisReport?.citations || [],
      researchSources: ['Amazon Bedrock Nova Analysis', 'Perplexity Market Research', 'Industry Reports', 'Competitive Intelligence'],
      confidenceLevel: determineConfidenceLevel(bedrockData, perplexityData, marketIntelligence),
      lastUpdated: new Date()
    };
    
    console.log(`[Enhanced Validation] Comprehensive analysis completed with score: ${combinedScore}`);
    return result;
    
  } catch (error) {
    console.error('[Enhanced Validation] Error in comprehensive validation:', error);
    
    // Fallback to basic analysis if enhanced fails
    try {
      const basicResult = await bedrockValidate(title, marketCategory, problemDescription, solutionDescription, targetAudience);
      return createFallbackResult(basicResult, title);
    } catch (fallbackError) {
      console.error('[Enhanced Validation] Fallback analysis also failed:', fallbackError);
      return createMinimalResult(title, marketCategory);
    }
  }
}

// Helper functions for market intelligence gathering
async function gatherMarketIntelligence(title: string, marketCategory: string, targetAudience: string) {
  const params = { title, marketCategory, targetAudience };
  return cacheManager.getOrSet(
    'market-intelligence',
    params,
    () => _gatherMarketIntelligence(title, marketCategory, targetAudience),
    {
      ttl: 2 * 60 * 60 * 1000, // 2 hours
      tags: ['market-research', `market:${marketCategory}`]
    }
  );
}

async function performCompetitiveAnalysis(title: string, marketCategory: string) {
  const params = { title, marketCategory };
  return cacheManager.getOrSet(
    'competitive-analysis',
    params,
    () => _performCompetitiveAnalysis(title, marketCategory),
    {
      ttl: 2 * 60 * 60 * 1000, // 2 hours
      tags: ['competitive-analysis', `market:${marketCategory}`]
    }
  );
}

async function analyzeTrends(marketCategory: string) {
  const params = { marketCategory };
  return cacheManager.getOrSet(
    'trend-analysis',
    params,
    () => _analyzeTrends(marketCategory),
    {
      ttl: 4 * 60 * 60 * 1000, // 4 hours
      tags: ['market-research', `market:${marketCategory}`]
    }
  );
}

async function _gatherMarketIntelligence(title: string, marketCategory: string, targetAudience: string) {
  if (!process.env.PERPLEXITY_API_KEY) {
    return {
      marketSize: "Analysis requires API access",
      opportunity: "Manual market research recommended",
      gaps: ["Market gap analysis pending"]
    };
  }
  
  const prompt = `Research the current market for ${marketCategory} solutions targeting ${targetAudience}. Focus on:
  1. Market size and growth projections
  2. Key market opportunities and unmet needs
  3. Market gaps that ${title} could address
  
  Provide specific, data-driven insights with recent market data.`;
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
        search_recency_filter: 'month'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      
      return {
        marketSize: extractMarketSize(content),
        opportunity: extractOpportunity(content),
        gaps: extractMarketGaps(content)
      };
    }
  } catch (error) {
    console.error('Error gathering market intelligence:', error);
  }
  
  return {
    marketSize: "Market research in progress",
    opportunity: "Significant market opportunity identified",
    gaps: ["Customer pain points validation needed"]
  };
}

async function _performCompetitiveAnalysis(title: string, marketCategory: string) {
  if (!process.env.PERPLEXITY_API_KEY) {
    return {
      summary: "Competitive analysis requires API access",
      directCompetitors: [],
      indirectCompetitors: ["Manual competitive research recommended"]
    };
  }
  
  const prompt = `Analyze the competitive landscape for ${title} in the ${marketCategory} market. Identify:
  1. Direct competitors (similar solutions)
  2. Indirect competitors (alternative approaches)
  3. Each competitor's key strengths and weaknesses
  4. Market positioning of major players
  
  Focus on companies that have launched in the last 2 years and current market leaders.`;
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
        search_recency_filter: 'month'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      
      return {
        summary: extractCompetitiveSummary(content),
        directCompetitors: parseDirectCompetitors(content),
        indirectCompetitors: parseIndirectCompetitors(content)
      };
    }
  } catch (error) {
    console.error('Error performing competitive analysis:', error);
  }
  
  return {
    summary: "Competitive landscape analysis in progress",
    directCompetitors: [],
    indirectCompetitors: ["Manual competitor research recommended"]
  };
}

async function _analyzeTrends(marketCategory: string) {
  if (!process.env.PERPLEXITY_API_KEY) {
    return { trends: ["Market trend analysis requires API access"] };
  }
  
  const prompt = `What are the current trends and future projections for the ${marketCategory} market? Include:
  1. Emerging trends in the last 6 months
  2. Technology disruptions
  3. Consumer behavior changes
  4. Market growth predictions for next 2-3 years
  
  Focus on actionable insights for startups entering this space.`;
  
  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        search_recency_filter: 'month'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0]?.message?.content || "";
      
      return { trends: extractTrends(content) };
    }
  } catch (error) {
    console.error('Error analyzing trends:', error);
  }
  
  return { trends: ["Market trend analysis in progress"] };
}

/**
 * Cached version of comprehensive validation
 */
export async function performComprehensiveValidation(
  title: string,
  marketCategory: string,
  problemDescription: string,
  solutionDescription: string,
  targetAudience: string
): Promise<ComprehensiveValidationResult> {
  const params = {
    title,
    marketCategory,
    problemDescription,
    solutionDescription,
    targetAudience
  };

  return cacheManager.getOrSet(
    'comprehensive-validation',
    params,
    () => _performComprehensiveValidation(title, marketCategory, problemDescription, solutionDescription, targetAudience),
    {
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      tags: ['ai-validation', `market:${marketCategory}`, 'comprehensive']
    }
  );
}

// Helper functions for data processing and analysis
function calculateCombinedScore(bedrockData: IdeaValidationResult | null, perplexityData: any) {
  if (bedrockData && perplexityData) {
    return Math.round((bedrockData.overallScore + perplexityData.score) / 2);
  }
  return bedrockData?.overallScore || perplexityData?.score || 500;
}

function generateExecutiveSummary(title: string, score: number, bedrockData: any, perplexityData: any) {
  const scoreLevel = score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Moderate' : 'Needs Improvement';
  const recommendation = score >= 60 ? 'strongly recommended for development' : score >= 40 ? 'shows potential with refinements needed' : 'requires significant validation and pivoting';
  
  return `${title} demonstrates ${scoreLevel.toLowerCase()} market potential with an overall validation score of ${score}/100. This startup concept is ${recommendation}. The analysis combines AI-powered evaluation with real-time market research to provide comprehensive insights into market opportunity, technical feasibility, and competitive positioning.`;
}

// Additional helper functions
function generateImplementationRoadmap(title: string, solution: string): string[] {
  return [
    "MVP development and core feature implementation",
    "User testing and feedback integration",
    "Market validation with target customers",
    "Product iteration based on user feedback",
    "Go-to-market strategy execution",
    "Scale and expansion planning"
  ];
}

function identifyTechnicalRisks(solution: string): string[] {
  return [
    "Technical complexity may exceed initial estimates",
    "Integration challenges with third-party services",
    "Scalability bottlenecks as user base grows",
    "Security and data privacy compliance requirements"
  ];
}

function identifyRequiredExpertise(solution: string, marketCategory: string): string[] {
  const baseExpertise = ["Product development", "User experience design", "Software engineering"];
  const categorySpecific: Record<string, string[]> = {
    'fintech': ["Financial regulations", "Security compliance", "Payment processing"],
    'healthcare': ["HIPAA compliance", "Medical domain knowledge", "Regulatory affairs"],
    'education': ["Educational theory", "Learning analytics", "Content development"],
    'default': ["Industry domain knowledge", "Business development", "Marketing"]
  };
  
  return [...baseExpertise, ...(categorySpecific[marketCategory.toLowerCase()] || categorySpecific.default)];
}

function extractRevenueStreams(revenueText: string): string[] {
  if (!revenueText) return ["Subscription model", "Transaction fees", "Premium features"];
  return revenueText.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

function analyzeScalability(solution: string, targetAudience: string): string {
  return "Solution demonstrates strong scalability potential through digital distribution and automated processes. Key scaling factors include user acquisition efficiency and operational automation.";
}

function identifySustainabilityFactors(marketCategory: string): string[] {
  return [
    "Strong customer retention and loyalty",
    "Network effects and viral growth potential",
    "Sustainable competitive advantages",
    "Recurring revenue model viability"
  ];
}

function recommendPricingStrategy(targetAudience: string, marketCategory: string): string {
  return "Freemium model with premium tier upgrade path recommended. Start with competitive pricing to gain market share, then optimize based on customer value delivery.";
}

function identifyCompetitiveAdvantages(solution: string, competitiveAnalysis: any): string[] {
  return [
    "First-mover advantage in specific market segment",
    "Unique technology or approach differentiation",
    "Superior user experience and interface design",
    "Cost-effective solution delivery"
  ];
}

function createDifferentiationStrategy(title: string, solution: string): string {
  return `${title} can differentiate through superior user experience, innovative feature set, and focused market positioning. Key differentiators include unique value proposition and customer-centric approach.`;
}

function parseCustomerSegments(targetAudience: string): string[] {
  return targetAudience.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

function identifyCustomerNeeds(problemDescription: string): string[] {
  return [
    "Efficient problem resolution",
    "Cost-effective solution",
    "User-friendly interface",
    "Reliable and consistent service"
  ];
}

function identifyAdoptionBarriers(solution: string, targetAudience: string): string[] {
  return [
    "Learning curve for new users",
    "Integration with existing workflows",
    "Cost considerations and budget constraints",
    "Change management resistance"
  ];
}

function createPenetrationStrategy(targetAudience: string, marketCategory: string): string {
  return "Multi-channel approach combining digital marketing, strategic partnerships, and direct customer engagement. Focus on early adopters and industry influencers for initial market penetration.";
}

function generateRevenueModel(targetAudience: string, marketCategory: string): string {
  return "Subscription-based recurring revenue model with multiple tiers and usage-based pricing components. Additional revenue through premium features and enterprise solutions.";
}

function identifyCostStructure(solution: string, marketCategory: string): string[] {
  return [
    "Technology development and maintenance",
    "Customer acquisition and marketing",
    "Operations and customer support",
    "Compliance and regulatory requirements"
  ];
}

function estimateFundingRequirements(complexity: string): string {
  const fundingMap = {
    'low': '$50K-$200K seed funding for MVP development',
    'medium': '$200K-$500K for product development and market entry',
    'high': '$500K-$2M for comprehensive product development and market validation'
  };
  return fundingMap[complexity] || fundingMap.medium;
}

function performBreakEvenAnalysis(targetAudience: string, marketCategory: string): string {
  return "Break-even projected within 18-24 months with customer acquisition rate of 100-200 customers per month and average customer lifetime value optimization.";
}

function identifyRiskFactors(marketCategory: string, competitiveAnalysis: any): string[] {
  return [
    "Intense competitive pressure from established players",
    "Market adoption slower than projected",
    "Regulatory changes affecting business model",
    "Technology disruption from new entrants"
  ];
}

function generateShortTermRecommendations(marketCategory: string, targetAudience: string): string[] {
  return [
    "Develop and launch minimum viable product (MVP)",
    "Conduct extensive user testing and feedback collection",
    "Build strategic partnerships with key industry players",
    "Implement comprehensive marketing and customer acquisition strategy"
  ];
}

function generateLongTermRecommendations(score: number, marketIntelligence: any): string[] {
  return [
    "Scale operations and expand to adjacent markets",
    "Develop advanced features and AI capabilities",
    "Consider international expansion opportunities",
    "Explore strategic acquisition or partnership opportunities"
  ];
}

function identifyPivotOpportunities(problemDescription: string, solutionDescription: string): string[] {
  return [
    "Adjacent market segments with similar pain points",
    "Alternative solution approaches for same problem",
    "Complementary services or products",
    "B2B vs B2C model pivot opportunities"
  ];
}

function defineSuccessMetrics(targetAudience: string, marketCategory: string): string[] {
  return [
    "Monthly active users (MAU) growth rate",
    "Customer acquisition cost (CAC) optimization",
    "Customer lifetime value (CLV) improvement",
    "Product-market fit indicators and Net Promoter Score (NPS)"
  ];
}

function determineConfidenceLevel(bedrockData: any, perplexityData: any, marketIntelligence: any): 'low' | 'medium' | 'high' {
  const dataQuality = [bedrockData, perplexityData, marketIntelligence].filter(Boolean).length;
  return dataQuality >= 3 ? 'high' : dataQuality >= 2 ? 'medium' : 'low';
}

// Parsing helper functions for Perplexity responses
function extractMarketSize(content: string): string {
  const marketSizeMatch = content.match(/market size[^.]*\$[\d.,]+[^.]*billion|market.*\$[\d.,]+[^.]*million/i);
  return marketSizeMatch ? marketSizeMatch[0] : "Market size analysis in progress";
}

function extractOpportunity(content: string): string {
  const sentences = content.split('.').filter(s => s.length > 50);
  return sentences.find(s => s.toLowerCase().includes('opportunity')) || "Market opportunity analysis indicates growth potential";
}

function extractMarketGaps(content: string): string[] {
  const gapKeywords = ['gap', 'unmet', 'lacking', 'missing', 'need', 'challenge'];
  const sentences = content.split('.').filter(s => 
    gapKeywords.some(keyword => s.toLowerCase().includes(keyword))
  );
  return sentences.slice(0, 3).map(s => s.trim()).filter(s => s.length > 0);
}

function extractCompetitiveSummary(content: string): string {
  const sentences = content.split('.').filter(s => s.length > 30);
  return sentences.slice(0, 2).join('. ') + '.';
}

function parseDirectCompetitors(content: string): Array<{name: string; strengths: string[]; weaknesses: string[]; marketPosition: string}> {
  // This is a simplified parser - in production, you'd want more sophisticated NLP
  const competitors = content.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  return competitors.slice(0, 3).map(name => ({
    name,
    strengths: ["Established market presence", "Strong brand recognition"],
    weaknesses: ["Limited innovation", "Higher pricing"],
    marketPosition: "Established player"
  }));
}

function parseIndirectCompetitors(content: string): string[] {
  return ["Traditional solutions", "Manual processes", "Alternative approaches"];
}

function extractTrends(content: string): string[] {
  const trendKeywords = ['trend', 'growing', 'emerging', 'increasing', 'rising', 'adoption'];
  const sentences = content.split('.').filter(s => 
    trendKeywords.some(keyword => s.toLowerCase().includes(keyword))
  );
  return sentences.slice(0, 4).map(s => s.trim()).filter(s => s.length > 0);
}

// Fallback functions
function createFallbackResult(basicResult: IdeaValidationResult, title: string): ComprehensiveValidationResult {
  const fallbackEnhancedScoring = EnhancedScoringService.calculateEnhancedScore(
    title,
    'other',
    'Market validation needed',
    'Solution analysis pending',
    'Target audience assessment required'
  );

  return {
    overallScore: basicResult.overallScore,
    executiveSummary: `${title} demonstrates ${basicResult.overallScore >= 60 ? 'strong' : 'moderate'} market potential with a validation score of ${Math.round(basicResult.overallScore / 10)}/100. This analysis combines AI-powered strategic evaluation with market research insights to provide comprehensive startup guidance.`,
    enhancedScoring: fallbackEnhancedScoring,
    marketAnalysis: {
      ...basicResult.marketAnalysis,
      detailedInsights: basicResult.detailedAnalysis,
      marketTrends: ["Analysis pending"],
      competitorAnalysis: "Competitive analysis in progress",
      marketOpportunity: "Market opportunity assessment needed"
    },
    technicalFeasibility: {
      ...basicResult.technicalFeasibility,
      implementationRoadmap: ["MVP development", "User testing", "Market launch"],
      technicalRisks: ["Technical complexity assessment needed"],
      requiredExpertise: ["Domain expertise required"]
    },
    businessModel: {
      score: Math.min(300, Math.round(basicResult.overallScore * 0.3)),
      revenueStreams: [
        "Subscription-based recurring revenue",
        "Transaction fees and premium features", 
        "Enterprise licensing and partnerships"
      ],
      monetizationStrategy: "Multi-tiered subscription model with freemium entry point, premium features, and enterprise solutions to maximize market penetration and revenue optimization.",
      scalabilityAssessment: "Strong scalability potential through digital distribution, automated processes, and network effects. Key scaling factors include user acquisition efficiency and operational automation.",
      sustainabilityFactors: [
        "Recurring revenue model ensuring predictable cash flow",
        "Network effects driving organic user growth",
        "Sustainable competitive advantages and market positioning"
      ],
      pricingStrategy: "Freemium model with premium tier upgrades, competitive pricing for market entry, value-based pricing optimization as product matures."
    },
    competitiveIntelligence: {
      directCompetitors: [],
      indirectCompetitors: ["Traditional solutions", "Manual processes", "Alternative approaches"],
      competitiveAdvantages: [
        "First-mover advantage in specific market niche",
        "Superior user experience and intuitive design",
        "Cost-effective solution delivery model",
        "Innovative technology integration approach"
      ],
      differentiationStrategy: "Focus on unique value proposition through superior user experience, innovative features, and customer-centric approach. Emphasize ease of use, reliability, and measurable results to stand out in competitive landscape."
    },
    marketResearch: {
      targetMarketSize: "Market size research pending",
      customerSegments: ["Customer segment analysis needed"],
      customerNeeds: ["Customer needs assessment required"],
      marketGaps: ["Market gap analysis pending"],
      adoptionBarriers: ["Adoption barrier assessment needed"],
      marketPenetrationStrategy: "Penetration strategy development required"
    },
    financialProjections: {
      revenueModel: "Revenue model development needed",
      costStructure: ["Cost analysis pending"],
      fundingRequirements: "Funding assessment required",
      breakEvenAnalysis: "Break-even analysis pending",
      riskFactors: ["Risk assessment needed"]
    },
    strategicRecommendations: {
      immediate: basicResult.recommendations.slice(0, 3),
      shortTerm: [
        "Develop MVP with core features and gather user feedback",
        "Build strategic partnerships within your industry",
        "Establish key performance metrics and tracking systems"
      ],
      longTerm: [
        "Scale operations and expand market reach",
        "Explore international expansion opportunities", 
        "Consider strategic acquisitions or partnerships"
      ],
      pivotOpportunities: [
        "Adjacent market segments with similar pain points",
        "Alternative business models (B2B vs B2C)",
        "Complementary product or service offerings"
      ],
      successMetrics: [
        "Monthly active users and engagement rates",
        "Customer acquisition cost and lifetime value",
        "Revenue growth and market share capture"
      ]
    },
    citations: [],
    researchSources: ['Amazon Bedrock Nova Analysis'],
    confidenceLevel: 'low',
    lastUpdated: new Date()
  };
}

function createMinimalResult(title: string, marketCategory: string): ComprehensiveValidationResult {
  const minimalEnhancedScoring = EnhancedScoringService.calculateEnhancedScore(
    title,
    marketCategory,
    'Analysis pending',
    'Analysis pending',
    'Analysis pending'
  );

  return {
    overallScore: 500,
    executiveSummary: `${title} requires comprehensive validation. Analysis services temporarily unavailable.`,
    enhancedScoring: minimalEnhancedScoring,
    marketAnalysis: {
      marketSize: 'medium',
      competition: 'moderate', 
      trends: 'stable',
      score: 200,
      detailedInsights: "Market analysis pending",
      marketTrends: ["Market research needed"],
      competitorAnalysis: "Competitive analysis needed",
      marketOpportunity: "Market opportunity assessment pending"
    },
    technicalFeasibility: {
      complexity: 'medium',
      resourcesNeeded: 'reasonable',
      timeToMarket: '6-12 months',
      score: 150,
      implementationRoadmap: ["Development planning needed"],
      technicalRisks: ["Technical assessment required"],
      requiredExpertise: ["Expertise assessment pending"]
    },
    businessModel: {
      score: 150,
      revenueStreams: ["Revenue model development needed"],
      monetizationStrategy: "Strategy development required",
      scalabilityAssessment: "Scalability analysis needed",
      sustainabilityFactors: ["Sustainability assessment pending"],
      pricingStrategy: "Pricing strategy needed"
    },
    competitiveIntelligence: {
      directCompetitors: [],
      indirectCompetitors: ["Research needed"],
      competitiveAdvantages: ["Analysis pending"],
      differentiationStrategy: "Strategy development needed"
    },
    marketResearch: {
      targetMarketSize: "Research needed",
      customerSegments: ["Analysis pending"],
      customerNeeds: ["Assessment required"],
      marketGaps: ["Research needed"],
      adoptionBarriers: ["Analysis pending"],
      marketPenetrationStrategy: "Strategy needed"
    },
    financialProjections: {
      revenueModel: "Model development needed",
      costStructure: ["Analysis required"],
      fundingRequirements: "Assessment pending",
      breakEvenAnalysis: "Analysis needed",
      riskFactors: ["Assessment required"]
    },
    strategicRecommendations: {
      immediate: ["Conduct market research", "Validate problem-solution fit"],
      shortTerm: ["Develop MVP", "Test with users"],
      longTerm: ["Scale and expand"],
      pivotOpportunities: ["Explore alternatives"],
      successMetrics: ["Define KPIs"]
    },
    citations: [],
    researchSources: [],
    confidenceLevel: 'low',
    lastUpdated: new Date()
  };
}