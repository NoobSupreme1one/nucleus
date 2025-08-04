import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import type { ProBusinessReport, MarketCategory } from '@shared/types';
import { DomainCheckerService } from './domain-checker';
import { FundingMatcherService } from './funding-matcher';
import { FounderMatcherService } from './founder-matcher';
import { PrismaClient } from '@prisma/client';

export class ProReportGeneratorService {
  private bedrockClient: BedrockRuntimeClient;
  private domainChecker: DomainCheckerService;
  private fundingMatcher: FundingMatcherService;
  private founderMatcher: FounderMatcherService;

  constructor(prisma: PrismaClient) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials are required');
    }
    
    this.bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'us-west-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    });
    this.domainChecker = new DomainCheckerService();
    this.fundingMatcher = new FundingMatcherService();
    this.founderMatcher = new FounderMatcherService(prisma);
  }

  /**
   * Helper method to invoke Bedrock Nova model
   */
  private async invokeBedrockModel(prompt: string): Promise<string> {
    const requestBody = {
      messages: [
        {
          role: "user",
          content: [{ text: prompt }]
        }
      ],
      inferenceConfig: {
        maxTokens: 4000,
        temperature: 0.7,
        topP: 0.9
      }
    };

    const command = new InvokeModelCommand({
      modelId: "amazon.nova-pro-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody)
    });

    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    return responseBody.output?.message?.content?.[0]?.text || '';
  }

  /**
   * Generate comprehensive pro business report
   */
  async generateProReport(
    userId: string,
    title: string,
    marketCategory: MarketCategory,
    problemDescription: string,
    solutionDescription: string,
    targetAudience: string
  ): Promise<ProBusinessReport> {
    try {
      console.log(`[Pro Report] Starting generation for: ${title}`);

      // Generate all sections in parallel where possible
      const [
        executiveSummary,
        companyDescription,
        enhancedMarketAnalysis,
        organizationManagement,
        productServiceLine,
        marketingSalesStrategy,
        financialProjections,
        fundingOpportunities,
        startupResources,
        domainSuggestions,
        founderMatches
      ] = await Promise.allSettled([
        this.generateExecutiveSummary(title, problemDescription, solutionDescription, targetAudience),
        this.generateCompanyDescription(title, solutionDescription, marketCategory),
        this.generateEnhancedMarketAnalysis(title, marketCategory, targetAudience, problemDescription),
        this.generateOrganizationManagement(marketCategory, solutionDescription),
        this.generateProductServiceLine(title, solutionDescription, marketCategory),
        this.generateMarketingSalesStrategy(title, targetAudience, marketCategory, solutionDescription),
        this.generateFinancialProjections(marketCategory, targetAudience, solutionDescription),
        this.fundingMatcher.findRelevantFunding(marketCategory, 'early'),
        this.generateStartupResources(marketCategory),
        this.domainChecker.generateDomainSuggestions(title, [marketCategory], marketCategory),
        this.founderMatcher.findSimilarFounders(userId, 5)
      ]);

      const report: ProBusinessReport = {
        executiveSummary: this.getSettledValue(executiveSummary, this.getDefaultExecutiveSummary(title)),
        companyDescription: this.getSettledValue(companyDescription, this.getDefaultCompanyDescription()),
        enhancedMarketAnalysis: this.getSettledValue(enhancedMarketAnalysis, this.getDefaultMarketAnalysis()),
        organizationManagement: this.getSettledValue(organizationManagement, this.getDefaultOrganizationManagement()),
        productServiceLine: this.getSettledValue(productServiceLine, this.getDefaultProductServiceLine()),
        marketingSalesStrategy: this.getSettledValue(marketingSalesStrategy, this.getDefaultMarketingSalesStrategy()),
        financialProjections: this.getSettledValue(financialProjections, this.getDefaultFinancialProjections()),
        fundingOpportunities: this.getSettledValue(fundingOpportunities, []),
        startupResources: this.getSettledValue(startupResources, this.getDefaultStartupResources()),
        domainSuggestions: this.getSettledValue(domainSuggestions, []),
        founderMatches: this.getSettledValue(founderMatches, []),
        generatedAt: new Date(),
        lastUpdated: new Date(),
        version: '1.0',
        confidenceScore: 85
      };

      console.log(`[Pro Report] Generation completed for: ${title}`);
      return report;
    } catch (error) {
      console.error('[Pro Report] Error generating pro report:', error);
      throw new Error('Failed to generate pro business report');
    }
  }

  /**
   * Generate executive summary using AI
   */
  async generateExecutiveSummary(
    title: string,
    problemDescription: string,
    solutionDescription: string,
    targetAudience: string
  ): Promise<ProBusinessReport['executiveSummary']> {
    const prompt = `
    Generate a comprehensive executive summary for the startup "${title}".
    
    Problem: ${problemDescription}
    Solution: ${solutionDescription}
    Target Audience: ${targetAudience}
    
    Please provide:
    1. Business Overview (2-3 sentences)
    2. Mission Statement (1 sentence)
    3. Vision Statement (1 sentence)
    4. Key Success Factors (3-5 bullet points)
    5. Investment Highlights (3-5 bullet points)
    
    Format as JSON with keys: businessOverview, missionStatement, visionStatement, keySuccessFactors (array), investmentHighlights (array)
    `;

    try {
      const response = await this.invokeBedrockModel(prompt);
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating executive summary:', error);
      return this.getDefaultExecutiveSummary(title);
    }
  }

  /**
   * Generate company description using AI
   */
  async generateCompanyDescription(
    title: string,
    solutionDescription: string,
    marketCategory: MarketCategory
  ): Promise<ProBusinessReport['companyDescription']> {
    

    const prompt = `
    Generate a detailed company description for "${title}" in the ${marketCategory} market.
    
    Solution: ${solutionDescription}
    
    Please provide:
    1. Business Model (detailed description)
    2. Value Proposition (clear statement)
    3. Competitive Advantages (3-5 points)
    4. Business Structure (recommended structure)
    5. Ownership Structure (recommended approach)
    
    Format as JSON with keys: businessModel, valueProposition, competitiveAdvantages (array), businessStructure, ownershipStructure
    `;

    try {
      const response = await this.invokeBedrockModel(prompt);
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating company description:', error);
      return this.getDefaultCompanyDescription();
    }
  }

  /**
   * Generate enhanced market analysis using AI
   */
  async generateEnhancedMarketAnalysis(
    title: string,
    marketCategory: MarketCategory,
    targetAudience: string,
    problemDescription: string
  ): Promise<ProBusinessReport['enhancedMarketAnalysis']> {
    

    const prompt = `
    Generate a comprehensive market analysis for "${title}" in the ${marketCategory} market.
    
    Target Audience: ${targetAudience}
    Problem: ${problemDescription}
    
    Please provide detailed analysis including:
    1. Market Size (with specific numbers if possible)
    2. Market Growth Rate (percentage)
    3. Target Market Segments (3-5 segments)
    4. Customer Personas (2-3 detailed personas with name, demographics, painPoints, buyingBehavior)
    5. Market Trends (5-7 current trends)
    6. Competitive Landscape with directCompetitors (3-5 competitors with name, marketShare, strengths, weaknesses), indirectCompetitors (3-5), and competitivePositioning
    
    Format as JSON matching the structure needed.
    `;

    try {
      const response = await this.invokeBedrockModel(prompt);
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating market analysis:', error);
      return this.getDefaultMarketAnalysis();
    }
  }

  /**
   * Generate organization management structure using AI
   */
  async generateOrganizationManagement(
    marketCategory: MarketCategory,
    solutionDescription: string
  ): Promise<ProBusinessReport['organizationManagement']> {
    

    const prompt = `
    Generate an organization and management plan for a ${marketCategory} startup.
    
    Solution: ${solutionDescription}
    
    Please provide:
    1. Organizational Structure (description)
    2. Key Personnel (3-5 roles with role, responsibilities array, qualifications)
    3. Advisory Board (3-5 suggested advisor types)
    4. Hiring Plan (5-7 roles with role, timeline, priority)
    5. Compensation Strategy (description)
    
    Format as JSON with the exact structure needed.
    `;

    try {
      const response = await this.invokeBedrockModel(prompt);
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating organization management:', error);
      return this.getDefaultOrganizationManagement();
    }
  }

  /**
   * Helper method to safely extract values from settled promises
   */
  private getSettledValue<T>(settledResult: PromiseSettledResult<T>, defaultValue: T): T {
    return settledResult.status === 'fulfilled' ? settledResult.value : defaultValue;
  }

  // Default fallback methods
  private getDefaultExecutiveSummary(title: string): ProBusinessReport['executiveSummary'] {
    return {
      businessOverview: `${title} is an innovative startup addressing market needs through technology-driven solutions.`,
      missionStatement: `To provide exceptional value to our customers through innovative solutions.`,
      visionStatement: `To become a leading player in our market category.`,
      keySuccessFactors: [
        'Strong product-market fit',
        'Experienced founding team',
        'Scalable business model',
        'Clear competitive advantages'
      ],
      investmentHighlights: [
        'Large addressable market',
        'Proven business model',
        'Strong growth potential',
        'Experienced team'
      ]
    };
  }

  private getDefaultCompanyDescription(): ProBusinessReport['companyDescription'] {
    return {
      businessModel: 'Subscription-based SaaS model with tiered pricing',
      valueProposition: 'Delivering exceptional value through innovative technology solutions',
      competitiveAdvantages: [
        'First-mover advantage',
        'Superior technology',
        'Strong team',
        'Customer focus'
      ],
      businessStructure: 'Delaware C-Corporation',
      ownershipStructure: 'Founder equity with employee stock option plan'
    };
  }

  private getDefaultMarketAnalysis(): ProBusinessReport['enhancedMarketAnalysis'] {
    return {
      marketSize: '$10B+ addressable market',
      marketGrowthRate: '15-20% annually',
      targetMarketSegments: ['Early adopters', 'SMB market', 'Enterprise clients'],
      customerPersonas: [
        {
          name: 'Tech-Savvy Professional',
          demographics: '25-45 years old, urban, college-educated',
          painPoints: ['Time constraints', 'Efficiency needs', 'Cost concerns'],
          buyingBehavior: 'Research-driven, values ROI'
        }
      ],
      marketTrends: ['Digital transformation', 'Remote work adoption', 'AI integration'],
      competitiveLandscape: {
        directCompetitors: [],
        indirectCompetitors: ['Traditional solutions', 'Manual processes'],
        competitivePositioning: 'Innovative technology leader'
      }
    };
  }

  private getDefaultOrganizationManagement(): ProBusinessReport['organizationManagement'] {
    return {
      organizationalStructure: 'Flat organizational structure with clear reporting lines',
      keyPersonnel: [
        {
          role: 'CEO',
          responsibilities: ['Strategic vision', 'Fundraising', 'Team leadership'],
          qualifications: 'Proven leadership experience in relevant industry'
        }
      ],
      advisoryBoard: ['Industry expert', 'Technical advisor', 'Business mentor'],
      hiringPlan: [
        {
          role: 'CTO',
          timeline: '0-3 months',
          priority: 'high'
        }
      ],
      compensationStrategy: 'Competitive salaries with equity participation'
    };
  }

  private getDefaultProductServiceLine(): ProBusinessReport['productServiceLine'] {
    return {
      productDescription: 'Innovative technology solution addressing market needs',
      productLifecycle: 'Early development stage with MVP completed',
      researchDevelopment: ['Continuous product improvement', 'Feature development'],
      intellectualProperty: ['Proprietary algorithms', 'Trade secrets'],
      productRoadmap: [
        {
          feature: 'Core functionality',
          timeline: 'Q1 2025',
          priority: 'high'
        }
      ],
      qualityAssurance: 'Comprehensive testing and quality control processes'
    };
  }

  private getDefaultMarketingSalesStrategy(): ProBusinessReport['marketingSalesStrategy'] {
    return {
      marketingStrategy: 'Digital-first marketing approach with content marketing focus',
      salesStrategy: 'Inside sales model with customer success focus',
      pricingStrategy: 'Value-based pricing with tiered options',
      distributionChannels: ['Direct sales', 'Online platform', 'Partner channels'],
      customerAcquisitionStrategy: 'Inbound marketing and referral programs',
      customerRetentionStrategy: 'Exceptional customer service and continuous value delivery',
      brandingStrategy: 'Professional, trustworthy, innovative brand positioning',
      digitalMarketingPlan: ['SEO optimization', 'Content marketing', 'Social media presence']
    };
  }

  private getDefaultFinancialProjections(): ProBusinessReport['financialProjections'] {
    return {
      revenueProjections: [
        { year: 1, revenue: 100000, growth: 0 },
        { year: 2, revenue: 500000, growth: 400 },
        { year: 3, revenue: 1500000, growth: 200 }
      ],
      expenseProjections: [
        { year: 1, expenses: 150000, breakdown: { personnel: 100000, marketing: 30000, operations: 20000 } }
      ],
      profitabilityAnalysis: {
        grossMargin: 80,
        netMargin: 20,
        breakEvenPoint: 'Month 18'
      },
      cashFlowProjections: [
        { year: 1, cashFlow: -50000, cumulativeCashFlow: -50000 }
      ],
      fundingRequirements: {
        totalFunding: 500000,
        useOfFunds: { product: 200000, marketing: 150000, operations: 150000 },
        fundingStages: [
          { stage: 'Seed', amount: 500000, timeline: 'Q1 2025' }
        ]
      }
    };
  }

  /**
   * Generate product service line using AI
   */
  async generateProductServiceLine(
    title: string,
    solutionDescription: string,
    marketCategory: MarketCategory
  ): Promise<ProBusinessReport['productServiceLine']> {
    

    const prompt = `
    Generate a detailed product/service line analysis for "${title}" in the ${marketCategory} market.

    Solution: ${solutionDescription}

    Please provide:
    1. Product Description (detailed overview)
    2. Product Lifecycle (current stage and future stages)
    3. Research & Development (3-5 R&D priorities)
    4. Intellectual Property (potential IP assets)
    5. Product Roadmap (5-7 features with feature, timeline, priority)
    6. Quality Assurance (QA approach)

    Format as JSON with exact structure needed.
    `;

    try {
      const response = await this.invokeBedrockModel(prompt);
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating product service line:', error);
      return this.getDefaultProductServiceLine();
    }
  }

  /**
   * Generate marketing and sales strategy using AI
   */
  async generateMarketingSalesStrategy(
    title: string,
    targetAudience: string,
    marketCategory: MarketCategory,
    solutionDescription: string
  ): Promise<ProBusinessReport['marketingSalesStrategy']> {
    

    const prompt = `
    Generate a comprehensive marketing and sales strategy for "${title}" targeting ${targetAudience} in the ${marketCategory} market.

    Solution: ${solutionDescription}

    Please provide:
    1. Marketing Strategy (overall approach)
    2. Sales Strategy (sales approach and process)
    3. Pricing Strategy (pricing model and rationale)
    4. Distribution Channels (3-5 channels)
    5. Customer Acquisition Strategy (detailed approach)
    6. Customer Retention Strategy (retention tactics)
    7. Branding Strategy (brand positioning)
    8. Digital Marketing Plan (5-7 digital tactics)

    Format as JSON with exact structure needed.
    `;

    try {
      const response = await this.invokeBedrockModel(prompt);
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating marketing sales strategy:', error);
      return this.getDefaultMarketingSalesStrategy();
    }
  }

  /**
   * Generate financial projections using AI
   */
  async generateFinancialProjections(
    marketCategory: MarketCategory,
    targetAudience: string,
    solutionDescription: string
  ): Promise<ProBusinessReport['financialProjections']> {
    

    const prompt = `
    Generate realistic financial projections for a ${marketCategory} startup targeting ${targetAudience}.

    Solution: ${solutionDescription}

    Please provide:
    1. Revenue Projections (3 years with year, revenue, growth percentage)
    2. Expense Projections (3 years with year, expenses, breakdown object)
    3. Profitability Analysis (grossMargin, netMargin percentages, breakEvenPoint)
    4. Cash Flow Projections (3 years with year, cashFlow, cumulativeCashFlow)
    5. Funding Requirements (totalFunding, useOfFunds object, fundingStages array)

    Use realistic numbers based on typical ${marketCategory} startups.
    Format as JSON with exact structure needed.
    `;

    try {
      const response = await this.invokeBedrockModel(prompt);
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating financial projections:', error);
      return this.getDefaultFinancialProjections();
    }
  }

  /**
   * Generate startup resources based on market category
   */
  async generateStartupResources(marketCategory: MarketCategory): Promise<ProBusinessReport['startupResources']> {
    const baseResources = this.getDefaultStartupResources();

    // Add category-specific resources
    const categoryResources = this.getCategorySpecificResources(marketCategory);

    return {
      legalResources: [...baseResources.legalResources, ...categoryResources.legal],
      accountingResources: [...baseResources.accountingResources, ...categoryResources.accounting],
      marketingTools: [...baseResources.marketingTools, ...categoryResources.marketing],
      technicalServices: [...baseResources.technicalServices, ...categoryResources.technical]
    };
  }

  /**
   * Get category-specific resources
   */
  private getCategorySpecificResources(marketCategory: MarketCategory) {
    const categoryMap: Record<MarketCategory, any> = {
      saas: {
        legal: [{ name: 'SaaS Legal Templates', description: 'SaaS-specific legal documents', website: 'https://saaslegaltemplates.com', category: 'Legal' }],
        accounting: [{ name: 'ChartMogul', description: 'SaaS metrics and analytics', website: 'https://chartmogul.com', category: 'Accounting' }],
        marketing: [{ name: 'Intercom', description: 'Customer messaging platform', website: 'https://intercom.com', category: 'Marketing' }],
        technical: [{ name: 'Stripe', description: 'Payment processing for SaaS', website: 'https://stripe.com', category: 'Technical' }]
      },
      fintech: {
        legal: [{ name: 'FinTech Legal Advisors', description: 'Financial services compliance', website: 'https://fintechlegal.com', category: 'Legal' }],
        accounting: [{ name: 'Pilot', description: 'Bookkeeping for startups', website: 'https://pilot.com', category: 'Accounting' }],
        marketing: [{ name: 'Segment', description: 'Customer data platform', website: 'https://segment.com', category: 'Marketing' }],
        technical: [{ name: 'Plaid', description: 'Financial data APIs', website: 'https://plaid.com', category: 'Technical' }]
      },
      healthtech: {
        legal: [{ name: 'HIPAA Compliance', description: 'Healthcare compliance services', website: 'https://hipaacompliance.com', category: 'Legal' }],
        accounting: [{ name: 'Healthcare CFO', description: 'Healthcare financial services', website: 'https://healthcarecfo.com', category: 'Accounting' }],
        marketing: [{ name: 'Healthcare Marketing', description: 'Healthcare-focused marketing', website: 'https://healthcaremarketing.com', category: 'Marketing' }],
        technical: [{ name: 'Epic', description: 'Healthcare software integration', website: 'https://epic.com', category: 'Technical' }]
      },
      edtech: {
        legal: [{ name: 'EdTech Legal', description: 'Education technology compliance', website: 'https://edtechlegal.com', category: 'Legal' }],
        accounting: [{ name: 'EdTech Accounting', description: 'Education sector accounting', website: 'https://edtechaccounting.com', category: 'Accounting' }],
        marketing: [{ name: 'EdTech Marketing', description: 'Education marketing specialists', website: 'https://edtechmarketing.com', category: 'Marketing' }],
        technical: [{ name: 'Canvas API', description: 'Learning management integration', website: 'https://canvas.instructure.com', category: 'Technical' }]
      },
      ecommerce: {
        legal: [{ name: 'E-commerce Legal', description: 'Online retail legal services', website: 'https://ecommercelegal.com', category: 'Legal' }],
        accounting: [{ name: 'A2X', description: 'E-commerce accounting automation', website: 'https://a2x.com', category: 'Accounting' }],
        marketing: [{ name: 'Klaviyo', description: 'E-commerce email marketing', website: 'https://klaviyo.com', category: 'Marketing' }],
        technical: [{ name: 'Shopify', description: 'E-commerce platform', website: 'https://shopify.com', category: 'Technical' }]
      },
      other: {
        legal: [],
        accounting: [],
        marketing: [],
        technical: []
      }
    };

    return categoryMap[marketCategory] || categoryMap.other;
  }

  private getDefaultStartupResources(): ProBusinessReport['startupResources'] {
    return {
      legalResources: [
        {
          name: 'Clerky',
          description: 'Corporate formation and equity management',
          website: 'https://clerky.com',
          category: 'Legal'
        }
      ],
      accountingResources: [
        {
          name: 'QuickBooks',
          description: 'Accounting and bookkeeping software',
          website: 'https://quickbooks.intuit.com',
          category: 'Accounting'
        }
      ],
      marketingTools: [
        {
          name: 'HubSpot',
          description: 'CRM and marketing automation',
          website: 'https://hubspot.com',
          category: 'Marketing'
        }
      ],
      technicalServices: [
        {
          name: 'AWS',
          description: 'Cloud computing services',
          website: 'https://aws.amazon.com',
          category: 'Technical'
        }
      ]
    };
  }
}
