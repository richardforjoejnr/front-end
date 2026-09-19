import { type Page, expect } from '@playwright/test';

import environment from '../../config';
import { content } from '../data/Chat.content';
import BasePage from './Base.page';

/**
 * The chat page at `/`.
 *
 * Every locator is a getter here rather than inline in a spec, and every one resolves a
 * `data-test` value from docs/playwright-locator-strategy.md — scope `chat`.
 */
class ChatPage extends BasePage {
  public constructor(page: Page) {
    super(page, '', { en: content.en });
  }

  /*
  #############
  # Locators - UI elements specific to the page
  #############
  */

  get container() {
    return this.page.getByTestId('chat-page');
  }

  get title() {
    return this.page.getByTestId('chat-title');
  }

  get sendForm() {
    return this.page.getByTestId('chat-send-form');
  }

  get messageInput() {
    return this.page.getByTestId('chat-message-input');
  }

  get sendButton() {
    return this.page.getByTestId('chat-send-button');
  }

  get messagesTitle() {
    return this.page.getByTestId('chat-messages-title');
  }

  get messagesList() {
    return this.page.getByTestId('chat-messages-list');
  }

  /** Every rendered message, matched on the `chat-messages-list-item-{id}` prefix. */
  get messageItems() {
    return this.page.locator('[data-test^="chat-messages-list-item-"]:not([data-test*="-text-"])');
  }

  /** Every message's text node, in render order. */
  get messageTexts() {
    return this.page.locator('[data-test^="chat-messages-list-item-text-"]');
  }

  messageItem(id: string) {
    return this.page.getByTestId(`chat-messages-list-item-${id}`);
  }

  messageText(id: string) {
    return this.page.getByTestId(`chat-messages-list-item-text-${id}`);
  }

  deleteButton(id: string) {
    return this.page.getByTestId(`chat-messages-list-item-delete-button-${id}`);
  }

  /*
  #############
  # Actions - Interactions with the page
  #############
  */

  async sendMessage(text: string) {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }

  async deleteMessage(id: string) {
    await this.deleteButton(id).click();
  }

  async getMessageTexts(): Promise<string[]> {
    return this.messageTexts.allTextContents();
  }

  /*
  #############
  # Assertions - Assertions on the page
  #############
  */

  async shouldBeLoaded() {
    await expect(this.title).toHaveText(this.content.title);
    await expect(this.messagesTitle).toHaveText(this.content.messagesTitle);
    await expect(this.messageInput).toBeVisible();
    await expect(this.sendButton).toHaveText(this.content.sendButton);
    await expect(this.messagesList).toBeAttached();
  }

  async shouldShowMessage(id: string, text: string) {
    await expect(this.messageItem(id)).toBeVisible({ timeout: environment.realtimeTimeout });
    await expect(this.messageText(id)).toHaveText(text);
  }

  async shouldNotShowMessage(id: string) {
    await expect(this.messageItem(id)).toHaveCount(0, { timeout: environment.realtimeTimeout });
  }

  async shouldHaveDeleteButton(id: string) {
    const button = this.deleteButton(id);

    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('aria-label', this.content.deleteButtonLabel);
  }

  async shouldHaveEmptyInput() {
    await expect(this.messageInput).toHaveValue('');
  }

  /** Message text must never be parsed as HTML, whoever sent it. */
  async shouldNotRenderHtmlIn(id: string) {
    await expect(this.messageText(id).locator('img, b, script')).toHaveCount(0);
  }

  async shouldNotHaveDocumentTitle(title: string) {
    await expect(this.page).not.toHaveTitle(title);
  }

  async shouldShowMessageWithText(text: string, count = 1) {
    await expect(this.messageTexts.filter({ hasText: text })).toHaveCount(count, {
      timeout: environment.realtimeTimeout,
    });
  }
}

export default ChatPage;
