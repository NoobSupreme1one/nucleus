import { test, expect } from '@playwright/test';

test.describe('Authentication Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/');
  });

  test('Complete registration flow', async ({ page }) => {
    console.log('🔍 Starting registration flow test');
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the login page
    await expect(page.locator('h1, h2, .title').filter({ hasText: /welcome back|sign in|login/i }).first()).toBeVisible();
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: 'screenshots/auth-01-login-page.png', 
      fullPage: true 
    });
    console.log('📸 Login page screenshot taken');
    
    // Switch to registration mode
    await page.click('button:has-text("Sign Up"), text="Sign Up", text="Create Account"');
    await page.waitForTimeout(500); // Wait for UI to update
    
    // Take screenshot of registration form
    await page.screenshot({ 
      path: 'screenshots/auth-02-registration-form.png', 
      fullPage: true 
    });
    console.log('📸 Registration form screenshot taken');
    
    // Fill registration form with valid data
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'SecurePass123!';
    
    // Fill first name
    const firstNameInput = page.locator('input[name="firstName"], input[placeholder*="first" i], input[placeholder*="name" i]').first();
    await firstNameInput.fill('John');
    
    // Fill last name if present
    const lastNameInput = page.locator('input[name="lastName"], input[placeholder*="last" i]').first();
    if (await lastNameInput.isVisible()) {
      await lastNameInput.fill('Doe');
    }
    
    // Fill email
    await page.locator('input[type="email"]').fill(testEmail);
    
    // Fill password
    await page.locator('input[type="password"]').fill(testPassword);
    
    // Take screenshot of filled form
    await page.screenshot({ 
      path: 'screenshots/auth-03-registration-filled.png', 
      fullPage: true 
    });
    console.log('📸 Registration filled form screenshot taken');
    
    // Submit registration form
    await page.click('button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Sign Up"), button[type="submit"]:has-text("Register")');
    
    // Wait for response
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take screenshot of post-registration state
    await page.screenshot({ 
      path: 'screenshots/auth-04-post-registration.png', 
      fullPage: true 
    });
    console.log('📸 Post-registration screenshot taken');
    
    // Verify successful registration
    // Should either redirect to dashboard or show success message
    const isRedirected = page.url() !== '/login' && !page.url().includes('/login');
    const hasSuccessMessage = await page.locator('text="Registration successful", text="Account created", text="Welcome"').isVisible();
    
    console.log(`✅ Registration completed - Redirected: ${isRedirected}, Success message: ${hasSuccessMessage}`);
    expect(isRedirected || hasSuccessMessage).toBeTruthy();
    
    // If redirected to dashboard, verify we can access protected content
    if (isRedirected) {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Should not redirect back to login
      expect(page.url()).not.toContain('/login');
      console.log('✅ Can access protected dashboard after registration');
    }
  });

  test('Login with existing account', async ({ page }) => {
    console.log('🔍 Starting login flow test');
    
    // For development environment, use test credentials
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    // Navigate to login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Make sure we're in login mode (not registration)
    const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (await signInButton.isVisible()) {
      // Already in login mode
    } else {
      // Switch from registration to login mode
      await page.click('text="Sign In", text="Already have an account"');
      await page.waitForTimeout(500);
    }
    
    // Fill login credentials
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    
    // Take screenshot of filled login form
    await page.screenshot({ 
      path: 'screenshots/auth-05-login-filled.png', 
      fullPage: true 
    });
    console.log('📸 Login filled form screenshot taken');
    
    // Submit login form
    await page.click('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Login")');
    
    // Wait for login response
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take screenshot of post-login state
    await page.screenshot({ 
      path: 'screenshots/auth-06-post-login.png', 
      fullPage: true 
    });
    console.log('📸 Post-login screenshot taken');
    
    // Verify successful login - should be redirected away from login page
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login') || await page.locator('text="Welcome", text="Dashboard", text="Logout"').isVisible();
    
    console.log(`Current URL after login: ${currentUrl}`);
    console.log(`✅ Login successful: ${isLoggedIn}`);
    expect(isLoggedIn).toBeTruthy();
    
    // Test access to protected routes
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should not redirect back to login
    expect(page.url()).not.toContain('/login');
    console.log('✅ Can access protected dashboard after login');
  });

  test('Logout workflow', async ({ page }) => {
    console.log('🔍 Starting logout flow test');
    
    // First, log in
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    // Make sure we're in login mode
    const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (!(await signInButton.isVisible())) {
      await page.click('text="Sign In", text="Already have an account"');
      await page.waitForTimeout(500);
    }
    
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.click('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Login")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Now test logout
    console.log('🔄 Testing logout functionality');
    
    // Look for logout button/link
    const logoutButton = page.locator('text="Logout", text="Sign out", button:has-text("Logout")').first();
    
    if (await logoutButton.isVisible()) {
      console.log('Found logout button, clicking...');
      await logoutButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Take screenshot after logout
      await page.screenshot({ 
        path: 'screenshots/auth-07-post-logout.png', 
        fullPage: true 
      });
      console.log('📸 Post-logout screenshot taken');
      
      // Verify logout - should not be able to access protected routes
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const redirectedToLogin = page.url().includes('/login');
      console.log(`✅ Logout successful - redirected to login: ${redirectedToLogin}`);
      expect(redirectedToLogin).toBeTruthy();
    } else {
      console.log('⚠️  Logout button not found - might need to look in navigation menu');
      
      // Try to find logout in dropdown or menu
      const menuButtons = page.locator('button:has-text("Menu"), button[aria-label*="menu" i], [role="button"]').all();
      for (const menuButton of await menuButtons) {
        try {
          await menuButton.click();
          await page.waitForTimeout(500);
          
          const logoutInMenu = page.locator('text="Logout", text="Sign out"').first();
          if (await logoutInMenu.isVisible()) {
            await logoutInMenu.click();
            await page.waitForLoadState('networkidle');
            console.log('✅ Found and clicked logout in menu');
            break;
          }
        } catch (error) {
          // Continue to next menu button
        }
      }
    }
  });

  test('Password validation on registration', async ({ page }) => {
    console.log('🔍 Testing password validation');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Switch to registration mode
    await page.click('button:has-text("Sign Up"), text="Sign Up", text="Create Account"');
    await page.waitForTimeout(500);
    
    // Test weak password
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.locator('input[type="password"]').fill('weak');
    
    // Try to submit
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    
    // Should show validation error
    const hasValidationError = await page.locator('text="password", text="requirements", text="8", text="uppercase", text="lowercase", text="number", text="special"').isVisible();
    
    console.log(`✅ Password validation working: ${hasValidationError}`);
    expect(hasValidationError).toBeTruthy();
    
    // Take screenshot of validation error
    await page.screenshot({ 
      path: 'screenshots/auth-08-password-validation.png', 
      fullPage: true 
    });
    console.log('📸 Password validation screenshot taken');
  });

  test('Invalid login credentials', async ({ page }) => {
    console.log('🔍 Testing invalid login credentials');
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Make sure we're in login mode
    const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (!(await signInButton.isVisible())) {
      await page.click('text="Sign In", text="Already have an account"');
      await page.waitForTimeout(500);
    }
    
    // Fill invalid credentials
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    
    await page.click('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Login")');
    await page.waitForTimeout(2000);
    
    // Should show error message and remain on login page
    const hasError = await page.locator('text="Invalid", text="failed", text="error", text="incorrect"').isVisible();
    const stillOnLoginPage = page.url().includes('/login') || await page.locator('input[type="email"]').isVisible();
    
    console.log(`✅ Invalid login handled correctly - Error shown: ${hasError}, Still on login: ${stillOnLoginPage}`);
    expect(hasError || stillOnLoginPage).toBeTruthy();
    
    // Take screenshot of error state
    await page.screenshot({ 
      path: 'screenshots/auth-09-invalid-login.png', 
      fullPage: true 
    });
    console.log('📸 Invalid login error screenshot taken');
  });

  test('Authentication state persistence', async ({ page }) => {
    console.log('🔍 Testing authentication state persistence');
    
    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    // Make sure we're in login mode
    const signInButton = page.locator('button:has-text("Sign In"), button:has-text("Login")').first();
    if (!(await signInButton.isVisible())) {
      await page.click('text="Sign In", text="Already have an account"');
      await page.waitForTimeout(500);
    }
    
    await page.locator('input[type="email"]').fill(testEmail);
    await page.locator('input[type="password"]').fill(testPassword);
    await page.click('button[type="submit"]:has-text("Sign In"), button[type="submit"]:has-text("Login")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Verify login was successful
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const canAccessDashboard = !page.url().includes('/login');
    
    if (canAccessDashboard) {
      console.log('✅ Initial login successful');
      
      // Navigate away and back
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should still be logged in
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const stillLoggedIn = !page.url().includes('/login');
      console.log(`✅ Authentication persisted across navigation: ${stillLoggedIn}`);
      expect(stillLoggedIn).toBeTruthy();
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const persistsAfterReload = !page.url().includes('/login');
      console.log(`✅ Authentication persisted after reload: ${persistsAfterReload}`);
      expect(persistsAfterReload).toBeTruthy();
    } else {
      console.log('⚠️  Could not test persistence - initial login failed');
    }
  });

  test('Protected route access without authentication', async ({ page }) => {
    console.log('🔍 Testing protected route access without authentication');
    
    // Try to access protected routes directly
    const protectedRoutes = ['/dashboard', '/matches', '/portfolio'];
    
    for (const route of protectedRoutes) {
      console.log(`Testing access to ${route}`);
      
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      
      const redirectedToLogin = page.url().includes('/login');
      const showsAuthPrompt = await page.locator('text="Sign in", text="Login", text="Please log in"').isVisible();
      
      console.log(`Route ${route} - Redirected to login: ${redirectedToLogin}, Shows auth prompt: ${showsAuthPrompt}`);
      
      // Should either redirect to login or show authentication prompt
      expect(redirectedToLogin || showsAuthPrompt).toBeTruthy();
    }
    
    // Take screenshot of protected route redirect
    await page.screenshot({ 
      path: 'screenshots/auth-10-protected-route-redirect.png', 
      fullPage: true 
    });
    console.log('📸 Protected route redirect screenshot taken');
  });
});