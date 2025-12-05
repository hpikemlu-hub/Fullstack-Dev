import { test, expect } from '@playwright/test'

test.describe('Dashboard and Real-time Updates Critical Path', () => {
  test.use({ storageState: 'tests/auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should display dashboard correctly', async ({ page }) => {
    // Check main dashboard elements
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Test User')
    
    // Check statistics sections
    await expect(page.locator('[data-testid="workload-stats"]')).toBeVisible()
    await expect(page.locator('[data-testid="calendar-stats"]')).toBeVisible()
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible()
  })

  test('should display accurate workload statistics', async ({ page }) => {
    const workloadStats = page.locator('[data-testid="workload-stats"]')
    
    // Should show total workloads
    await expect(workloadStats.locator('[data-testid="total-workloads"]')).toContainText(/\d+/)
    await expect(workloadStats.locator('[data-testid="pending-workloads"]')).toContainText(/\d+/)
    await expect(workloadStats.locator('[data-testid="completed-workloads"]')).toContainText(/\d+/)
    await expect(workloadStats.locator('[data-testid="overdue-workloads"]')).toContainText(/\d+/)
    
    // Progress chart should be visible
    await expect(workloadStats.locator('[data-testid="workload-progress-chart"]')).toBeVisible()
  })

  test('should display upcoming calendar events', async ({ page }) => {
    const calendarStats = page.locator('[data-testid="calendar-stats"]')
    
    // Should show upcoming events
    await expect(calendarStats.locator('[data-testid="upcoming-events"]')).toBeVisible()
    await expect(calendarStats.locator('[data-testid="upcoming-count"]')).toContainText(/\d+/)
    
    // Should show business trips
    await expect(calendarStats.locator('[data-testid="business-trips"]')).toBeVisible()
    await expect(calendarStats.locator('[data-testid="business-trips-count"]')).toContainText(/\d+/)
  })

  test('should show real-time activity feed', async ({ page }) => {
    const activityFeed = page.locator('[data-testid="activity-feed"]')
    
    await expect(activityFeed).toBeVisible()
    await expect(activityFeed.locator('[data-testid="activity-item"]')).toHaveCountGreaterThan(0)
    
    // Activity items should have timestamps
    const firstActivity = activityFeed.locator('[data-testid="activity-item"]').first()
    await expect(firstActivity.locator('[data-testid="activity-timestamp"]')).toBeVisible()
    await expect(firstActivity.locator('[data-testid="activity-description"]')).toBeVisible()
  })

  test('should display personal todo list', async ({ page }) => {
    const todoList = page.locator('[data-testid="personal-todo-list"]')
    
    if (await todoList.isVisible()) {
      // Should show personal todos
      await expect(todoList.locator('[data-testid="todo-item"]')).toHaveCountGreaterThan(0)
      
      // Should be able to mark todos as complete
      const firstTodo = todoList.locator('[data-testid="todo-item"]').first()
      const todoCheckbox = firstTodo.locator('[data-testid="todo-checkbox"]')
      
      if (await todoCheckbox.isVisible()) {
        await todoCheckbox.check()
        
        // Should update status
        await expect(firstTodo.locator('[data-testid="todo-status"]')).toContainText('Completed')
      }
    }
  })

  test('should handle quick actions correctly', async ({ page }) => {
    const quickActions = page.locator('[data-testid="quick-actions"]')
    
    await expect(quickActions).toBeVisible()
    
    // Test quick workload creation
    const addWorkloadButton = quickActions.locator('[data-testid="quick-add-workload"]')
    if (await addWorkloadButton.isVisible()) {
      await addWorkloadButton.click()
      await expect(page).toHaveURL(/.*\/workload\/new/)
    }
  })

  test('should update statistics in real-time', async ({ page }) => {
    // Get initial statistics
    const initialWorkloadCount = await page.locator('[data-testid="total-workloads"]').textContent()
    
    // Open new tab and create a workload
    const page2 = await page.context().newPage()
    await page2.goto('/workload')
    
    await page2.click('[data-testid="add-workload-button"]')
    await page2.fill('[data-testid="nama-input"]', 'Real-time Test Workload')
    await page2.fill('[data-testid="tgl-deadline-input"]', '2024-04-01')
    await page2.click('[data-testid="save-workload-button"]')
    
    // Wait for success
    await expect(page2.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Switch back to dashboard and check for updated statistics
    await page.bringToFront()
    await page.waitForTimeout(3000) // Allow time for real-time update
    
    const updatedWorkloadCount = await page.locator('[data-testid="total-workloads"]').textContent()
    expect(updatedWorkloadCount).not.toBe(initialWorkloadCount)
    
    await page2.close()
  })

  test('should display system health metrics for admin', async ({ page }) => {
    // This test assumes admin dashboard shows system metrics
    await page.goto('/auth/login')
    await page.fill('[data-testid="username"]', 'testadmin')
    await page.fill('[data-testid="password"]', 'password')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    
    const systemMetrics = page.locator('[data-testid="system-metrics"]')
    
    if (await systemMetrics.isVisible()) {
      await expect(systemMetrics.locator('[data-testid="database-status"]')).toBeVisible()
      await expect(systemMetrics.locator('[data-testid="memory-usage"]')).toBeVisible()
      await expect(systemMetrics.locator('[data-testid="active-users"]')).toBeVisible()
    }
  })

  test('should handle dashboard refresh and data reloading', async ({ page }) => {
    // Check initial load
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible()
    
    // Refresh page
    await page.reload()
    
    // Should reload correctly
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-welcome"]')).toContainText('Test User')
    
    // Statistics should reload
    await expect(page.locator('[data-testid="workload-stats"]')).toBeVisible()
  })

  test('should show recent workload activities', async ({ page }) => {
    const recentWorkload = page.locator('[data-testid="recent-workload"]')
    
    if (await recentWorkload.isVisible()) {
      await expect(recentWorkload.locator('[data-testid="workload-item"]')).toHaveCountGreaterThan(0)
      
      // Should be able to click and navigate to workload
      const firstWorkload = recentWorkload.locator('[data-testid="workload-item"]').first()
      await firstWorkload.click()
      
      // Should navigate to workload details
      await expect(page).toHaveURL(/.*\/workload\/.*/)
    }
  })

  test('should handle notification system', async ({ page }) => {
    const notifications = page.locator('[data-testid="notifications"]')
    
    if (await notifications.isVisible()) {
      // Should show notification count
      await expect(notifications.locator('[data-testid="notification-count"]')).toBeVisible()
      
      // Should be able to open notification panel
      await notifications.click()
      await expect(page.locator('[data-testid="notification-panel"]')).toBeVisible()
      
      // Should show notification items
      const notificationItems = page.locator('[data-testid="notification-item"]')
      if (await notificationItems.count() > 0) {
        await expect(notificationItems.first()).toBeVisible()
      }
    }
  })

  test('should display responsive layout on different screen sizes', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('[data-testid="dashboard-sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="dashboard-main"]')).toBeVisible()
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible()
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('[data-testid="dashboard-container"]')).toBeVisible()
    
    // Mobile menu should be accessible
    const mobileMenu = page.locator('[data-testid="mobile-menu-trigger"]')
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click()
      await expect(page.locator('[data-testid="mobile-navigation"]')).toBeVisible()
    }
  })

  test('should handle dashboard personalization settings', async ({ page }) => {
    const settingsButton = page.locator('[data-testid="dashboard-settings"]')
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click()
      
      // Should open settings panel
      await expect(page.locator('[data-testid="dashboard-settings-panel"]')).toBeVisible()
      
      // Should be able to toggle dashboard widgets
      const widgetToggles = page.locator('[data-testid="widget-toggle"]')
      if (await widgetToggles.count() > 0) {
        await widgetToggles.first().click()
        
        // Should save settings
        await page.click('[data-testid="save-settings-button"]')
        await expect(page.locator('[data-testid="success-message"]')).toContainText('Settings saved')
      }
    }
  })
})