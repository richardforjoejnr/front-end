import { test as base } from '@playwright/test';

/**
 * Hooks that apply to every test and every worker, without each spec repeating them.
 */
export const beforeAfterManager = base.extend<{ forEachTest: void }, { forEachWorker: void }>({
  forEachWorker: [
    async ({}, use) => {
      await use();
    },
    { scope: 'worker', auto: true },
  ],

  // Deliberately does not depend on `page`: an auto fixture that did would launch a
  // browser for the API project, which needs none.
  forEachTest: [
    async ({}, use, testInfo) => {
      await use();

      if (testInfo.status !== testInfo.expectedStatus) {
        testInfo.annotations.push({ type: 'environment', description: process.env.NODE_ENV ?? 'localhost' });
      }
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
