import { test, expect } from '@playwright/test';

test.describe('User Experience Review - Target Customer Journey', () => {
  test('Complete user journey from landing to idea validation', async ({ page }) => {
    // Start the user journey
    await page.goto('/');
    
    // Take screenshot of landing page
    await page.screenshot({ 
      path: 'screenshots/01-landing-page.png', 
      fullPage: true 
    });
    
    console.log('📸 Landing page screenshot taken');
    
    // Navigate to pricing page
    await page.click('text=Pricing');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'screenshots/02-pricing-page.png', 
      fullPage: true 
    });
    
    console.log('📸 Pricing page screenshot taken');
    
    // Try to access the main app without authentication
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'screenshots/03-auth-redirect.png', 
      fullPage: true 
    });
    
    console.log('📸 Auth redirect screenshot taken');
    
    // Register a new user
    if (page.url().includes('/login')) {
      // Click register link if on login page
      await page.click('text=Sign up');
      await page.waitForLoadState('networkidle');
    }
    
    await page.screenshot({ 
      path: 'screenshots/04-register-page.png', 
      fullPage: true 
    });
    
    // Fill registration form
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    
    await page.screenshot({ 
      path: 'screenshots/05-register-filled.png', 
      fullPage: true 
    });
    
    // Submit registration
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'screenshots/06-post-registration.png', 
      fullPage: true 
    });
    
    console.log('📸 Post-registration screenshot taken');
    
    // Navigate to dashboard/main app
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'screenshots/07-dashboard.png', 
      fullPage: true 
    });
    
    console.log('📸 Dashboard screenshot taken');
    
    // Try to submit an idea for validation
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for idea submission form
    const ideaInput = page.locator('textarea, input[placeholder*="idea"], input[placeholder*="startup"]').first();
    if (await ideaInput.isVisible()) {
      await ideaInput.fill('A mobile app that helps people find local farmers markets and connects them directly with organic food producers in their area');
      
      await page.screenshot({ 
        path: 'screenshots/08-idea-input.png', 
        fullPage: true 
      });
      
      // Submit the idea
      await page.click('button:has-text("Validate"), button:has-text("Submit"), button:has-text("Analyze")');
      await page.waitForLoadState('networkidle');
      
      // Wait for results
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: 'screenshots/09-validation-results.png', 
        fullPage: true 
      });
      
      console.log('📸 Validation results screenshot taken');
    }
    
    // Test navigation to different sections
    const navLinks = ['Leaderboard', 'Pricing', 'Dashboard'];
    
    for (const link of navLinks) {
      try {
        await page.click(`text=${link}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        await page.screenshot({ 
          path: `screenshots/10-${link.toLowerCase()}-page.png`, 
          fullPage: true 
        });
        
        console.log(`📸 ${link} page screenshot taken`);
      } catch (error) {
        console.log(`Could not navigate to ${link}: ${error}`);
      }
    }
    
    // Test mobile responsiveness
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'screenshots/11-mobile-landing.png', 
      fullPage: true 
    });
    
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'screenshots/12-mobile-pricing.png', 
      fullPage: true 
    });
    
    console.log('📸 Mobile screenshots taken');
    
    // Reset to desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Test error states
    await page.goto('/nonexistent-page');
    await page.waitForLoadState('networkidle');
    
    await page.screenshot({ 
      path: 'screenshots/13-404-page.png', 
      fullPage: true 
    });
    
    console.log('📸 404 page screenshot taken');
    
    // Test logout flow
    try {
      await page.click('text=Logout, text=Sign out, button:has-text("Logout")');
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ 
        path: 'screenshots/14-post-logout.png', 
        fullPage: true 
      });
      
      console.log('📸 Post-logout screenshot taken');
    } catch (error) {
      console.log('Could not find logout button');
    }
  });
  
  test('Test accessibility and performance', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility
    const headings = await page.locator('h1, h2, h3').count();
    console.log(`Found ${headings} headings on landing page`);
    
    // Check for alt text on images
    const images = await page.locator('img').count();
    const imagesWithAlt = await page.locator('img[alt]').count();
    console.log(`Found ${images} images, ${imagesWithAlt} with alt text`);
    
    // Check for form labels
    const inputs = await page.locator('input').count();
    const inputsWithLabels = await page.locator('input[aria-label], input[aria-labelledby], label input').count();
    console.log(`Found ${inputs} inputs, ${inputsWithLabels} with proper labels`);
    
    // Performance check - measure page load time
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    
    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    } else {
      console.log('No console errors found');
    }
  });
});
