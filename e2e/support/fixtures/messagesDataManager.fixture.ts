import { type APIRequestContext, test as base, expect } from '@playwright/test';

import { generateUniqueName } from '../helper';
import {
  type Message,
  type MessagePage,
  createMessage,
  findMessages,
  newMessagesContext,
  removeMessage,
} from '../helper/utils/api/messagesRequests';

export interface MessagesDataManager {
  api: APIRequestContext;
  /** Creates a message through the API and removes it when the test ends. */
  create(text?: string): Promise<Message>;
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
 */
export const messagesDataManagerFixture = base.extend<{ messagesDataManager: MessagesDataManager }>({
  messagesDataManager: async ({}, use) => {
    const api = await newMessagesContext();
    const created = new Set<string>();

    const manager: MessagesDataManager = {
      api,

      uniqueText(prefix = 'Playwright') {
        return generateUniqueName(prefix);
      },

      async create(text = generateUniqueName('Playwright')) {
        const response = await createMessage(api, { text });

        expect(response.status(), `Could not seed a message: ${await response.text()}`).toBe(201);

        const message = (await response.json()) as Message;
        created.add(message._id);

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
        created.add(id);
      },

      untrack(id) {
        created.delete(id);
      },
    };

    await use(manager);

    // Ignore anything the test already deleted itself
    for (const id of created) {
      await removeMessage(api, id).catch(() => undefined);
    }

    await api.dispose();
  },
});
