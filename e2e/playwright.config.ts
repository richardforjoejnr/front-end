import { defineConfig, devices } from '@playwright/test';

import environment from './config';

const isCI = Boolean(process.env.CI);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './support/global-setup',
  timeout: isCI ? 45000 : 30000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['list'], ['html'], ['json', { outputFile: 'results.json' }]] : [['list'], ['html']],

  use: {
    baseURL: environment.baseUrl,
    // Every locator in this suite resolves data-test, never data-testid.
    // See docs/playwright-locator-strategy.md
    testIdAttribute: 'data-test',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  // Add firefox / webkit here when cross-browser coverage is wanted, and install them
  // with `npx playwright install firefox webkit`.
  projects: [
    {
      name: 'chromium',
      testDir: './tests/Chat',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // API tests need no browser, so they run without one
      name: 'api',
      testDir: './tests/Api',
    },
  ],
});
