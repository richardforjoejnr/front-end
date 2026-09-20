import ChatPage from '../pages/Chat.page';
import { messagesDataManagerFixture } from './messagesDataManager.fixture';

/**
 * Page objects are fixtures, so a spec asks for `chatPage` instead of constructing one.
 * Extending the data manager rather than `base` keeps a single merged chain; it already
 * carries `chatUser` and `usersDataManager`, which it depends on.
 */
export const pageInstance = messagesDataManagerFixture.extend<{
  chatPage: ChatPage;
}>({
  chatPage: async ({ page }, use) => {
    await use(new ChatPage(page));
  },
});
