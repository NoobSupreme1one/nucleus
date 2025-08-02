import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { ProReportGeneratorService } from '../services/pro-report-generator';
import { PrivacyManagerService } from '../services/privacy-manager';

// Mock the services
jest.mock('../services/pro-report-generator');
jest.mock('../services/privacy-manager');

describe('Pro Report API Endpoints', () => {
  let app: any;
  let prisma: PrismaClient;
  let mockUser: any;
  let mockIdea: any;

  beforeEach(async () => {
    // Setup test database and app
    prisma = new PrismaClient();
    
    // Create mock user and idea
    mockUser = {
      id: 'test-user-id',
      email: 'test@example.com',
      subscriptionTier: 'pro',
    };

    mockIdea = {
      id: 'test-idea-id',
      userId: 'test-user-id',
      title: 'Test Startup Idea',
      marketCategory: 'saas',
      problemDescription: 'Test problem',
      solutionDescription: 'Test solution',
      targetAudience: 'Test audience',
      validationScore: 85,
      analysisReport: {},
    };
  });

  afterEach(async () => {
    await prisma.$disconnect();
    jest.clearAllMocks();
  });

  describe('POST /api/ideas/:id/generate-pro-report', () => {
    it('should generate pro report for pro user', async () => {
      // Mock the ProReportGeneratorService
      const mockProReport = {
        executiveSummary: {
          businessOverview: 'Test overview',
          missionStatement: 'Test mission',
          visionStatement: 'Test vision',
          keySuccessFactors: ['Factor 1', 'Factor 2'],
          investmentHighlights: ['Highlight 1', 'Highlight 2'],
        },
        // ... other sections
        generatedAt: new Date(),
        lastUpdated: new Date(),
        version: '1.0',
        confidenceScore: 85,
      };

      (ProReportGeneratorService.prototype.generateProReport as jest.Mock)
        .mockResolvedValue(mockProReport);

      const response = await request(app)
        .post(`/api/ideas/${mockIdea.id}/generate-pro-report`)
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.proReport).toBeDefined();
      expect(response.body.proReport.executiveSummary).toBeDefined();
    });

    it('should reject non-pro users', async () => {
      const freeUser = { ...mockUser, subscriptionTier: 'free' };

      const response = await request(app)
        .post(`/api/ideas/${mockIdea.id}/generate-pro-report`)
        .set('Authorization', 'Bearer free-user-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SUBSCRIPTION_REQUIRED');
    });

    it('should reject unauthorized users', async () => {
      await request(app)
        .post(`/api/ideas/${mockIdea.id}/generate-pro-report`)
        .expect(401);
    });

    it('should reject access to other users ideas', async () => {
      const otherUserIdea = { ...mockIdea, userId: 'other-user-id' };

      const response = await request(app)
        .post(`/api/ideas/${otherUserIdea.id}/generate-pro-report`)
        .set('Authorization', 'Bearer valid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should handle non-existent ideas', async () => {
      const response = await request(app)
        .post('/api/ideas/non-existent-id/generate-pro-report')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('IDEA_NOT_FOUND');
    });

    it('should handle service errors gracefully', async () => {
      (ProReportGeneratorService.prototype.generateProReport as jest.Mock)
        .mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .post(`/api/ideas/${mockIdea.id}/generate-pro-report`)
        .set('Authorization', 'Bearer valid-token')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GENERATION_FAILED');
    });
  });

  describe('GET /api/users/privacy-settings', () => {
    it('should return user privacy settings', async () => {
      const mockPrivacySettings = {
        profilePublic: true,
        ideasPublic: true,
        allowFounderMatching: true,
        allowDirectContact: true,
      };

      (PrivacyManagerService.prototype.getUserPrivacySettings as jest.Mock)
        .mockResolvedValue(mockPrivacySettings);

      const response = await request(app)
        .get('/api/users/privacy-settings')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.privacySettings).toEqual(mockPrivacySettings);
    });

    it('should handle non-existent user', async () => {
      (PrivacyManagerService.prototype.getUserPrivacySettings as jest.Mock)
        .mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/privacy-settings')
        .set('Authorization', 'Bearer valid-token')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USER_NOT_FOUND');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/users/privacy-settings')
        .expect(401);
    });
  });

  describe('PUT /api/users/privacy-settings', () => {
    it('should update privacy settings', async () => {
      const updatedSettings = {
        profilePublic: false,
        ideasPublic: true,
        allowFounderMatching: false,
        allowDirectContact: true,
      };

      (PrivacyManagerService.prototype.validatePrivacySettings as jest.Mock)
        .mockReturnValue(true);
      (PrivacyManagerService.prototype.updatePrivacySettings as jest.Mock)
        .mockResolvedValue(updatedSettings);

      const response = await request(app)
        .put('/api/users/privacy-settings')
        .set('Authorization', 'Bearer valid-token')
        .send(updatedSettings)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.privacySettings).toEqual(updatedSettings);
    });

    it('should validate input data', async () => {
      const invalidSettings = {
        profilePublic: 'not-a-boolean',
        ideasPublic: true,
      };

      (PrivacyManagerService.prototype.validatePrivacySettings as jest.Mock)
        .mockReturnValue(false);

      const response = await request(app)
        .put('/api/users/privacy-settings')
        .set('Authorization', 'Bearer valid-token')
        .send(invalidSettings)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_INPUT');
    });

    it('should require authentication', async () => {
      await request(app)
        .put('/api/users/privacy-settings')
        .send({ profilePublic: true })
        .expect(401);
    });
  });
});

