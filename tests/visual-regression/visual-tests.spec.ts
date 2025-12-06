import { test, expect } from '@playwright/test'

test.describe('Visual Regression Tests', () => {
  test.use({ storageState: 'tests/auth/user.json' })

  test('should match dashboard visual layout', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Wait for dynamic content to load
    await page.waitForSelector('[data-testid="workload-stats"]')
    await page.waitForSelector('[data-testid="activity-feed"]')
    
    // Take full page screenshot
    await expect(page).toHaveScreenshot('dashboard-full-page.png', {
      fullPage: true,
      threshold: 0.1
    })
    
    // Take specific sections
    await expect(page.locator('[data-testid="workload-stats"]')).toHaveScreenshot('dashboard-workload-stats.png')
    await expect(page.locator('[data-testid="activity-feed"]')).toHaveScreenshot('dashboard-activity-feed.png')
  })

  test('should match employee table layout', async ({ page }) => {
    await page.goto('/employees')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="employee-table"]')
    
    await expect(page.locator('[data-testid="employee-table"]')).toHaveScreenshot('employee-table.png')
    
    // Test with filters applied
    await page.fill('[data-testid="search-input"]', 'Test')
    await page.waitForTimeout(500)
    await expect(page.locator('[data-testid="employee-table"]')).toHaveScreenshot('employee-table-filtered.png')
  })

  test('should match workload management layout', async ({ page }) => {
    await page.goto('/workload')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="workload-table"]')
    
    await expect(page.locator('[data-testid="workload-container"]')).toHaveScreenshot('workload-management.png')
    
    // Test workload creation form
    await page.click('[data-testid="add-workload-button"]')
    await page.waitForSelector('[data-testid="workload-form"]')
    await expect(page.locator('[data-testid="workload-form"]')).toHaveScreenshot('workload-creation-form.png')
  })

  test('should match calendar layout', async ({ page }) => {
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="calendar-container"]')
    
    await expect(page.locator('[data-testid="calendar-container"]')).toHaveScreenshot('calendar-view.png')
    
    // Test event creation modal
    await page.click('[data-testid="add-event-button"]')
    await page.waitForSelector('[data-testid="event-form"]')
    await expect(page.locator('[data-testid="event-form"]')).toHaveScreenshot('event-creation-form.png')
  })

  test('should match mobile responsive layouts', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('dashboard-mobile.png', { fullPage: true })
    
    await page.goto('/workload')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('workload-mobile.png', { fullPage: true })
    
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('calendar-mobile.png', { fullPage: true })
  })

  test('should match form validation states', async ({ page }) => {
    await page.goto('/employees')
    await page.click('[data-testid="add-employee-button"]')
    
    // Submit form without filling required fields
    await page.click('[data-testid="save-employee-button"]')
    await page.waitForSelector('[data-testid="nama-lengkap-error"]')
    
    await expect(page.locator('[data-testid="employee-form"]')).toHaveScreenshot('employee-form-validation-errors.png')
  })

  test('should match loading states', async ({ page }) => {
    // Intercept API calls to delay responses
    await page.route('/api/employees', route => {
      setTimeout(() => route.continue(), 2000)
    })
    
    await page.goto('/employees')
    
    // Capture loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toHaveScreenshot('loading-state.png')
  })
})