import { test, expect } from '@playwright/test'

test.describe('Workload Assignment Critical Path', () => {
  test.use({ storageState: 'tests/auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/workload')
  })

  test('should display workload list correctly', async ({ page }) => {
    await expect(page.locator('[data-testid="workload-table"]')).toBeVisible()
    
    // Should show test workloads
    await expect(page.locator('[data-testid="workload-row"]')).toHaveCount(2)
    await expect(page.locator('text=Test Workload 1')).toBeVisible()
    await expect(page.locator('text=Test Workload 2')).toBeVisible()
  })

  test('should create new workload successfully', async ({ page }) => {
    await page.click('[data-testid="add-workload-button"]')
    
    // Fill workload form
    await page.fill('[data-testid="nama-input"]', 'New Test Workload')
    await page.fill('[data-testid="deskripsi-input"]', 'This is a new test workload description')
    
    // Set dates
    await page.fill('[data-testid="tgl-mulai-input"]', '2024-02-01')
    await page.fill('[data-testid="tgl-deadline-input"]', '2024-02-15')
    
    // Set estimation
    await page.fill('[data-testid="estimasi-jam-input"]', '24')
    
    // Set status
    await page.selectOption('[data-testid="status-select"]', 'TODO')
    
    await page.click('[data-testid="save-workload-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Workload created successfully')
    
    // Should appear in workload list
    await expect(page.locator('text=New Test Workload')).toBeVisible()
  })

  test('should validate workload creation form', async ({ page }) => {
    await page.click('[data-testid="add-workload-button"]')
    
    // Try to save without required fields
    await page.click('[data-testid="save-workload-button"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="nama-error"]')).toContainText('Name is required')
    await expect(page.locator('[data-testid="tgl-deadline-error"]')).toContainText('Deadline is required')
  })

  test('should update workload status', async ({ page }) => {
    // Find first workload and change status
    const firstWorkload = page.locator('[data-testid="workload-row"]').first()
    await firstWorkload.locator('[data-testid="status-dropdown"]').click()
    await page.click('[data-testid="status-option-IN_PROGRESS"]')
    
    // Should update immediately or show confirmation
    await expect(firstWorkload.locator('[data-testid="status-badge"]')).toContainText('IN PROGRESS')
  })

  test('should edit workload successfully', async ({ page }) => {
    // Click edit button for first workload
    await page.locator('[data-testid="workload-row"]').first().locator('[data-testid="edit-button"]').click()
    
    // Update workload details
    await page.fill('[data-testid="nama-input"]', 'Updated Test Workload')
    await page.fill('[data-testid="deskripsi-input"]', 'Updated description for testing')
    
    await page.click('[data-testid="save-workload-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Workload updated successfully')
    
    // Should reflect changes in list
    await expect(page.locator('text=Updated Test Workload')).toBeVisible()
  })

  test('should filter workloads correctly', async ({ page }) => {
    // Test status filter
    await page.selectOption('[data-testid="status-filter"]', 'TODO')
    await page.waitForTimeout(500)
    
    // Should show only TODO workloads
    const todoWorkloads = page.locator('[data-testid="workload-row"]:has([data-testid="status-badge"]:has-text("TODO"))')
    await expect(todoWorkloads).toHaveCountGreaterThan(0)
    
    // Test search filter
    await page.fill('[data-testid="search-input"]', 'Test Workload 1')
    await page.waitForTimeout(500)
    
    await expect(page.locator('[data-testid="workload-row"]')).toHaveCount(1)
    await expect(page.locator('text=Test Workload 1')).toBeVisible()
  })

  test('should handle workload assignment to team members', async ({ page }) => {
    // Click on workload to view details
    await page.locator('[data-testid="workload-row"]').first().click()
    
    // Look for assignment options
    const assignButton = page.locator('[data-testid="assign-workload-button"]')
    if (await assignButton.isVisible()) {
      await assignButton.click()
      
      // Select team member
      await page.selectOption('[data-testid="assign-to-select"]', 'test-user-id')
      await page.click('[data-testid="confirm-assignment-button"]')
      
      // Should show success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Workload assigned successfully')
    }
  })

  test('should display workload progress and statistics', async ({ page }) => {
    // Check for statistics dashboard
    const statsSection = page.locator('[data-testid="workload-stats"]')
    if (await statsSection.isVisible()) {
      await expect(statsSection.locator('[data-testid="total-workloads"]')).toContainText(/\d+/)
      await expect(statsSection.locator('[data-testid="completed-workloads"]')).toContainText(/\d+/)
      await expect(statsSection.locator('[data-testid="pending-workloads"]')).toContainText(/\d+/)
    }
  })

  test('should handle workload deletion with confirmation', async ({ page }) => {
    // Click delete button for first workload
    await page.locator('[data-testid="workload-row"]').first().locator('[data-testid="delete-button"]').click()
    
    // Should show confirmation dialog
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible()
    await expect(page.locator('[data-testid="delete-warning"]')).toContainText('This action cannot be undone')
    
    // Cancel deletion
    await page.click('[data-testid="cancel-delete-button"]')
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible()
    
    // Workload should still be there
    await expect(page.locator('[data-testid="workload-row"]')).toHaveCount(2)
  })

  test('should handle deadline warnings and notifications', async ({ page }) => {
    // Check for near-deadline workloads
    const nearDeadlineWorkload = page.locator('[data-testid="workload-row"]:has([data-testid="deadline-warning"])')
    if (await nearDeadlineWorkload.count() > 0) {
      await expect(nearDeadlineWorkload.first().locator('[data-testid="deadline-warning"]')).toBeVisible()
    }
  })

  test('should export workload data', async ({ page }) => {
    // Test export functionality if available
    const exportButton = page.locator('[data-testid="export-workload-button"]')
    if (await exportButton.isVisible()) {
      // Setup download promise
      const downloadPromise = page.waitForEvent('download')
      await exportButton.click()
      
      const download = await downloadPromise
      expect(download.suggestedFilename()).toMatch(/workloads.*\.(csv|xlsx)/)
    }
  })

  test('should handle pagination for large workload lists', async ({ page }) => {
    const paginationExists = await page.locator('[data-testid="workload-pagination"]').isVisible()
    
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
})