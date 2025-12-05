import { test, expect } from '@playwright/test'

test.describe('Performance Load Testing', () => {
  test.use({ storageState: 'tests/auth/user.json' })

  test('should handle concurrent dashboard loads', async ({ browser }) => {
    const contexts = []
    const pages = []
    const loadTimes = []
    
    // Create multiple browser contexts to simulate concurrent users
    for (let i = 0; i < 10; i++) {
      const context = await browser.newContext()
      contexts.push(context)
      pages.push(await context.newPage())
    }

    try {
      // Measure concurrent dashboard loads
      const startTime = performance.now()
      
      const loadPromises = pages.map(async (page, index) => {
        const pageStartTime = performance.now()
        await page.goto('/dashboard')
        await page.waitForLoadState('networkidle')
        await page.waitForSelector('[data-testid="dashboard-container"]')
        const pageEndTime = performance.now()
        
        loadTimes.push(pageEndTime - pageStartTime)
        console.log(`Page ${index + 1} loaded in ${pageEndTime - pageStartTime}ms`)
      })

      await Promise.all(loadPromises)
      const endTime = performance.now()
      
      const totalTime = endTime - startTime
      const averageLoadTime = loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length
      const maxLoadTime = Math.max(...loadTimes)
      
      console.log(`Total time for ${pages.length} concurrent loads: ${totalTime}ms`)
      console.log(`Average load time: ${averageLoadTime}ms`)
      console.log(`Max load time: ${maxLoadTime}ms`)
      
      // Performance assertions
      expect(averageLoadTime).toBeLessThan(5000) // Average should be under 5 seconds
      expect(maxLoadTime).toBeLessThan(10000) // No single load should exceed 10 seconds
      
    } finally {
      // Clean up
      for (const context of contexts) {
        await context.close()
      }
    }
  })

  test('should handle large employee dataset performance', async ({ page }) => {
    // Navigate to employees page
    await page.goto('/employees')
    
    // Measure initial load
    const startTime = performance.now()
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="employee-table"]')
    const loadTime = performance.now() - startTime
    
    console.log(`Employee table loaded in ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000) // Should load within 3 seconds
    
    // Test search performance
    const searchStartTime = performance.now()
    await page.fill('[data-testid="search-input"]', 'Test')
    await page.waitForTimeout(500) // Wait for debounce
    await page.waitForLoadState('networkidle')
    const searchTime = performance.now() - searchStartTime
    
    console.log(`Search completed in ${searchTime}ms`)
    expect(searchTime).toBeLessThan(2000) // Search should be fast
    
    // Test pagination performance
    const paginationButton = page.locator('[data-testid="next-page-button"]')
    if (await paginationButton.isVisible() && await paginationButton.isEnabled()) {
      const pageStartTime = performance.now()
      await paginationButton.click()
      await page.waitForLoadState('networkidle')
      const pageTime = performance.now() - pageStartTime
      
      console.log(`Pagination completed in ${pageTime}ms`)
      expect(pageTime).toBeLessThan(2000)
    }
  })

  test('should handle workload management performance', async ({ page }) => {
    await page.goto('/workload')
    
    // Measure initial load
    const startTime = performance.now()
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="workload-table"]')
    const loadTime = performance.now() - startTime
    
    console.log(`Workload table loaded in ${loadTime}ms`)
    expect(loadTime).toBeLessThan(3000)
    
    // Test filter performance
    const filterStartTime = performance.now()
    await page.selectOption('[data-testid="status-filter"]', 'TODO')
    await page.waitForLoadState('networkidle')
    const filterTime = performance.now() - filterStartTime
    
    console.log(`Status filter applied in ${filterTime}ms`)
    expect(filterTime).toBeLessThan(2000)
    
    // Test workload creation performance
    const createStartTime = performance.now()
    await page.click('[data-testid="add-workload-button"]')
    await page.waitForSelector('[data-testid="workload-form"]')
    const createTime = performance.now() - createStartTime
    
    console.log(`Workload form opened in ${createTime}ms`)
    expect(createTime).toBeLessThan(1000)
  })

  test('should handle calendar performance with many events', async ({ page }) => {
    await page.goto('/calendar')
    
    // Measure calendar load
    const startTime = performance.now()
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="calendar-container"]')
    const loadTime = performance.now() - startTime
    
    console.log(`Calendar loaded in ${loadTime}ms`)
    expect(loadTime).toBeLessThan(4000) // Calendar might be slower due to complexity
    
    // Test month navigation performance
    const navStartTime = performance.now()
    await page.click('[data-testid="next-month-button"]')
    await page.waitForLoadState('networkidle')
    const navTime = performance.now() - navStartTime
    
    console.log(`Month navigation completed in ${navTime}ms`)
    expect(navTime).toBeLessThan(1500)
    
    // Test event creation modal performance
    const modalStartTime = performance.now()
    await page.click('[data-testid="add-event-button"]')
    await page.waitForSelector('[data-testid="event-form"]')
    const modalTime = performance.now() - modalStartTime
    
    console.log(`Event form opened in ${modalTime}ms`)
    expect(modalTime).toBeLessThan(1000)
  })

  test('should handle API response times', async ({ page }) => {
    // Intercept and measure API calls
    const apiTimes: { [key: string]: number } = {}
    
    await page.route('/api/**', async (route) => {
      const startTime = performance.now()
      await route.continue()
      const endTime = performance.now()
      const apiPath = new URL(route.request().url()).pathname
      apiTimes[apiPath] = endTime - startTime
    })
    
    // Navigate through different pages to trigger API calls
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    await page.goto('/employees')
    await page.waitForLoadState('networkidle')
    
    await page.goto('/workload')
    await page.waitForLoadState('networkidle')
    
    await page.goto('/calendar')
    await page.waitForLoadState('networkidle')
    
    // Log API performance
    console.log('API Response Times:')
    Object.entries(apiTimes).forEach(([api, time]) => {
      console.log(`${api}: ${time}ms`)
      
      // Assert reasonable API response times
      if (api.includes('/api/health')) {
        expect(time).toBeLessThan(500) // Health checks should be very fast
      } else if (api.includes('/api/dashboard/stats')) {
        expect(time).toBeLessThan(2000) // Dashboard stats
      } else {
        expect(time).toBeLessThan(3000) // General API calls
      }
    })
  })

  test('should monitor memory usage during heavy operations', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')
    
    // Simulate heavy operations
    const operations = [
      () => page.goto('/employees'),
      () => page.fill('[data-testid="search-input"]', 'test'),
      () => page.goto('/workload'),
      () => page.click('[data-testid="add-workload-button"]'),
      () => page.goto('/calendar'),
      () => page.click('[data-testid="next-month-button"]'),
      () => page.click('[data-testid="prev-month-button"]'),
    ]
    
    // Monitor performance metrics
    const metrics = []
    
    for (const operation of operations) {
      const startMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0)
      
      await operation()
      await page.waitForLoadState('networkidle')
      
      const endMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize || 0)
      
      metrics.push({
        operation: operation.name,
        memoryDelta: endMemory - startMemory,
        totalMemory: endMemory,
      })
    }
    
    // Log memory usage
    console.log('Memory Usage During Operations:')
    metrics.forEach(metric => {
      console.log(`${metric.operation}: Delta ${metric.memoryDelta} bytes, Total ${metric.totalMemory} bytes`)
    })
    
    // Assert no excessive memory usage (adjust thresholds as needed)
    const maxMemory = Math.max(...metrics.map(m => m.totalMemory))
    expect(maxMemory).toBeLessThan(100 * 1024 * 1024) // Less than 100MB
  })

  test('should handle database performance under load', async ({ page }) => {
    // This test measures database-heavy operations
    
    // Health check - should be fast
    let startTime = performance.now()
    const healthResponse = await page.request.get('/api/health')
    let endTime = performance.now()
    
    expect(healthResponse.status()).toBe(200)
    console.log(`Health check: ${endTime - startTime}ms`)
    expect(endTime - startTime).toBeLessThan(1000)
    
    // Employee listing - database query
    startTime = performance.now()
    const employeesResponse = await page.request.get('/api/employees')
    endTime = performance.now()
    
    expect(employeesResponse.status()).toBe(200)
    console.log(`Employee listing: ${endTime - startTime}ms`)
    expect(endTime - startTime).toBeLessThan(2000)
    
    // Dashboard stats - multiple queries
    startTime = performance.now()
    const statsResponse = await page.request.get('/api/dashboard/stats')
    endTime = performance.now()
    
    expect(statsResponse.status()).toBe(200)
    console.log(`Dashboard stats: ${endTime - startTime}ms`)
    expect(endTime - startTime).toBeLessThan(3000)
  })
})