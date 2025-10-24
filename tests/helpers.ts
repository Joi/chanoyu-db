import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'
import { vi } from 'vitest'

// Types for mock data
interface MockSupabaseOptions<T> {
  data?: T
  error?: any
  count?: number
}

interface MockUser {
  id: string
  email: string
  role?: 'admin' | 'owner' | 'member'
  metadata?: Record<string, any>
}

/**
 * Render component with all required providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  // Add any global providers here if needed in future
  // For now, just pass through to regular render
  return render(ui, options)
}

/**
 * Mock a Supabase query response
 * This creates a chainable mock that simulates Supabase query builder
 */
export function mockSupabaseQuery<T = any>(
  data: T,
  options: Partial<MockSupabaseOptions<T>> = {}
) {
  const mockResponse = {
    data: options.error ? null : data,
    error: options.error || null,
    count: options.count,
  }

  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    then: vi.fn((cb: any) => cb(mockResponse)),
  }

  // Return the mock chain for use in tests
  return mockChain
}

/**
 * Mock an authenticated user
 * Sets up the global mocks to return an authenticated session
 */
export function mockAuthUser(user: Partial<MockUser> = {}) {
  const mockUser = {
    id: user.id || 'test-user-id',
    email: user.email || 'test@example.com',
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: {
      ...user.metadata,
    },
    aud: 'authenticated',
    role: user.role || 'member',
    created_at: new Date().toISOString(),
  }

  const mockSession = {
    user: mockUser,
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000,
  }

  // These will be picked up by any code that imports from @/lib/supabase
  // since we've mocked those modules in setup.ts
  return mockUser
}

/**
 * Mock an admin user
 */
export function mockAdmin() {
  return mockAuthUser({
    id: 'admin-user-id',
    email: 'admin@example.com',
    role: 'admin',
    metadata: { isAdmin: true },
  })
}

/**
 * Mock an owner user
 */
export function mockOwner() {
  return mockAuthUser({
    id: 'owner-user-id',
    email: 'owner@example.com',
    role: 'owner',
    metadata: { isOwner: true },
  })
}

/**
 * Reset all mocks to default state
 */
export function resetMocks() {
  vi.clearAllMocks()
}