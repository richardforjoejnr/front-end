import { type Page, expect } from '@playwright/test';

type Translations = {
  [languageCode: string]: Record<string, string>;
};

/**
 * Shared behaviour for every page object: navigation, and the assertions that are
 * true of any page in the app.
 */
class BasePage {
  /** Public so a spec can reach Playwright's own page APIs when no locator fits. */
  public page: Page;
  protected hash: string;
  protected translations: Translations;

  public constructor(page: Page, hash: string, translations: Translations) {
    this.page = page;
    this.hash = hash;
    this.translations = translations;
  }

  get content() {
    return this.translations.en;
  }

  /*
  #############
  # Actions - Common actions on the page
  #############
  */

  async visit() {
    await this.page.goto(`/${this.hash}`);
  }

  async reload() {
    await this.page.reload();
  }

  /*
  #############
  # Assertions - Common assertions on the page
  #############
  */

  async shouldBeLoaded() {
    await expect(this.page).toHaveURL(new RegExp(`${this.hash}$`));
  }
}

export default BasePage;
