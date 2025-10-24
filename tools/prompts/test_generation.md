# Test Generation Prompt

You are an expert TypeScript and React testing engineer. Generate a comprehensive Vitest test file for the following React component.

## Component Code

```typescript
{{component_code}}
```

## Requirements

1. **Testing Framework**: Use Vitest with React Testing Library
2. **Test Coverage**: Include tests for:
   - Component rendering
   - User interactions (clicks, form inputs)
   - Conditional rendering based on props
   - Error states
   - Loading states
   - Data fetching (if applicable)

3. **Code Style**:
   - Use TypeScript with proper typing
   - Follow the existing chanoyu-db testing patterns
   - Use `describe` and `it` blocks
   - Add clear test descriptions
   - Use `screen` queries from React Testing Library
   - Mock Supabase calls when needed

4. **Imports**: Include all necessary imports:
   - `import { describe, it, expect, vi, beforeEach } from 'vitest'`
   - `import { render, screen, fireEvent, waitFor } from '@testing-library/react'`
   - Component and any dependencies

5. **Best Practices**:
   - Test user behavior, not implementation details
   - Use accessible queries (getByRole, getByLabelText)
   - Clean up after each test
   - Mock external dependencies (Supabase, Next.js router, etc.)

## Output Format

Return ONLY the complete test file code. Do not include explanations, markdown formatting, or any text outside the code block.

The test file should be ready to save as-is to the tests directory.
