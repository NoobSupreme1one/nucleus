import { test, expect } from '@playwright/test';

test.describe('Mobile Experience Tests', () => {
  test('Mobile landing page experience', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'screenshots/mobile-landing-page.png',
      fullPage: true 
    });
    
    // Test mobile menu functionality
    const mobileMenuButton = page.locator('button[aria-label="Open mobile navigation menu"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // Check if mobile menu button meets touch target requirements (44px minimum)
    const buttonBox = await mobileMenuButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44);
    
    // Test mobile menu opening
    await mobileMenuButton.click();
    await page.waitForTimeout(500); // Wait for animation
    
    // Check if mobile menu is visible
    const mobileMenu = page.locator('div.md\\:hidden').filter({ hasText: 'Features' });
    await expect(mobileMenu).toBeVisible();
    
    // Take screenshot with mobile menu open
    await page.screenshot({ 
      path: 'screenshots/mobile-menu-open.png',
      fullPage: true 
    });
    
    // Test mobile menu links have proper touch targets
    const menuLinks = page.locator('div.md\\:hidden a');
    const linkCount = await menuLinks.count();
    
    for (let i = 0; i < linkCount; i++) {
      const link = menuLinks.nth(i);
      const linkBox = await link.boundingBox();
      expect(linkBox?.height).toBeGreaterThanOrEqual(44);
    }
    
    // Test CTA buttons on mobile
    await mobileMenuButton.click(); // Close menu
    await page.waitForTimeout(500);
    
    const primaryCTA = page.locator('button').filter({ hasText: 'Validate My Idea Free' });
    await expect(primaryCTA).toBeVisible();
    
    const ctaBox = await primaryCTA.boundingBox();
    expect(ctaBox?.height).toBeGreaterThanOrEqual(48); // We set min-h-[48px]
    
    console.log('✅ Mobile experience tests completed successfully');
    console.log(`📱 Mobile menu button size: ${buttonBox?.width}x${buttonBox?.height}px`);
    console.log(`🎯 Primary CTA button size: ${ctaBox?.width}x${ctaBox?.height}px`);
  });
  
  test('Mobile text readability', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check hero text sizing
    const heroHeading = page.locator('h1#hero-heading');
    await expect(heroHeading).toBeVisible();
    
    // Check that text is not too large for mobile
    const headingBox = await heroHeading.boundingBox();
    expect(headingBox?.width).toBeLessThanOrEqual(375); // Should fit in viewport
    
    // Check paragraph text
    const heroParagraph = page.locator('h1#hero-heading + p');
    await expect(heroParagraph).toBeVisible();
    
    console.log('✅ Mobile text readability tests passed');
  });
  
  test('Mobile performance', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Mobile should load reasonably fast
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
    
    console.log(`📱 Mobile page load time: ${loadTime}ms`);
  });
});
