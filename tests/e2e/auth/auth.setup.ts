import { test as setup, expect } from '@playwright/test'

const authFile = 'tests/auth/user.json'
const adminAuthFile = 'tests/auth/admin.json'

setup('authenticate as user', async ({ page }) => {
  await page.goto('/auth/login')
  
  // Fill login form
  await page.fill('[data-testid="username"]', 'testuser')
  await page.fill('[data-testid="password"]', 'password')
  await page.click('[data-testid="login-button"]')
  
  // Wait for successful login
  await page.waitForURL('/dashboard')
  
  // Verify login success
  await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Test User')
  
  // Save authentication state
  await page.context().storageState({ path: authFile })
})

setup('authenticate as admin', async ({ page }) => {
  await page.goto('/auth/login')
  
  // Fill login form
  await page.fill('[data-testid="username"]', 'testadmin')
  await page.fill('[data-testid="password"]', 'password')
  await page.click('[data-testid="login-button"]')
  
  // Wait for successful login
  await page.waitForURL('/dashboard')
  
  // Verify admin login success
  await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Test Admin')
  
  // Save authentication state
  await page.context().storageState({ path: adminAuthFile })
})