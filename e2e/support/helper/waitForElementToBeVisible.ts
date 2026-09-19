import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Waits for an element to be visible and asserts that it is.
 *
 * @param page - The page the locator belongs to.
 * @param locator - The locator of the element to assert visibility on.
 * @param timeout - Optional timeout in milliseconds (default: 5000).
 */
export async function waitForElementToBeVisible(page: Page, locator: Locator, timeout = 5000) {
  if (!page.isClosed()) {
    await locator.waitFor({ state: 'visible', timeout });
    await expect(locator).toBeVisible();
  }
}
