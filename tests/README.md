# Comprehensive Testing Infrastructure

This directory contains the complete testing suite for the Workload Management System fullstack migration. Our testing infrastructure ensures 100% feature parity and UI preservation during the migration from Supabase to the custom fullstack solution.

## Testing Structure

```
tests/
├── auth/                     # Authentication state files for E2E tests
├── e2e/                      # End-to-end tests
│   ├── auth/                 # Authentication setup
│   └── critical-paths/       # Critical user journey tests
├── migration/                # Data migration validation tests
├── performance/              # Performance and load testing
├── unit/                     # Unit tests for components and APIs
│   ├── api/                  # API route tests
│   └── components/           # Component tests
├── utils/                    # Test utilities and helpers
├── visual-regression/        # Visual regression tests
├── global-setup.ts           # Global test setup
├── global-teardown.ts        # Global test cleanup
└── README.md                 # This file
```

## Test Categories

### 1. Unit Tests
- **API Routes**: Test all API endpoints for functionality and edge cases
- **Components**: Test React components with various props and states
- **Utilities**: Test helper functions and business logic
- **Hooks**: Test custom React hooks

**Run**: `npm run test:unit`

### 2. Integration Tests
- **Database Operations**: Test database queries and mutations
- **API Integration**: Test API routes with database interactions
- **Service Integration**: Test service layer integrations

**Run**: `npm run test:integration`

### 3. End-to-End Tests
- **Critical Paths**: Authentication, employee management, workload assignment, calendar events
- **User Journeys**: Complete workflows from start to finish
- **Cross-browser Testing**: Chrome, Firefox, Safari, Mobile

**Run**: `npm run test:e2e`

### 4. Visual Regression Tests
- **UI Preservation**: Ensure UI matches original design exactly
- **Component Screenshots**: Individual component visual testing
- **Responsive Design**: Test across different screen sizes
- **State Variations**: Different UI states (loading, error, empty)

**Run**: `npm run test:visual`

### 5. Performance Tests
- **Load Testing**: Concurrent user simulation
- **Response Times**: API and page load performance
- **Memory Usage**: Browser memory consumption
- **Database Performance**: Query optimization validation

**Run**: `npm run test:performance`

### 6. Migration Validation Tests
- **Data Integrity**: Ensure all data migrated correctly
- **Constraint Validation**: Database constraints and relationships
- **Business Logic**: Migration-specific business rules
- **Rollback Testing**: Ensure rollback capabilities work

**Run**: `npm run test:migration`

## Quick Start

1. **Install dependencies**:
   ```bash
   npm ci
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install
   ```

3. **Setup test database**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Run all tests**:
   ```bash
   npm run test:all
   ```

## Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests |
| `npm run test:watch` | Run unit tests in watch mode |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |
| `npm run test:visual` | Run visual regression tests |
| `npm run test:performance` | Run performance tests |
| `npm run test:migration` | Run migration validation tests |
| `npm run test:all` | Run all test suites |
| `npm run test:ci` | Run tests for CI/CD |

## Configuration Files

- **`jest.config.js`**: Jest configuration for unit tests
- **`jest.setup.js`**: Jest setup and global test utilities
- **`playwright.config.ts`**: Playwright configuration for E2E tests
- **`.github/workflows/comprehensive-testing.yml`**: CI/CD pipeline

## Test Data Management

### Database Setup
The test suite uses a separate test database to ensure isolation:

```typescript
// Automatic setup in global-setup.ts
- Clean database
- Apply migrations
- Seed test data
- Create auth states
```

### Test Users
- **Regular User**: `testuser` / `password`
- **Admin User**: `testadmin` / `password`

### Test Data
- 2 test employees
- 2 test workloads
- 2 test calendar events
- Business trip with linked todos

## Writing Tests

### Unit Tests Example
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Component from '@/components/Component'

describe('Component', () => {
  it('should render correctly', async () => {
    render(<Component />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### E2E Tests Example
```typescript
import { test, expect } from '@playwright/test'

test('should complete user journey', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page.locator('[data-testid="welcome"]')).toBeVisible()
})
```

### API Tests Example
```typescript
import { GET } from '@/app/api/route'
import { APITestHelper } from '@/tests/utils/test-helpers'

describe('API Route', () => {
  it('should return data', async () => {
    const request = APITestHelper.createMockRequest('/api/test')
    const response = await GET(request)
    expect(response.status).toBe(200)
  })
})
```

## Performance Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| Page Load | < 3 seconds | Initial page load time |
| API Response | < 2 seconds | API endpoint response time |
| Search | < 1 second | Search/filter operations |
| Database Query | < 1 second | Individual database queries |
| Memory Usage | < 100MB | Browser memory consumption |

## Visual Regression

Visual tests compare screenshots to detect unintended UI changes:

- **Threshold**: 0.1 (10% pixel difference allowed)
- **Browsers**: Chrome, Firefox, Safari
- **Viewports**: Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)

## Continuous Integration

The CI/CD pipeline runs all tests on:
- **Push to main/develop**
- **Pull requests**
- **Scheduled runs** (nightly)

Pipeline includes:
1. Lint and type checking
2. Unit tests with coverage
3. Integration tests
4. E2E tests (multi-browser)
5. Visual regression tests
6. Performance tests
7. Migration validation
8. Security scans

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database is running
   npm run test:db
   ```

2. **Playwright Browser Issues**
   ```bash
   # Reinstall browsers
   npx playwright install --force
   ```

3. **Test Timeouts**
   - Check if database is seeded
   - Verify test environment variables
   - Check for network issues in CI

4. **Visual Test Failures**
   - Review screenshots in `test-results/`
   - Update baselines if changes are intentional
   - Check for font/rendering differences

### Environment Variables

Required for testing:
```bash
NODE_ENV=test
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db
JWT_SECRET=test-jwt-secret-for-testing-only
REDIS_URL=redis://localhost:6379
```

## Coverage Reports

Test coverage reports are generated for:
- **Unit Tests**: Jest coverage in `coverage/`
- **E2E Tests**: Playwright coverage in `test-results/`

Target coverage: **80%** minimum across all metrics.

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Data Cleanup**: Use test helpers for consistent setup/teardown
3. **Descriptive Names**: Test names should describe behavior
4. **Page Objects**: Use page object pattern for E2E tests
5. **Mock External Services**: Mock APIs and third-party services
6. **Performance Monitoring**: Include performance assertions
7. **Visual Validation**: Take screenshots for critical UI components

## Migration-Specific Testing

Special focus on testing the migration from Supabase to fullstack:

### Feature Parity Validation
- [ ] All original features work identically
- [ ] Data integrity maintained
- [ ] Performance meets or exceeds original
- [ ] UI/UX preserved exactly

### Migration Safety
- [ ] Rollback procedures tested
- [ ] Data backup validation
- [ ] Zero-downtime deployment verified
- [ ] Real-time features continue working

### Post-Migration Validation
- [ ] All user authentication works
- [ ] Employee CRUD operations
- [ ] Workload management features
- [ ] Calendar and event management
- [ ] Dashboard statistics accuracy
- [ ] Real-time updates functioning

This comprehensive testing infrastructure ensures a smooth, risk-free migration with 100% confidence in the new system's reliability and feature parity.