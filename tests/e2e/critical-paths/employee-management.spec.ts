import { test, expect } from '@playwright/test'

test.describe('Employee Management Critical Path', () => {
  test.use({ storageState: 'tests/auth/admin.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/employees')
  })

  test('should display employee list correctly', async ({ page }) => {
    // Wait for employee table to load
    await expect(page.locator('[data-testid="employee-table"]')).toBeVisible()
    
    // Should show test users
    await expect(page.locator('[data-testid="employee-row"]')).toHaveCount(2)
    await expect(page.locator('text=Test User')).toBeVisible()
    await expect(page.locator('text=Test Admin')).toBeVisible()
  })

  test('should create new employee successfully', async ({ page }) => {
    await page.click('[data-testid="add-employee-button"]')
    
    // Fill employee form
    await page.fill('[data-testid="nama-lengkap-input"]', 'New Employee')
    await page.fill('[data-testid="username-input"]', 'newemployee')
    await page.fill('[data-testid="nip-input"]', '987654321')
    await page.fill('[data-testid="golongan-input"]', 'III/b')
    await page.fill('[data-testid="jabatan-input"]', 'Senior Staff')
    await page.fill('[data-testid="email-input"]', 'new@example.com')
    
    await page.click('[data-testid="save-employee-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Employee created successfully')
    
    // Should appear in employee list
    await expect(page.locator('text=New Employee')).toBeVisible()
  })

  test('should validate employee creation form', async ({ page }) => {
    await page.click('[data-testid="add-employee-button"]')
    
    // Try to save without required fields
    await page.click('[data-testid="save-employee-button"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="nama-lengkap-error"]')).toContainText('Name is required')
    await expect(page.locator('[data-testid="username-error"]')).toContainText('Username is required')
  })

  test('should edit employee successfully', async ({ page }) => {
    // Click edit button for first employee
    await page.locator('[data-testid="employee-row"]').first().locator('[data-testid="edit-button"]').click()
    
    // Update employee details
    await page.fill('[data-testid="nama-lengkap-input"]', 'Updated Test User')
    await page.fill('[data-testid="jabatan-input"]', 'Updated Position')
    
    await page.click('[data-testid="save-employee-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Employee updated successfully')
    
    // Should reflect changes in list
    await expect(page.locator('text=Updated Test User')).toBeVisible()
  })

  test('should filter employees correctly', async ({ page }) => {
    // Test search filter
    await page.fill('[data-testid="search-input"]', 'Test User')
    await page.waitForTimeout(500) // Debounce
    
    await expect(page.locator('[data-testid="employee-row"]')).toHaveCount(1)
    await expect(page.locator('text=Test User')).toBeVisible()
    
    // Clear search
    await page.fill('[data-testid="search-input"]', '')
    await page.waitForTimeout(500)
    
    await expect(page.locator('[data-testid="employee-row"]')).toHaveCount(2)
  })

  test('should handle employee deletion with confirmation', async ({ page }) => {
    // Click delete button for first employee
    await page.locator('[data-testid="employee-row"]').first().locator('[data-testid="delete-button"]').click()
    
    // Should show confirmation dialog
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible()
    await expect(page.locator('[data-testid="delete-warning"]')).toContainText('This action cannot be undone')
    
    // Cancel deletion
    await page.click('[data-testid="cancel-delete-button"]')
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible()
    
    // Employee should still be there
    await expect(page.locator('[data-testid="employee-row"]')).toHaveCount(2)
  })

  test('should handle role-based access correctly', async ({ page }) => {
    // Admin should see all management features
    await expect(page.locator('[data-testid="add-employee-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="employee-row"] [data-testid="edit-button"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="employee-row"] [data-testid="delete-button"]').first()).toBeVisible()
  })

  test('should handle pagination correctly', async ({ page }) => {
    // If there are enough employees to paginate
    const paginationExists = await page.locator('[data-testid="pagination"]').isVisible()
    
    if (paginationExists) {
      // Test pagination controls
      await expect(page.locator('[data-testid="current-page"]')).toContainText('1')
      
      // Go to next page if possible
      const nextButton = page.locator('[data-testid="next-page-button"]')
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await expect(page.locator('[data-testid="current-page"]')).toContainText('2')
      }
    }
  })

  test('should export employee data', async ({ page }) => {
    // Test export functionality if available
    const exportButton = page.locator('[data-testid="export-button"]')
    if (await exportButton.isVisible()) {
      // Setup download promise
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/employees.*\.(csv|xlsx)/)
    }
  })

  test('should handle password change for employees', async ({ page }) => {
    // Click on employee to view details
    await page.locator('[data-testid="employee-row"]').first().click()
    
    // Look for change password option
    const changePasswordButton = page.locator('[data-testid="change-password-button"]')
    if (await changePasswordButton.isVisible()) {
      await changePasswordButton.click()
      
      // Fill password form
      await page.fill('[data-testid="new-password-input"]', 'newpassword123')
      await page.fill('[data-testid="confirm-password-input"]', 'newpassword123')
      
      await page.click('[data-testid="save-password-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Password updated successfully')
    }
  })
})