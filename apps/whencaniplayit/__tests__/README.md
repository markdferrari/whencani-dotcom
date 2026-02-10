# Testing Guide

This project uses Jest and React Testing Library for unit testing.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

- `lib/__tests__/` - Unit tests for utility functions
- `components/__tests__/` - Unit tests for React components

## What's Tested

### Utility Functions (`lib/`)
- `formatReleaseDate` - Date formatting logic
- `getGameNote` - Reading and parsing markdown notes
- `getAllGameNotes` - Listing all note files

### React Components (`components/`)
- `GameCard` - Game card rendering and links
- `PlatformFilter` - Platform selection and navigation

## Writing New Tests

1. Create a test file next to the code being tested:
   - For `lib/myfile.ts`, create `lib/__tests__/myfile.test.ts`
   - For `components/MyComponent.tsx`, create `components/__tests__/MyComponent.test.tsx`

2. Follow the existing test patterns for consistency

3. Run tests to verify: `npm test`
