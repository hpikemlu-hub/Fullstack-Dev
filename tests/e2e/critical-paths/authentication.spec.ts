import { test, expect } from '@playwright/test'

test.describe('Authentication Critical Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.fill('[data-testid="username"]', 'testuser')
    await page.fill('[data-testid="password"]', 'password')
    await page.click('[data-testid="login-button"]')
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard')
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Test User')
    
    // Should show navigation elements
    await expect(page.locator('[data-testid="main-navigation"]')).toBeVisible()
  })

  test('should reject invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="username"]', 'invaliduser')
    await page.fill('[data-testid="password"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
    
    // Should stay on login page
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })

  test('should validate required fields', async ({ page }) => {
    await page.click('[data-testid="login-button"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="username-error"]')).toContainText('Username is required')
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required')
  })

  test('should handle logout correctly', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="username"]', 'testuser')
    await page.fill('[data-testid="password"]', 'password')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')
    
    // Should redirect to login
    await page.waitForURL('/auth/login')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should redirect protected routes to login', async ({ page }) => {
    await page.goto('/employees')
    await page.waitForURL('/auth/login')
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible()
  })

  test('should persist authentication across browser refresh', async ({ page }) => {
    // Login
    await page.fill('[data-testid="username"]', 'testuser')
    await page.fill('[data-testid="password"]', 'password')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    // Refresh page
    await page.reload()
    
    // Should remain authenticated
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Test User')
  })

  test('should handle session timeout gracefully', async ({ page }) => {
    // This would require mocking expired JWT or setting short expiry
    // For now, test the error handling when auth fails
    
    await page.route('/api/auth/**', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Session expired' })
      })
    })

    await page.goto('/dashboard')
    await page.waitForURL('/auth/login')
    await expect(page.locator('[data-testid="session-expired-message"]')).toContainText('Session expired')
  })
})