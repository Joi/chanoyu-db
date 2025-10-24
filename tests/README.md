# Testing Guide

This guide covers everything you need to know about testing in the Chanoyu Database project.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run a specific test file
npm test tests/unit/components/ObjectCard.test.tsx

# Run tests matching a pattern
npm test ObjectCard
```

## Directory Structure

```
tests/
├── setup.ts          # Global test setup and mocks
├── helpers.ts        # Test utilities and helpers
├── fixtures.ts       # Test data builders
├── unit/            # Unit tests
│   ├── lib/         # Library function tests
│   └── components/  # Component tests
└── integration/     # Integration tests
    ├── api/         # API route tests
    └── components/  # Full component integration tests
```

## Where to Put Tests

### Unit Tests (`tests/unit/`)

Test individual functions and components in isolation:

- **`tests/unit/lib/`** - Pure functions, utilities, hooks
- **`tests/unit/components/`** - Individual React components

### Integration Tests (`tests/integration/`)

Test how multiple parts work together:

- **`tests/integration/api/`** - API routes with mocked database
- **`tests/integration/components/`** - Components with all dependencies

## Test Patterns

### Testing a Component

```typescript
// tests/unit/components/ObjectCard.test.tsx
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { ObjectCard } from '@/components/ObjectCard'
import { renderWithProviders } from '@/tests/helpers'
import { fixtures } from '@/tests/fixtures'

describe('ObjectCard', () => {
  it('displays object information', () => {
    const testObject = fixtures.object({
      name_en: 'Beautiful Tea Bowl',
      classification: 'tea_bowl'
    })

    renderWithProviders(<ObjectCard object={testObject} />)

    expect(screen.getByText('Beautiful Tea Bowl')).toBeInTheDocument()
    expect(screen.getByText('Tea Bowl')).toBeInTheDocument()
  })

  it('shows placeholder when no image', () => {
    const testObject = fixtures.object({ image_url: null })

    renderWithProviders(<ObjectCard object={testObject} />)

    expect(screen.getByAltText(/no image/i)).toBeInTheDocument()
  })
})
```

### Testing with User Interaction

```typescript
// tests/unit/components/SearchBar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchBar } from '@/components/SearchBar'
import { renderWithProviders } from '@/tests/helpers'

describe('SearchBar', () => {
  it('calls onSearch when user types', async () => {
    const onSearch = vi.fn()

    renderWithProviders(<SearchBar onSearch={onSearch} />)

    const input = screen.getByPlaceholderText('Search objects...')
    fireEvent.change(input, { target: { value: 'tea bowl' } })

    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledWith('tea bowl')
    })
  })
})
```

### Testing API Routes

```typescript
// tests/integration/api/objects.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { GET } from '@/app/api/objects/route'
import { mockSupabaseQuery, resetMocks } from '@/tests/helpers'
import { fixtures } from '@/tests/fixtures'

describe('GET /api/objects', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('returns list of objects', async () => {
    const testObjects = fixtures.objects(3)
    mockSupabaseQuery(testObjects)

    const request = new Request('http://localhost:3000/api/objects')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(3)
    expect(data[0].name_en).toBe(testObjects[0].name_en)
  })

  it('handles database errors', async () => {
    mockSupabaseQuery(null, { error: new Error('Database error') })

    const request = new Request('http://localhost:3000/api/objects')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})
```

### Testing Authentication

```typescript
// tests/unit/lib/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { checkIsAdmin } from '@/lib/auth'
import { mockAdmin, mockOwner, mockAuthUser, resetMocks } from '@/tests/helpers'

describe('checkIsAdmin', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('returns true for admin users', async () => {
    mockAdmin()
    const isAdmin = await checkIsAdmin()
    expect(isAdmin).toBe(true)
  })

  it('returns false for regular users', async () => {
    mockAuthUser()
    const isAdmin = await checkIsAdmin()
    expect(isAdmin).toBe(false)
  })

  it('returns false for owners', async () => {
    mockOwner()
    const isAdmin = await checkIsAdmin()
    expect(isAdmin).toBe(false)
  })
})
```

### Testing with Mock Data

```typescript
// tests/integration/components/ObjectList.test.tsx
import { describe, it, expect } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { ObjectList } from '@/components/ObjectList'
import { renderWithProviders, mockSupabaseQuery } from '@/tests/helpers'
import { fixtures } from '@/tests/fixtures'

describe('ObjectList', () => {
  it('displays multiple objects', async () => {
    const testObjects = fixtures.objects(5, {
      account_id: 'user-123'
    })
    mockSupabaseQuery(testObjects)

    renderWithProviders(<ObjectList accountId="user-123" />)

    await waitFor(() => {
      expect(screen.getAllByTestId('object-card')).toHaveLength(5)
    })
  })

  it('shows empty state when no objects', async () => {
    mockSupabaseQuery([])

    renderWithProviders(<ObjectList accountId="user-123" />)

    await waitFor(() => {
      expect(screen.getByText('No objects found')).toBeInTheDocument()
    })
  })
})
```

## Test Utilities

### `renderWithProviders`

Wraps components with all necessary providers:

```typescript
renderWithProviders(<MyComponent />, {
  // Optional: override default render options
})
```

### `mockSupabaseQuery`

Mock Supabase database responses:

```typescript
// Success response
mockSupabaseQuery(data)

