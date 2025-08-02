import { test, expect, Page } from '@playwright/test';

test.describe('Pro Report Generation E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Mock authentication for pro user
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-id',
          email: 'pro@example.com',
          firstName: 'Pro',
          lastName: 'User',
          subscriptionTier: 'pro',
        }),
      });
    });

    // Mock idea data
    await page.route('**/api/ideas/*', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-idea-id',
            title: 'AI-Powered Task Manager',
            marketCategory: 'saas',
            problemDescription: 'People struggle with task management',
            solutionDescription: 'AI-powered task prioritization',
            targetAudience: 'Busy professionals',
            validationScore: 85,
            analysisReport: {
              marketSize: 'Large',
              competitionLevel: 'Medium',
              // ... other analysis data
            },
          }),
        });
      }
    });
  });

  test('should display pro report generation button for pro users', async () => {
    await page.goto('/validation-results/test-idea-id');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="validation-results"]');
    
    // Check that pro report button is visible
    const proReportButton = page.locator('[data-testid="generate-pro-report-btn"]');
    await expect(proReportButton).toBeVisible();
    await expect(proReportButton).toContainText('Generate Pro Report');
  });

  test('should generate and display pro report', async () => {
    // Mock pro report generation API
    await page.route('**/api/ideas/*/generate-pro-report', async route => {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          proReport: {
            executiveSummary: {
              businessOverview: 'AI-Powered Task Manager is an innovative startup addressing productivity challenges.',
              missionStatement: 'To revolutionize task management through AI.',
              visionStatement: 'To become the leading AI task management platform.',
              keySuccessFactors: ['AI technology', 'User experience', 'Market timing'],
              investmentHighlights: ['Large market', 'Strong team', 'Proven traction'],
            },
            companyDescription: {
              businessModel: 'SaaS subscription model',
              valueProposition: 'AI-powered task prioritization',
              competitiveAdvantages: ['Advanced AI', 'Intuitive UI', 'Integration capabilities'],
              businessStructure: 'Delaware C-Corporation',
              ownershipStructure: 'Founder equity with ESOP',
            },
            enhancedMarketAnalysis: {
              marketSize: '$50B global productivity software market',
              marketGrowthRate: '12% annually',
              targetMarketSegments: ['SMB', 'Enterprise', 'Individual users'],
              customerPersonas: [
                {
                  name: 'Busy Executive',
                  demographics: '35-50 years old, high income',
                  painPoints: ['Too many tasks', 'Poor prioritization'],
                  buyingBehavior: 'Values efficiency and ROI',
                },
              ],
              marketTrends: ['AI adoption', 'Remote work', 'Productivity focus'],
              competitiveLandscape: {
                directCompetitors: [
                  {
                    name: 'Todoist',
                    marketShare: '15%',
                    strengths: ['Brand recognition', 'Feature set'],
                    weaknesses: ['Limited AI', 'Complex pricing'],
                  },
                ],
                indirectCompetitors: ['Notion', 'Asana', 'Monday.com'],
                competitivePositioning: 'AI-first task management solution',
              },
            },
            organizationManagement: {
              organizationalStructure: 'Flat structure with clear roles',
              keyPersonnel: [
                {
                  role: 'CEO',
                  responsibilities: ['Strategy', 'Fundraising', 'Leadership'],
                  qualifications: 'MBA with 10+ years experience',
                },
              ],
              advisoryBoard: ['AI expert', 'SaaS veteran', 'Marketing guru'],
              hiringPlan: [
                {
                  role: 'CTO',
                  timeline: '0-3 months',
                  priority: 'high',
                },
              ],
              compensationStrategy: 'Competitive salaries with equity',
            },
            productServiceLine: {
              productDescription: 'AI-powered task management platform',
              productLifecycle: 'MVP stage with beta users',
              researchDevelopment: ['AI improvements', 'Mobile app', 'Integrations'],
              intellectualProperty: ['AI algorithms', 'UI patents'],
              productRoadmap: [
                {
                  feature: 'Advanced AI prioritization',
                  timeline: 'Q1 2025',
                  priority: 'high',
                },
              ],
              qualityAssurance: 'Automated testing with user feedback loops',
            },
            marketingSalesStrategy: {
              marketingStrategy: 'Content marketing and SEO focus',
              salesStrategy: 'Product-led growth with inside sales',
              pricingStrategy: 'Freemium with premium tiers',
              distributionChannels: ['Direct web', 'App stores', 'Partnerships'],
              customerAcquisitionStrategy: 'Inbound marketing and referrals',
              customerRetentionStrategy: 'Onboarding and customer success',
              brandingStrategy: 'Professional, innovative, trustworthy',
              digitalMarketingPlan: ['SEO', 'Content', 'Social media', 'PPC'],
            },
            financialProjections: {
              revenueProjections: [
                { year: 1, revenue: 100000, growth: 0 },
                { year: 2, revenue: 500000, growth: 400 },
                { year: 3, revenue: 1500000, growth: 200 },
              ],
              expenseProjections: [
                {
                  year: 1,
                  expenses: 150000,
                  breakdown: { personnel: 100000, marketing: 30000, operations: 20000 },
                },
              ],
              profitabilityAnalysis: {
                grossMargin: 80,
                netMargin: 20,
                breakEvenPoint: 'Month 18',
              },
              cashFlowProjections: [
                { year: 1, cashFlow: -50000, cumulativeCashFlow: -50000 },
              ],
              fundingRequirements: {
                totalFunding: 500000,
                useOfFunds: { product: 200000, marketing: 150000, operations: 150000 },
                fundingStages: [
                  { stage: 'Seed', amount: 500000, timeline: 'Q1 2025' },
                ],
              },
            },
            fundingOpportunities: [
              {
                id: 'ycombinator',
                name: 'Y Combinator',
                type: 'accelerator',
                description: 'Premier startup accelerator',
                amount: '$500,000',
                stage: ['early'],
                marketCategories: ['saas'],
                website: 'https://ycombinator.com',
                requirements: ['Strong team', 'Market opportunity'],
                matchScore: 85,
              },
            ],
            startupResources: {
              legalResources: [
                {
                  name: 'Clerky',
                  description: 'Corporate formation',
                  website: 'https://clerky.com',
                  category: 'Legal',
                },
              ],
              accountingResources: [
                {
                  name: 'QuickBooks',
                  description: 'Accounting software',
                  website: 'https://quickbooks.com',
                  category: 'Accounting',
                },
              ],
              marketingTools: [
                {
                  name: 'HubSpot',
                  description: 'CRM and marketing',
                  website: 'https://hubspot.com',
                  category: 'Marketing',
                },
              ],
              technicalServices: [
                {
                  name: 'AWS',
                  description: 'Cloud services',
                  website: 'https://aws.amazon.com',
                  category: 'Technical',
                },
              ],
            },
            domainSuggestions: [
              {
                domain: 'aitaskmanager.com',
                available: true,
                price: 12.99,
                registrar: 'Namecheap',
              },
            ],
            founderMatches: [
              {
                user: {
                  id: 'founder-1',
                  firstName: 'Jane',
                  lastName: 'Smith',
                  role: 'designer',
                  bio: 'UX designer with 5 years experience',
                },
                matchScore: 85,
                commonInterests: ['SaaS', 'AI'],
                complementarySkills: ['Engineering + Design combination'],
                sharedMarketCategories: ['saas'],
                contactAllowed: true,
              },
            ],
            generatedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            version: '1.0',
            confidenceScore: 85,
          },
        }),
      });
    });

    await page.goto('/validation-results/test-idea-id');
    
    // Click generate pro report button
    await page.click('[data-testid="generate-pro-report-btn"]');
    
    // Check loading state
    await expect(page.locator('[data-testid="pro-report-loading"]')).toBeVisible();
    await expect(page.locator('[data-testid="pro-report-loading"]')).toContainText('Generating');
    
    // Wait for pro report to be generated and displayed
    await page.waitForSelector('[data-testid="pro-report-display"]', { timeout: 10000 });
    
    // Verify pro report sections are displayed
    await expect(page.locator('text=Pro Business Report')).toBeVisible();
    await expect(page.locator('text=1. Executive Summary')).toBeVisible();
    await expect(page.locator('text=2. Company Description')).toBeVisible();
    await expect(page.locator('text=3. Enhanced Market Analysis')).toBeVisible();
    await expect(page.locator('text=7. Financial Projections')).toBeVisible();
    
    // Check specific content
    await expect(page.locator('text=AI-Powered Task Manager is an innovative startup')).toBeVisible();
    await expect(page.locator('text=$100,000')).toBeVisible(); // Revenue projection
    await expect(page.locator('text=Y Combinator')).toBeVisible(); // Funding opportunity
  });

  test('should show upgrade prompt for free users', async () => {
    // Mock free user
    await page.route('**/api/auth/me', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'free-user-id',
          email: 'free@example.com',
          subscriptionTier: 'free',
        }),
      });
    });

    await page.goto('/validation-results/test-idea-id');
    
    // Should show upgrade button instead of generate button
    const upgradeButton = page.locator('[data-testid="upgrade-to-pro-btn"]');
    await expect(upgradeButton).toBeVisible();
    await expect(upgradeButton).toContainText('Upgrade to Pro');
    
    // Should not show generate pro report button
    const proReportButton = page.locator('[data-testid="generate-pro-report-btn"]');
    await expect(proReportButton).not.toBeVisible();
  });

  test('should handle pro report generation errors', async () => {
    // Mock API error
    await page.route('**/api/ideas/*/generate-pro-report', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            code: 'GENERATION_FAILED',
            message: 'Failed to generate pro report',
          },
        }),
      });
    });

    await page.goto('/validation-results/test-idea-id');
    
    // Click generate pro report button
    await page.click('[data-testid="generate-pro-report-btn"]');
    
    // Wait for error message
    await page.waitForSelector('[data-testid="error-message"]');
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to generate');
    
    // Should show retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should allow printing and exporting pro report', async () => {
    // Generate pro report first (using previous mock)
    await page.route('**/api/ideas/*/generate-pro-report', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          proReport: {
            // Minimal pro report data for this test
            executiveSummary: { businessOverview: 'Test' },
            generatedAt: new Date().toISOString(),
            version: '1.0',
            confidenceScore: 85,
          },
        }),
      });
    });

    await page.goto('/validation-results/test-idea-id');
    await page.click('[data-testid="generate-pro-report-btn"]');
    await page.waitForSelector('[data-testid="pro-report-display"]');
    
    // Check print button
    const printButton = page.locator('[data-testid="print-report-btn"]');
    await expect(printButton).toBeVisible();
    
    // Check export PDF button
    const exportButton = page.locator('[data-testid="export-pdf-btn"]');
    await expect(exportButton).toBeVisible();
  });

  test('should navigate through report sections', async () => {
    // Generate pro report and test navigation
    await page.route('**/api/ideas/*/generate-pro-report', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          proReport: {
            executiveSummary: { businessOverview: 'Test overview' },
            companyDescription: { businessModel: 'Test model' },
            enhancedMarketAnalysis: { marketSize: 'Large' },
            generatedAt: new Date().toISOString(),
            version: '1.0',
            confidenceScore: 85,
          },
        }),
      });
    });

    await page.goto('/validation-results/test-idea-id');
    await page.click('[data-testid="generate-pro-report-btn"]');
    await page.waitForSelector('[data-testid="pro-report-display"]');
    
    // Test table of contents navigation
    await page.click('a[href="#executive-summary"]');
    await expect(page.locator('#executive-summary')).toBeInViewport();
    
    await page.click('a[href="#company-description"]');
    await expect(page.locator('#company-description')).toBeInViewport();
    
    await page.click('a[href="#market-analysis"]');
    await expect(page.locator('#market-analysis')).toBeInViewport();
  });
});

test.describe('Privacy Settings E2E Tests', () => {
  test('should open and update privacy settings', async ({ page }) => {
    // Mock privacy settings API
    await page.route('**/api/users/privacy-settings', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            privacySettings: {
              profilePublic: true,
              ideasPublic: true,
              allowFounderMatching: true,
              allowDirectContact: true,
            },
          }),
        });
      } else if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            privacySettings: JSON.parse(route.request().postData() || '{}'),
          }),
        });
      }
    });

    await page.goto('/profile');
    
    // Open privacy settings modal
    await page.click('[data-testid="privacy-settings-btn"]');
    await page.waitForSelector('[data-testid="privacy-settings-modal"]');
    
    // Toggle a setting
    await page.click('[data-testid="profile-public-toggle"]');
    
    // Save settings
    await page.click('[data-testid="save-privacy-settings"]');
    
    // Check success message
    await expect(page.locator('text=Privacy settings updated successfully')).toBeVisible();
  });
});