describe('Pro Report Service Integration Tests', () => {
  let proReportGenerator: ProReportGeneratorService;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    proReportGenerator = new ProReportGeneratorService(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should generate complete pro report', async () => {
    const mockUserId = 'test-user-id';
    const mockTitle = 'Test Startup';
    const mockMarketCategory = 'saas';
    const mockProblem = 'Test problem description';
    const mockSolution = 'Test solution description';
    const mockAudience = 'Test target audience';

    const proReport = await proReportGenerator.generateProReport(
      mockUserId,
      mockTitle,
      mockMarketCategory,
      mockProblem,
      mockSolution,
      mockAudience
    );

    // Verify all required sections are present
    expect(proReport.executiveSummary).toBeDefined();
    expect(proReport.companyDescription).toBeDefined();
    expect(proReport.enhancedMarketAnalysis).toBeDefined();
    expect(proReport.organizationManagement).toBeDefined();
    expect(proReport.productServiceLine).toBeDefined();
    expect(proReport.marketingSalesStrategy).toBeDefined();
    expect(proReport.financialProjections).toBeDefined();
    expect(proReport.fundingOpportunities).toBeDefined();
    expect(proReport.startupResources).toBeDefined();
    expect(proReport.domainSuggestions).toBeDefined();
    expect(proReport.founderMatches).toBeDefined();

    // Verify metadata
    expect(proReport.generatedAt).toBeInstanceOf(Date);
    expect(proReport.lastUpdated).toBeInstanceOf(Date);
    expect(proReport.version).toBe('1.0');
    expect(proReport.confidenceScore).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for AI generation

  it('should handle AI service failures gracefully', async () => {
    // Mock AI service failure
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const proReport = await proReportGenerator.generateProReport(
      'test-user-id',
      'Test Startup',
      'saas',
      'Problem',
      'Solution',
      'Audience'
    );

    // Should still return a report with fallback data
    expect(proReport).toBeDefined();
    expect(proReport.executiveSummary).toBeDefined();
    expect(proReport.executiveSummary.businessOverview).toContain('Test Startup');
  });
});

describe('Privacy Service Tests', () => {
  let privacyManager: PrivacyManagerService;
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
    privacyManager = new PrivacyManagerService(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should filter public profiles correctly', async () => {
    const mockUserIds = ['user1', 'user2', 'user3'];
    
    // Mock database responses
    jest.spyOn(prisma.user, 'findMany').mockResolvedValue([
      {
        id: 'user1',
        profilePublic: true,
        allowFounderMatching: true,
        // ... other user fields
      } as any,
    ]);

    const publicUsers = await privacyManager.filterPublicProfiles(mockUserIds);
    
    expect(publicUsers).toHaveLength(1);
    expect(publicUsers[0].id).toBe('user1');
  });

  it('should validate privacy settings input', () => {
    const validSettings = {
      profilePublic: true,
      ideasPublic: false,
      allowFounderMatching: true,
      allowDirectContact: false,
    };

    const invalidSettings = {
      profilePublic: 'not-boolean',
      invalidField: true,
    };

    expect(privacyManager.validatePrivacySettings(validSettings)).toBe(true);
    expect(privacyManager.validatePrivacySettings(invalidSettings)).toBe(false);
  });
});