// Error response
mockSupabaseQuery(null, { error: new Error('Failed') })

// With count
mockSupabaseQuery(data, { count: 100 })
```

### `mockAuthUser` / `mockAdmin` / `mockOwner`

Set up authentication state:

```typescript
// Regular user
mockAuthUser({
  id: 'custom-id',
  email: 'user@example.com'
})

// Admin user
mockAdmin()

// Owner user
mockOwner()
```

### `fixtures`

Create test data with sensible defaults:

```typescript
// Single items
const obj = fixtures.object({ name_en: 'Custom Name' })
const account = fixtures.account()
const media = fixtures.media()

// Multiple items
const objects = fixtures.objects(10)
const accounts = fixtures.accounts(5, { role: 'admin' })

// Reset ID counter between test suites
fixtures.resetIdCounter()
```

## Best Practices

### 1. Test Behavior, Not Implementation

❌ **Bad:** Testing internal state
```typescript
expect(component.state.isLoading).toBe(true)
```

✅ **Good:** Testing visible behavior
```typescript
expect(screen.getByText('Loading...')).toBeInTheDocument()
```

### 2. Use Realistic Test Data

❌ **Bad:** Using meaningless data
```typescript
const object = { id: '1', name: 'test', data: 'foo' }
```

✅ **Good:** Using fixtures with realistic data
```typescript
const object = fixtures.object({
  name_en: 'Raku Tea Bowl',
  period: 'momoyama'
})
```

### 3. Keep Tests Focused

❌ **Bad:** Testing multiple things
```typescript
it('works correctly', () => {
  // Tests rendering, interaction, validation, and API calls
})
```

✅ **Good:** One concept per test
```typescript
it('displays object name', () => { /* ... */ })
it('handles click events', () => { /* ... */ })
it('validates input', () => { /* ... */ })
```

### 4. Clean Up After Tests

Always reset mocks between tests:

```typescript
import { beforeEach } from 'vitest'
import { resetMocks } from '@/tests/helpers'

beforeEach(() => {
  resetMocks()
})
```

### 5. Use Descriptive Test Names

❌ **Bad:** Vague names
```typescript
it('works', () => {})
it('handles error', () => {})
```

✅ **Good:** Clear, specific names
```typescript
it('displays error message when object fails to load', () => {})
it('disables submit button while form is submitting', () => {})
```

## Common Testing Scenarios

### Testing Loading States

```typescript
it('shows loading spinner while fetching', () => {
  renderWithProviders(<MyComponent />)
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
})
```

### Testing Error States

```typescript
it('displays error message on failure', async () => {
  mockSupabaseQuery(null, { error: new Error('Network error') })

  renderWithProviders(<MyComponent />)

  await waitFor(() => {
    expect(screen.getByText(/network error/i)).toBeInTheDocument()
  })
})
```

### Testing Forms

```typescript
it('submits form with correct data', async () => {
  const onSubmit = vi.fn()
  renderWithProviders(<MyForm onSubmit={onSubmit} />)

  fireEvent.change(screen.getByLabelText('Name'), {
    target: { value: 'Test Object' }
  })
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Test Object'
    })
  })
})
```

### Testing Protected Routes

```typescript
it('redirects to login when not authenticated', () => {
  // No auth mock = unauthenticated
  renderWithProviders(<ProtectedComponent />)

  expect(mockRouter.push).toHaveBeenCalledWith('/login')
})

it('renders content when authenticated', () => {
  mockAuthUser()
  renderWithProviders(<ProtectedComponent />)

  expect(screen.getByText('Protected Content')).toBeInTheDocument()
})
```

## Debugging Tests

### View the Component Output

```typescript
import { debug } from '@testing-library/react'

it('debug test', () => {
  const { container } = renderWithProviders(<MyComponent />)
  debug(container) // Prints HTML to console
})
```

### Use `screen.debug()`

```typescript
it('debug specific element', () => {
  renderWithProviders(<MyComponent />)
  screen.debug() // Prints entire document
  screen.debug(screen.getByTestId('my-element')) // Prints specific element
})
```

### Check What's Available

```typescript
// See all elements with specific role
screen.getAllByRole('button')

// See all elements with text
screen.getAllByText(/tea/i)

// Use logRoles to see all ARIA roles
import { logRoles } from '@testing-library/react'
logRoles(container)
```

## Running Tests in CI/CD

The test suite is configured to run automatically in CI:

1. **Pre-commit:** Runs affected tests
2. **Pull Request:** Runs full test suite with coverage
3. **Main branch:** Runs full test suite

Coverage thresholds are enforced:
- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

## Troubleshooting

### "Cannot find module '@/...'"

Ensure TypeScript paths are configured in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### "ReferenceError: document is not defined"

Make sure test file is using jsdom environment (configured in `vitest.config.ts`).

### Supabase Mock Not Working

Check that you've called `resetMocks()` in `beforeEach`:

```typescript
import { beforeEach } from 'vitest'
import { resetMocks } from '@/tests/helpers'

beforeEach(() => {
  resetMocks()
})
```

### Async Tests Timing Out

Use `waitFor` for async operations:

```typescript
import { waitFor } from '@testing-library/react'

await waitFor(() => {
  expect(screen.getByText('Loaded')).toBeInTheDocument()
}, { timeout: 3000 }) // Increase timeout if needed
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)