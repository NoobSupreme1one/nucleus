import type { 
  User, 
  Idea, 
  Submission, 
  Match, 
  Message,
  Role,
  SubscriptionTier,
  MatchStatus,
  MarketCategory
} from '@prisma/client';

// Export Prisma types
export type { 
  User, 
  Idea, 
  Submission, 
  Match, 
  Message,
  Role,
  SubscriptionTier,
  MatchStatus,
  MarketCategory
};

// Insert types (for creating new records)
export type InsertUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
export type InsertIdea = Omit<Idea, 'id' | 'createdAt' | 'validationScore' | 'analysisReport'>;
export type InsertSubmission = Omit<Submission, 'id' | 'createdAt' | 'qualityScore'>;
export type InsertMatch = Omit<Match, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertMessage = Omit<Message, 'id' | 'createdAt'>;

// Update types (for partial updates)
export type UpdateUser = Partial<InsertUser>;
export type UpdateIdea = Partial<InsertIdea>;
export type UpdateSubmission = Partial<InsertSubmission>;
export type UpdateMatch = Partial<InsertMatch>;
export type UpdateMessage = Partial<InsertMessage>;

// Extended types with relations
export type UserWithIdeas = User & {
  ideas: Idea[];
};

export type UserWithSubmissions = User & {
  submissions: Submission[];
};

export type MatchWithUsers = Match & {
  user1: User;
  user2: User;
};

export type MatchWithMessages = Match & {
  messages: Message[];
};

export type MessageWithSender = Message & {
  sender: User;
};

export type IdeaWithUser = Idea & {
  user: User;
};

export type SubmissionWithUser = Submission & {
  user: User;
};

// Privacy Settings Interface
export interface UserPrivacySettings {
  profilePublic: boolean;
  ideasPublic: boolean;
  allowFounderMatching: boolean;
  allowDirectContact: boolean;
}

// Domain Suggestion Interface
export interface DomainSuggestion {
  domain: string;
  available: boolean;
  price?: number;
  registrar?: string;
  alternatives?: string[];
}

// Funding Opportunity Interface
export interface FundingOpportunity {
  id: string;
  name: string;
  type: 'grant' | 'accelerator' | 'vc' | 'angel' | 'crowdfunding' | 'government';
  description: string;
  amount: string;
  stage: string[];
  marketCategories: MarketCategory[];
  applicationDeadline?: string;
  website: string;
  requirements: string[];
  matchScore: number;
}

// Founder Match Interface
export interface FounderMatch {
  user: User;
  matchScore: number;
  commonInterests: string[];
  complementarySkills: string[];
  sharedMarketCategories: MarketCategory[];
  contactAllowed: boolean;
}

// Error Types
export interface ProReportError {
  code: string;
  message: string;
  details?: any;
}

// Response Interfaces
export interface ProReportResponse {
  success: boolean;
  proReport?: ProBusinessReport;
  error?: ProReportError;
}

// Enhanced 1000-Point Scoring System
export interface ScoringCategory {
  name: string;
  score: number;
  maxScore: number;
  criteria: ScoringCriterion[];
}

export interface ScoringCriterion {
  name: string;
  score: number;
  maxScore: number;
  description: string;
  weight: number;
}

export interface EnhancedIdeaValidation {
  overallScore: number;
  maxScore: 1000;
  gradeLevel: 'Poor' | 'Weak' | 'Moderate' | 'Strong' | 'Exceptional';
  recommendation: string;
  
  categories: {
    marketOpportunity: ScoringCategory;
    problemSolutionFit: ScoringCategory;
    executionFeasibility: ScoringCategory;
    personalFit: ScoringCategory;
    focusMomentum: ScoringCategory;
    financialViability: ScoringCategory;
    customerValidation: ScoringCategory;
    competitiveIntelligence: ScoringCategory;
    resourceRequirements: ScoringCategory;
    riskAssessment: ScoringCategory;
  };
  
  detailedAnalysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    keyRecommendations: string[];
    nextSteps: string[];
  };
  
  confidenceLevel: 'low' | 'medium' | 'high';
  lastUpdated: Date;
}

// Pro Business Report Interface
export interface ProBusinessReport {
  // Executive Summary
  executiveSummary: {
    businessOverview: string;
    missionStatement: string;
    visionStatement: string;
    keySuccessFactors: string[];
    investmentHighlights: string[];
  };

  // Company Description
  companyDescription: {
    businessModel: string;
    valueProposition: string;
    competitiveAdvantages: string[];
    businessStructure: string;
    ownershipStructure: string;
  };

  // Enhanced Market Analysis
  enhancedMarketAnalysis: {
    marketSize: string;
    marketGrowthRate: string;
    targetMarketSegments: string[];
    customerPersonas: Array<{
      name: string;
      demographics: string;
      painPoints: string[];
      buyingBehavior: string;
    }>;
    marketTrends: string[];
    competitiveLandscape: {
      directCompetitors: Array<{
        name: string;
        marketShare: string;
        strengths: string[];
        weaknesses: string[];
      }>;
      indirectCompetitors: string[];
      competitivePositioning: string;
    };
  };

  // Organization & Management
  organizationManagement: {
    organizationalStructure: string;
    keyPersonnel: Array<{
      role: string;
      responsibilities: string[];
      qualifications: string;
    }>;
    advisoryBoard: string[];
    hiringPlan: Array<{
      role: string;
      timeline: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    compensationStrategy: string;
  };

  // Product/Service Line
  productServiceLine: {
    productDescription: string;
    productLifecycle: string;
    researchDevelopment: string[];
    intellectualProperty: string[];
    productRoadmap: Array<{
      feature: string;
      timeline: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    qualityAssurance: string;
  };

  // Marketing & Sales Strategy
  marketingSalesStrategy: {
    marketingStrategy: string;
    salesStrategy: string;
    pricingStrategy: string;
    distributionChannels: string[];
    customerAcquisitionStrategy: string;
    customerRetentionStrategy: string;
    brandingStrategy: string;
    digitalMarketingPlan: string[];
  };

  // Financial Projections
  financialProjections: {
    revenueProjections: Array<{
      year: number;
      revenue: number;
      growth: number;
    }>;
    expenseProjections: Array<{
      year: number;
      expenses: number;
      breakdown: Record<string, number>;
    }>;
    profitabilityAnalysis: {
      grossMargin: number;
      netMargin: number;
      breakEvenPoint: string;
    };
    cashFlowProjections: Array<{
      year: number;
      cashFlow: number;
      cumulativeCashFlow: number;
    }>;
    fundingRequirements: {
      totalFunding: number;
      useOfFunds: Record<string, number>;
      fundingStages: Array<{
        stage: string;
        amount: number;
        timeline: string;
      }>;
    };
  };

  // Funding Opportunities
  fundingOpportunities: FundingOpportunity[];

  // Startup Resources & Tools
  startupResources: {
    legalResources: Array<{
      name: string;
      description: string;
      website: string;
      category: string;
    }>;
    accountingResources: Array<{
      name: string;
      description: string;
      website: string;
      category: string;
    }>;
    marketingTools: Array<{
      name: string;
      description: string;
      website: string;
      category: string;
    }>;
    technicalServices: Array<{
      name: string;
      description: string;
      website: string;
      category: string;
    }>;
  };

  // Domain Suggestions
  domainSuggestions: DomainSuggestion[];

  // Founder Matching
  founderMatches: FounderMatch[];

  // Metadata
  generatedAt: Date;
  lastUpdated: Date;
  version: string;
  confidenceScore: number;
}