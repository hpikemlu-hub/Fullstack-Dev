import { test, expect } from '@playwright/test'

test.describe('Calendar Events Critical Path', () => {
  test.use({ storageState: 'tests/auth/user.json' })

  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar')
  })

  test('should display calendar view correctly', async ({ page }) => {
    await expect(page.locator('[data-testid="calendar-container"]')).toBeVisible()
    
    // Should show calendar navigation
    await expect(page.locator('[data-testid="calendar-navigation"]')).toBeVisible()
    await expect(page.locator('[data-testid="calendar-month-year"]')).toBeVisible()
    
    // Should show existing events
    await expect(page.locator('[data-testid="calendar-event"]')).toHaveCountGreaterThan(0)
  })

  test('should create new calendar event successfully', async ({ page }) => {
    await page.click('[data-testid="add-event-button"]')
    
    // Fill event form
    await page.fill('[data-testid="event-title-input"]', 'New Test Event')
    await page.fill('[data-testid="event-description-input"]', 'This is a test event description')
    await page.fill('[data-testid="event-location-input"]', 'Test Location')
    
    // Set date and time
    await page.fill('[data-testid="start-date-input"]', '2024-03-01')
    await page.fill('[data-testid="start-time-input"]', '10:00')
    await page.fill('[data-testid="end-date-input"]', '2024-03-01')
    await page.fill('[data-testid="end-time-input"]', '11:00')
    
    await page.click('[data-testid="save-event-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Event created successfully')
    
    // Should appear in calendar
    await expect(page.locator('text=New Test Event')).toBeVisible()
  })

  test('should validate event creation form', async ({ page }) => {
    await page.click('[data-testid="add-event-button"]')
    
    // Try to save without required fields
    await page.click('[data-testid="save-event-button"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="title-error"]')).toContainText('Title is required')
    await expect(page.locator('[data-testid="start-date-error"]')).toContainText('Start date is required')
    await expect(page.locator('[data-testid="end-date-error"]')).toContainText('End date is required')
  })

  test('should create business trip with linked todos', async ({ page }) => {
    await page.click('[data-testid="add-event-button"]')
    
    // Fill business trip form
    await page.fill('[data-testid="event-title-input"]', 'Business Trip to Jakarta')
    await page.fill('[data-testid="event-description-input"]', 'Official business trip')
    await page.fill('[data-testid="event-location-input"]', 'Jakarta')
    
    // Mark as business trip
    await page.check('[data-testid="is-business-trip-checkbox"]')
    
    // Set dates
    await page.fill('[data-testid="start-date-input"]', '2024-03-05')
    await page.fill('[data-testid="end-date-input"]', '2024-03-07')
    
    // Add linked todos
    await page.click('[data-testid="add-todo-button"]')
    await page.selectOption('[data-testid="todo-workload-select"]', 'test-workload-1')
    
    await page.click('[data-testid="save-event-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Business trip created successfully')
    
    // Should appear in calendar with business trip indicator
    const businessTripEvent = page.locator('[data-testid="calendar-event"]:has-text("Business Trip to Jakarta")')
    await expect(businessTripEvent).toBeVisible()
    await expect(businessTripEvent.locator('[data-testid="business-trip-icon"]')).toBeVisible()
  })

  test('should edit calendar event successfully', async ({ page }) => {
    // Click on existing event
    await page.locator('[data-testid="calendar-event"]').first().click()
    
    // Click edit button
    await page.click('[data-testid="edit-event-button"]')
    
    // Update event details
    await page.fill('[data-testid="event-title-input"]', 'Updated Test Event')
    await page.fill('[data-testid="event-description-input"]', 'Updated description')
    
    await page.click('[data-testid="save-event-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Event updated successfully')
    
    // Should reflect changes
    await expect(page.locator('text=Updated Test Event')).toBeVisible()
  })

  test('should handle event participants correctly', async ({ page }) => {
    await page.click('[data-testid="add-event-button"]')
    
    // Fill basic event info
    await page.fill('[data-testid="event-title-input"]', 'Team Meeting')
    await page.fill('[data-testid="start-date-input"]', '2024-03-10')
    await page.fill('[data-testid="end-date-input"]', '2024-03-10')
    
    // Add participants
    await page.click('[data-testid="add-participants-button"]')
    await page.selectOption('[data-testid="participant-select"]', 'test-user-id')
    await page.click('[data-testid="add-participant-confirm"]')
    
    await page.click('[data-testid="save-event-button"]')
    
    // Should show participants in event details
    await page.locator('[data-testid="calendar-event"]:has-text("Team Meeting")').click()
    await expect(page.locator('[data-testid="event-participants"]')).toContainText('Test User')
  })

  test('should navigate calendar months correctly', async ({ page }) => {
    // Get current month/year
    const currentMonthYear = await page.locator('[data-testid="calendar-month-year"]').textContent()
    
    // Navigate to next month
    await page.click('[data-testid="next-month-button"]')
    
    // Should show different month
    const newMonthYear = await page.locator('[data-testid="calendar-month-year"]').textContent()
    expect(newMonthYear).not.toBe(currentMonthYear)
    
    // Navigate back
    await page.click('[data-testid="prev-month-button"]')
    
    // Should return to original month
    await expect(page.locator('[data-testid="calendar-month-year"]')).toContainText(currentMonthYear!)
  })

  test('should handle different calendar views', async ({ page }) => {
    // Test month view (default)
    await expect(page.locator('[data-testid="calendar-month-view"]')).toBeVisible()
    
    // Switch to week view if available
    const weekViewButton = page.locator('[data-testid="week-view-button"]')
    if (await weekViewButton.isVisible()) {
      await weekViewButton.click()
      await expect(page.locator('[data-testid="calendar-week-view"]')).toBeVisible()
    }
    
    // Switch to day view if available
    const dayViewButton = page.locator('[data-testid="day-view-button"]')
    if (await dayViewButton.isVisible()) {
      await dayViewButton.click()
      await expect(page.locator('[data-testid="calendar-day-view"]')).toBeVisible()
    }
  })

  test('should handle event deletion with confirmation', async ({ page }) => {
    // Click on existing event
    await page.locator('[data-testid="calendar-event"]').first().click()
    
    // Click delete button
    await page.click('[data-testid="delete-event-button"]')
    
    // Should show confirmation dialog
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).toBeVisible()
    await expect(page.locator('[data-testid="delete-warning"]')).toContainText('This action cannot be undone')
    
    // Cancel deletion
    await page.click('[data-testid="cancel-delete-button"]')
    await expect(page.locator('[data-testid="delete-confirmation-dialog"]')).not.toBeVisible()
    
    // Event should still be there
    await expect(page.locator('[data-testid="calendar-event"]')).toHaveCountGreaterThan(0)
  })

  test('should display real-time updates', async ({ page }) => {
    // Open calendar in two tabs to test real-time updates
    const page2 = await page.context().newPage()
    await page2.goto('/calendar')
    
    // Create event in first tab
    await page.click('[data-testid="add-event-button"]')
    await page.fill('[data-testid="event-title-input"]', 'Real-time Test Event')
    await page.fill('[data-testid="start-date-input"]', '2024-03-15')
    await page.fill('[data-testid="end-date-input"]', '2024-03-15')
    await page.click('[data-testid="save-event-button"]')
    
    // Should appear in second tab (with some delay for real-time sync)
    await page2.waitForTimeout(2000)
    await expect(page2.locator('text=Real-time Test Event')).toBeVisible()
    
    await page2.close()
  })

  test('should handle auto-completion of business trip todos', async ({ page }) => {
    // This test assumes past business trips should auto-complete their todos
    
    // Look for past business trips
    const pastTrips = page.locator('[data-testid="calendar-event"][data-past="true"][data-business-trip="true"]')
    
    if (await pastTrips.count() > 0) {
      await pastTrips.first().click()
      
      // Check if todos are marked as auto-completed
      await expect(page.locator('[data-testid="auto-completed-todos"]')).toBeVisible()
      await expect(page.locator('[data-testid="auto-completion-status"]')).toContainText('Auto-completed')
    }
  })

  test('should filter events by type and date range', async ({ page }) => {
    // Test business trip filter
    const businessTripFilter = page.locator('[data-testid="business-trip-filter"]')
    if (await businessTripFilter.isVisible()) {
      await businessTripFilter.check()
      
      // Should show only business trip events
      const visibleEvents = page.locator('[data-testid="calendar-event"]:visible')
      await expect(visibleEvents).toHaveCountGreaterThan(0)
      
      // All visible events should be business trips
      for (let i = 0; i < await visibleEvents.count(); i++) {
        await expect(visibleEvents.nth(i).locator('[data-testid="business-trip-icon"]')).toBeVisible()
      }
    }
  })
})