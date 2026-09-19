import { mergeTests } from '@playwright/test';

import ChatPage from '../pages/Chat.page';
import { messagesDataManagerFixture } from './messagesDataManager.fixture';
import { usersDataManagerFixture } from './usersDataManager.fixture';

/**
 * Page objects are fixtures, so a spec asks for `chatPage` instead of constructing one.
 * Extending the data manager rather than `base` keeps a single merged chain.
 */
export const pageInstance = mergeTests(messagesDataManagerFixture, usersDataManagerFixture).extend<{
  chatPage: ChatPage;
}>({
  chatPage: async ({ page }, use) => {
    await use(new ChatPage(page));
  },
});
