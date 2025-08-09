import { test, expect } from '@playwright/test';

test('Login redirects to dashboard and shows user content', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('test@example.com');
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: /sign in/i }).click();

  await page.waitForURL('**/');

  await expect(page).toHaveURL(/\/?$/);
  await expect(page.getByText(/Welcome back/i)).toBeVisible();
});


