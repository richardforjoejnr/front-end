import { type APIRequestContext, expect, mergeTests } from '@playwright/test';

import { generateUniqueName } from '../helper';
import { chatUserFixture } from './chatUser.fixture';
import { usersDataManagerFixture } from './usersDataManager.fixture';
import {
  type Message,
  type MessagePage,
  createMessage,
  findMessages,
  newMessagesContext,
  removeMessage,
} from '../helper/utils/api/messagesRequests';

export interface MessagesDataManager {
  /** Every request on this context is made as the worker's `chatUser`. */
  api: APIRequestContext;
  /** Creates a message as `chatUser` through the API and removes it when the test ends. */
  create(text?: string): Promise<Message>;
  /** Creates a message as somebody else, for the rules about messages that are not yours. */
  createAs(author: { accessToken: string }, text?: string): Promise<Message>;
  createMany(count: number, prefix?: string): Promise<Message[]>;
  find(query?: Record<string, string | number>): Promise<MessagePage>;
  findByText(text: string): Promise<Message[]>;
  /** Cleans up a message the test created through the UI rather than the API. */
  track(id: string): void;
  /** Stops tracking a message the test deleted itself, so teardown does not 404. */
  untrack(id: string): void;
  uniqueText(prefix?: string): string;
}

/**
 * Tests share one database, so each test cleans up only what it created. Deleting
 * everything would break the other tests running in parallel.
 *
 * Only the author can delete a message, so the manager seeds as `chatUser` — the user the
 * chat specs are signed in as — and remembers the token of anything seeded as someone else.
 * Depending on `usersDataManager` makes this tear down first, while those users still exist.
 */
export const messagesDataManagerFixture = mergeTests(chatUserFixture, usersDataManagerFixture).extend<{
  messagesDataManager: MessagesDataManager;
}>({
  messagesDataManager: async ({ chatUser, usersDataManager: _usersDataManager }, use) => {
    const api = await newMessagesContext(chatUser.accessToken);
    // Message id -> the token to delete it with, when that is not chatUser's
    const created = new Map<string, string | undefined>();

    const manager: MessagesDataManager = {
      api,

      uniqueText(prefix = 'Playwright') {
        return generateUniqueName(prefix);
      },

      async create(text = generateUniqueName('Playwright')) {
        const response = await createMessage(api, { text });

        expect(response.status(), `Could not seed a message: ${await response.text()}`).toBe(201);

        const message = (await response.json()) as Message;
        created.set(message._id, undefined);

        return message;
      },

      async createAs(author, text = generateUniqueName('Playwright')) {
        const response = await createMessage(api, { text }, author.accessToken);

        expect(response.status(), `Could not seed a message: ${await response.text()}`).toBe(201);

        const message = (await response.json()) as Message;
        created.set(message._id, author.accessToken);

        return message;
      },

      async createMany(count, prefix = 'Playwright') {
        const messages: Message[] = [];

        for (let index = 0; index < count; index++) {
          messages.push(await manager.create(`${generateUniqueName(prefix)} ${index}`));
        }

        return messages;
      },

      async find(query = {}) {
        const response = await findMessages(api, query);

        expect(response.ok(), `Could not read messages: ${await response.text()}`).toBeTruthy();

        return (await response.json()) as MessagePage;
      },

      async findByText(text) {
        const page = await manager.find({ text });

        return page.data;
      },

      track(id) {
        created.set(id, undefined);
      },

      untrack(id) {
        created.delete(id);
      },
    };

    await use(manager);

    // Ignore anything the test already deleted itself
    for (const [id, accessToken] of created) {
      await removeMessage(api, id, accessToken).catch(() => undefined);
    }

    await api.dispose();
  },
});
