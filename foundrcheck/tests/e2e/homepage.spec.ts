import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should display the main heading', async ({ page }) => {
    await page.goto('/');
    
    const heading = page.getByRole('heading', { name: 'Validate Your Startup Ideas' });
    await expect(heading).toBeVisible();
  });

  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    
    // Check Submit Your Idea button
    const submitButton = page.getByRole('link', { name: 'Submit Your Idea' });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveAttribute('href', '/submit');
    
    // Check View Leaderboard button  
    const leaderboardButton = page.getByRole('link', { name: 'View Leaderboard' });
    await expect(leaderboardButton).toBeVisible();
    await expect(leaderboardButton).toHaveAttribute('href', '/leaderboard');
  });

  test('should display "How It Works" section', async ({ page }) => {
    await page.goto('/');
    
    const howItWorksHeading = page.getByRole('heading', { name: 'How It Works' });
    await expect(howItWorksHeading).toBeVisible();
    
    // Check for the three steps
    await expect(page.getByText('Submit Your Idea')).toBeVisible();
    await expect(page.getByText('AI Analysis')).toBeVisible();
    await expect(page.getByText('Get Your Score')).toBeVisible();
  });

  test('should display best idea of the day section', async ({ page }) => {
    await page.goto('/');
    
    const bestIdeaHeading = page.getByRole('heading', { name: /Best Idea of the Day/i });
    await expect(bestIdeaHeading).toBeVisible();
    
    // Should show either an idea card or a "no ideas" message
    const hasIdea = await page.locator('[data-testid="best-idea-card"]').isVisible();
    const hasNoIdeas = await page.getByText('No ideas have been scored today yet').isVisible();
    
    expect(hasIdea || hasNoIdeas).toBe(true);
  });
});