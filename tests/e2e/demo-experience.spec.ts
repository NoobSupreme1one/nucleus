import { test, expect } from '@playwright/test';

test.describe('Interactive Demo Experience', () => {
  test('Demo page loads and functions correctly', async ({ page }) => {
    await page.goto('/demo');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check demo page elements
    await expect(page.locator('h1')).toContainText('See How Our AI Validates Startup Ideas');
    await expect(page.locator('text=Interactive Demo')).toBeVisible();
    
    // Take screenshot of demo page
    await page.screenshot({ 
      path: 'screenshots/demo-landing.png',
      fullPage: true 
    });
    
    // Fill out the demo form
    await page.fill('input[placeholder*="AI-powered fitness coach app"]', 'AI-powered fitness coach app');
    await page.selectOption('select', 'healthtech');
    await page.fill('textarea[placeholder*="problem"]', 'People struggle to maintain consistent workout routines and lack personalized guidance for their fitness goals.');
    await page.fill('textarea[placeholder*="solution"]', 'An AI-powered mobile app that creates personalized workout plans, provides real-time form correction, and adapts to user progress and preferences.');
    await page.fill('textarea[placeholder*="customers"]', 'Health-conscious individuals aged 25-45 who want personalized fitness guidance but cannot afford personal trainers.');
    
    // Take screenshot with filled form
    await page.screenshot({ 
      path: 'screenshots/demo-form-filled.png',
      fullPage: true 
    });
    
    // Click analyze button
    await page.click('button:has-text("Analyze My Idea (Demo)")');
    
    // Wait for analysis animation
    await page.waitForSelector('text=AI is Analyzing Your Idea...', { timeout: 5000 });
    
    // Take screenshot of analysis in progress
    await page.screenshot({ 
      path: 'screenshots/demo-analyzing.png',
      fullPage: true 
    });
    
    // Wait for results to appear
    await page.waitForSelector('text=Demo Analysis Complete!', { timeout: 10000 });
    
    // Check results elements
    await expect(page.locator('text=Demo Analysis Complete!')).toBeVisible();
    await expect(page.locator('text=847')).toBeVisible(); // Score for fitness app
    await expect(page.locator('text=Excellent')).toBeVisible(); // Grade
    
    // Check key insights are displayed
    await expect(page.locator('text=Market Potential')).toBeVisible();
    await expect(page.locator('text=Technical Feasibility')).toBeVisible();
    await expect(page.locator('text=Execution Score')).toBeVisible();
    
    // Check recommendations are shown
    await expect(page.locator('text=Key Recommendations')).toBeVisible();
    
    // Take screenshot of results
    await page.screenshot({ 
      path: 'screenshots/demo-results.png',
      fullPage: true 
    });
    
    // Check call-to-action buttons
    await expect(page.locator('button:has-text("Get Full Analysis")')).toBeVisible();
    await expect(page.locator('button:has-text("Try Another Idea")')).toBeVisible();
    
    console.log('✅ Demo experience test completed successfully');
    console.log('📊 Demo shows realistic validation results');
    console.log('🎯 Call-to-action buttons are properly displayed');
  });
  
  test('Demo accessible from landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if Try Demo button exists on landing page
    const demoButton = page.locator('button:has-text("Try Demo")');
    await expect(demoButton).toBeVisible();
    
    // Click demo button
    await demoButton.click();
    
    // Should navigate to demo page
    await page.waitForURL('/demo');
    await expect(page.locator('h1')).toContainText('See How Our AI Validates Startup Ideas');
    
    console.log('✅ Demo is accessible from landing page');
  });
  
  test('Demo works with different idea types', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    // Test with food delivery idea
    await page.fill('input[placeholder*="AI-powered fitness coach app"]', 'Sustainable food delivery platform');
    await page.selectOption('select', 'other');
    await page.fill('textarea[placeholder*="problem"]', 'Current food delivery services contribute to environmental waste and don\'t prioritize sustainable practices.');
    await page.fill('textarea[placeholder*="solution"]', 'A food delivery platform that only partners with sustainable restaurants and uses eco-friendly packaging and delivery methods.');
    await page.fill('textarea[placeholder*="customers"]', 'Environmentally conscious consumers who want convenient food delivery without compromising their values.');
    
    // Analyze
    await page.click('button:has-text("Analyze My Idea (Demo)")');
    await page.waitForSelector('text=Demo Analysis Complete!', { timeout: 10000 });
    
    // Should show different score (782 for sustainable food delivery)
    await expect(page.locator('text=782')).toBeVisible();
    await expect(page.locator('text=Very Good')).toBeVisible();
    
    console.log('✅ Demo shows different results for different idea types');
  });
});
