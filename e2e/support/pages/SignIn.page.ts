import { type Page, expect } from '@playwright/test';

import { content } from '../data/Chat.content';
import type { Credentials } from '../helper/utils/api/authRequests';
import BasePage from './Base.page';

/**
 * The sign-in form the chat page shows until a session exists. It is the same URL as the
 * chat; which of the two is visible is decided by `reAuthenticate()` on load.
 */
class SignInPage extends BasePage {
  public constructor(page: Page) {
    super(page, '', { en: content.en });
  }

  /*
  #############
  # Locators - UI elements specific to the page
  #############
  */

  get container() {
    return this.page.getByTestId('login-page');
  }

  get title() {
    return this.page.getByTestId('login-title');
  }

  get form() {
    return this.page.getByTestId('login-form');
  }

  get emailInput() {
    return this.page.getByTestId('login-email-input');
  }

  get passwordInput() {
    return this.page.getByTestId('login-password-input');
  }

  get submitButton() {
    return this.page.getByTestId('login-submit-button');
  }

  get registerButton() {
    return this.page.getByTestId('login-register-button');
  }

  get errorAlert() {
    return this.page.getByTestId('login-error-alert');
  }

  /*
  #############
  # Actions - Interactions with the page
  #############
  */

  async signIn({ email, password }: Credentials) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async register({ email, password }: Credentials) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.registerButton.click();
  }

  /** The JWT the page stored, or null when there is no session. */
  async storedToken(): Promise<string | null> {
    return this.page.evaluate(() => window.localStorage.getItem('feathers-jwt'));
  }

  /*
  #############
  # Assertions - Assertions on the page
  #############
  */

  async shouldBeLoaded() {
    await expect(this.container).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toHaveText(content.en.signInButton);
  }

  async shouldShowError(message: string) {
    await expect(this.errorAlert).toBeVisible();
    await expect(this.errorAlert).toHaveText(message);
  }

  async shouldNotShowError() {
    await expect(this.errorAlert).toBeHidden();
  }

  async shouldMaskThePassword() {
    await expect(this.passwordInput).toHaveAttribute('type', 'password');
  }
}

export default SignInPage;
