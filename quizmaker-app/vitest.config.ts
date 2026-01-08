/**
 * Vitest Configuration
 *
 * Configuration for running unit tests with Vitest.
 * Includes path aliases that match tsconfig.json for consistent imports.
 *
 * @fileoverview Vitest configuration for QuizMaker application
 *
 * Usage:
 *   npm run test           - Run all tests once
 *   npm run test:watch     - Run tests in watch mode
 *   npm run test:coverage  - Run tests with coverage report
 *   npm run test:ui        - Run tests with Vitest UI
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Global test configuration
    globals: true, // Enable global test functions (describe, it, expect)

    // Test environment
    environment: 'node', // Use Node.js environment (not jsdom)

    // Include patterns for test files
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'src/**/*.spec.ts',
      'src/**/*.spec.tsx',
    ],

    // Exclude patterns
    exclude: [
      'node_modules',
      '.next',
      '.wrangler',
      'dist',
    ],

    // Coverage configuration
    coverage: {
      // Coverage provider
      provider: 'v8',

      // Files to include in coverage
      include: [
        'src/lib/services/**/*.ts',
        'src/lib/*.ts',
      ],

      // Files to exclude from coverage
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/**/*.d.ts',
        'node_modules/**',
      ],

      // Coverage reporters
      reporter: ['text', 'text-summary', 'html', 'lcov'],

      // Coverage thresholds (optional - uncomment to enforce)
      // thresholds: {
      //   statements: 80,
      //   branches: 70,
      //   functions: 80,
      //   lines: 80,
      // },

      // Output directory for coverage reports
      reportsDirectory: './coverage',
    },

    // Reporter configuration
    reporters: ['default', 'verbose'],

    // Setup files to run before tests
    // setupFiles: ['./src/test/setup.ts'],

    // Test timeout (ms)
    testTimeout: 10000,

    // Hook timeout (ms)
    hookTimeout: 10000,

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks after each test
    restoreMocks: true,

    // Mock reset configuration
    mockReset: true,

    // Isolate tests from each other
    isolate: true,

    // Parallel execution
    pool: 'forks', // Use process forking for isolation
    poolOptions: {
      forks: {
        singleFork: false, // Allow multiple forks for parallelism
      },
    },
  },

  // Path resolution (matches tsconfig.json)
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Disable CSS processing for tests (not needed for service layer tests)
  css: {
    postcss: {
      plugins: [],
    },
  },
});

