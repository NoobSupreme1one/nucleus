import type { FundingOpportunity, MarketCategory } from '@shared/types';

export class FundingMatcherService {
  private fundingOpportunities: FundingOpportunity[] = [];

  constructor() {
    this.initializeFundingDatabase();
  }

  /**
   * Find relevant funding opportunities based on market category and stage
   */
  async findRelevantFunding(
    marketCategory: MarketCategory,
    businessStage: 'idea' | 'mvp' | 'early' | 'growth' | 'scale',
    fundingAmount?: number
  ): Promise<FundingOpportunity[]> {
    try {
      const relevantOpportunities = this.fundingOpportunities.filter(opportunity => {
        // Check market category match
        const categoryMatch = opportunity.marketCategories.includes(marketCategory) || 
                             opportunity.marketCategories.includes('other' as MarketCategory);
        
        // Check stage match
        const stageMatch = opportunity.stage.includes(businessStage);
        
        return categoryMatch && stageMatch;
      });

      // Calculate match scores
      const scoredOpportunities = relevantOpportunities.map(opportunity => ({
        ...opportunity,
        matchScore: this.calculateMatchScore(opportunity, marketCategory, businessStage, fundingAmount),
      }));

      // Sort by match score and return top matches
      return scoredOpportunities
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 10);
    } catch (error) {
      console.error('Error finding relevant funding:', error);
      return [];
    }
  }

  /**
   * Calculate match score for funding opportunity
   */
  private calculateMatchScore(
    opportunity: FundingOpportunity,
    marketCategory: MarketCategory,
    businessStage: string,
    fundingAmount?: number
  ): number {
    let score = 0;

    // Market category match (40% weight)
    if (opportunity.marketCategories.includes(marketCategory)) {
      score += 40;
    } else if (opportunity.marketCategories.includes('other' as MarketCategory)) {
      score += 20;
    }

    // Stage match (30% weight)
    if (opportunity.stage.includes(businessStage)) {
      score += 30;
    }

    // Funding amount match (20% weight)
    if (fundingAmount && opportunity.amount) {
      const amountMatch = this.calculateAmountMatch(opportunity.amount, fundingAmount);
      score += amountMatch * 20;
    } else {
      score += 10; // Default if no amount specified
    }

    // Application deadline (10% weight)
    if (opportunity.applicationDeadline) {
      const deadlineScore = this.calculateDeadlineScore(opportunity.applicationDeadline);
      score += deadlineScore * 10;
    } else {
      score += 10; // Always open applications
    }

    return Math.min(100, score);
  }

  /**
   * Calculate amount match score (0-1)
   */
  private calculateAmountMatch(opportunityAmount: string, requestedAmount: number): number {
    const amount = this.parseAmount(opportunityAmount);
    if (!amount) return 0.5;

    const ratio = Math.min(amount, requestedAmount) / Math.max(amount, requestedAmount);
    return ratio;
  }

  /**
   * Calculate deadline score (0-1)
   */
  private calculateDeadlineScore(deadline: string): number {
    try {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const daysUntilDeadline = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysUntilDeadline < 0) return 0; // Past deadline
      if (daysUntilDeadline > 365) return 0.5; // Too far in future
      if (daysUntilDeadline > 30) return 1; // Good timing
      if (daysUntilDeadline > 7) return 0.8; // Tight but doable
      return 0.3; // Very tight deadline
    } catch {
      return 0.5;
    }
  }

  /**
   * Parse funding amount from string
   */
  private parseAmount(amountStr: string): number | null {
    const match = amountStr.match(/\$?([\d,]+)(?:k|K)?/);
    if (!match) return null;
    
    const num = parseInt(match[1].replace(/,/g, ''));
    return amountStr.toLowerCase().includes('k') ? num * 1000 : num;
  }

  /**
   * Initialize funding opportunities database
   */
  private initializeFundingDatabase(): void {
    this.fundingOpportunities = [
      // Government Grants
      {
        id: 'sbir-1',
        name: 'SBIR Phase I',
        type: 'government',
        description: 'Small Business Innovation Research grants for early-stage R&D',
        amount: '$50,000-$300,000',
        stage: ['idea', 'mvp', 'early'],
        marketCategories: ['saas', 'healthtech', 'edtech', 'fintech', 'other'],
        applicationDeadline: '2025-03-15',
        website: 'https://www.sbir.gov',
        requirements: [
          'US-based small business',
          'Innovative technology focus',
          'Research and development plan',
          'Commercialization potential'
        ],
        matchScore: 0
      },
      {
        id: 'sbir-2',
        name: 'SBIR Phase II',
        type: 'government',
        description: 'Follow-on funding for successful Phase I recipients',
        amount: '$500,000-$2,000,000',
        stage: ['mvp', 'early', 'growth'],
        marketCategories: ['saas', 'healthtech', 'edtech', 'fintech', 'other'],
        website: 'https://www.sbir.gov',
        requirements: [
          'Successful Phase I completion',
          'Demonstrated feasibility',
          'Clear commercialization path',
          'Market validation'
        ],
        matchScore: 0
      },
      // Accelerators
      {
        id: 'ycombinator',
        name: 'Y Combinator',
        type: 'accelerator',
        description: 'Premier startup accelerator with $500K investment',
        amount: '$500,000',
        stage: ['idea', 'mvp', 'early'],
        marketCategories: ['saas', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'other'],
        applicationDeadline: '2025-04-01',
        website: 'https://www.ycombinator.com',
        requirements: [
          'Innovative product or service',
          'Strong founding team',
          'Market opportunity',
          'Growth potential'
        ],
        matchScore: 0
      },
      {
        id: 'techstars',
        name: 'Techstars',
        type: 'accelerator',
        description: 'Global startup accelerator network',
        amount: '$120,000',
        stage: ['mvp', 'early'],
        marketCategories: ['saas', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'other'],
        website: 'https://www.techstars.com',
        requirements: [
          'Working product or prototype',
          'Committed founding team',
          'Scalable business model',
          'Coachable founders'
        ],
        matchScore: 0
      },
      // Venture Capital
      {
        id: 'sequoia-seed',
        name: 'Sequoia Capital Seed',
        type: 'vc',
        description: 'Seed funding from top-tier VC firm',
        amount: '$1,000,000-$5,000,000',
        stage: ['early', 'growth'],
        marketCategories: ['saas', 'ecommerce', 'fintech', 'healthtech', 'edtech'],
        website: 'https://www.sequoiacap.com',
        requirements: [
          'Exceptional founding team',
          'Large market opportunity',
          'Product-market fit',
          'Strong growth metrics'
        ],
        matchScore: 0
      },
      {
        id: 'a16z-seed',
        name: 'Andreessen Horowitz Seed',
        type: 'vc',
        description: 'Seed investment from a16z',
        amount: '$500,000-$3,000,000',
        stage: ['early', 'growth'],
        marketCategories: ['saas', 'fintech', 'healthtech', 'edtech', 'other'],
        website: 'https://a16z.com',
        requirements: [
          'Technology-driven solution',
          'Experienced team',
          'Market validation',
          'Scalability potential'
        ],
        matchScore: 0
      },
      // Angel Investors
      {
        id: 'angellist',
        name: 'AngelList Syndicates',
        type: 'angel',
        description: 'Angel investor network and syndicates',
        amount: '$25,000-$500,000',
        stage: ['idea', 'mvp', 'early'],
        marketCategories: ['saas', 'ecommerce', 'fintech', 'healthtech', 'edtech', 'other'],
        website: 'https://angel.co',
        requirements: [
          'Compelling pitch deck',
          'Clear business model',
          'Market opportunity',
          'Team credentials'
        ],
        matchScore: 0
      },
      // Industry-Specific
      {
        id: 'health-tech-capital',
        name: 'HealthTech Capital',
        type: 'vc',
        description: 'Specialized healthcare technology investor',
        amount: '$1,000,000-$10,000,000',
        stage: ['early', 'growth', 'scale'],
        marketCategories: ['healthtech'],
        website: 'https://healthtechcapital.com',
        requirements: [
          'Healthcare technology focus',
          'Regulatory compliance plan',
          'Clinical validation',
          'Market access strategy'
        ],
        matchScore: 0
      },
      {
        id: 'fintech-ventures',
        name: 'FinTech Ventures',
        type: 'vc',
        description: 'Financial technology focused investment',
        amount: '$500,000-$5,000,000',
        stage: ['mvp', 'early', 'growth'],
        marketCategories: ['fintech'],
        website: 'https://fintechventures.com',
        requirements: [
          'Financial services innovation',
          'Regulatory compliance',
          'Security standards',
          'Market traction'
        ],
        matchScore: 0
      },
      // Crowdfunding
      {
        id: 'kickstarter',
        name: 'Kickstarter',
        type: 'crowdfunding',
        description: 'Reward-based crowdfunding platform',
        amount: '$10,000-$1,000,000',
        stage: ['mvp', 'early'],
        marketCategories: ['ecommerce', 'other'],
        website: 'https://www.kickstarter.com',
        requirements: [
          'Creative project',
          'Compelling rewards',
          'Marketing plan',
          'Prototype or demo'
        ],
        matchScore: 0
      },
      {
        id: 'indiegogo',
        name: 'Indiegogo',
        type: 'crowdfunding',
        description: 'Flexible crowdfunding platform',
        amount: '$5,000-$500,000',
        stage: ['idea', 'mvp', 'early'],
        marketCategories: ['ecommerce', 'healthtech', 'other'],
        website: 'https://www.indiegogo.com',
        requirements: [
          'Innovative product',
          'Clear value proposition',
          'Marketing strategy',
          'Community engagement'
        ],
        matchScore: 0
      }
    ];
  }

  /**
   * Get all funding opportunities
   */
  getAllFundingOpportunities(): FundingOpportunity[] {
    return this.fundingOpportunities;
  }

  /**
   * Get funding opportunities by type
   */
  getFundingByType(type: FundingOpportunity['type']): FundingOpportunity[] {
    return this.fundingOpportunities.filter(opportunity => opportunity.type === type);
  }

  /**
   * Search funding opportunities by name or description
   */
  searchFunding(query: string): FundingOpportunity[] {
    const lowercaseQuery = query.toLowerCase();
    return this.fundingOpportunities.filter(opportunity =>
      opportunity.name.toLowerCase().includes(lowercaseQuery) ||
      opportunity.description.toLowerCase().includes(lowercaseQuery)
    );
  }
}
