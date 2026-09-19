import { test as base, expect } from '@playwright/test';

/**
 * A page that throws in the browser has failed, even when the assertions pass. Every test
 * fails on an uncaught page error unless it opts out with `test.use({ failOnJSError: false })`.
 */
export const logger = base.extend<{ page: void; failOnJSError: boolean }>({
  failOnJSError: [true, { option: true }],

  page: async ({ page, failOnJSError }, use) => {
    const errors: Error[] = [];

    page.addListener('pageerror', error => errors.push(error));

    await use(page);

    if (failOnJSError && errors.length > 0) {
      expect(errors.map(error => error.message).join('\n')).toBe('');
    }
  },
});

export { expect } from '@playwright/test';
