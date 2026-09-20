import { test } from '../../support/fixtures';
import { removeMessage } from '../../support/helper/utils/api/messagesRequests';
import ChatPage from '../../support/pages/Chat.page';

/**
 * The chat updates from Socket.io `created` / `removed` events, so anything that changes
 * the data must reach an already-open page without a reload.
 */
test.describe('Chat Real-time Updates', () => {
  test('A message created through the API appears without a reload @Smoke', async ({
    chatPage,
    messagesDataManager, chatUser }) => {
    // Arrange
    await chatPage.visitSignedIn(chatUser.accessToken);
    await chatPage.shouldBeLoaded();

    // Act - create it after the page is open
    const message = await messagesDataManager.create(messagesDataManager.uniqueText('Pushed live'));

    // Assert
    await chatPage.shouldShowMessage(message._id, message.text);
  });

  test('A message deleted through the API disappears without a reload @regression', async ({
    chatPage,
    messagesDataManager, chatUser }) => {
    // Arrange
    const message = await messagesDataManager.create(messagesDataManager.uniqueText('Removed live'));
    await chatPage.visitSignedIn(chatUser.accessToken);
    await chatPage.shouldShowMessage(message._id, message.text);

    // Act
    await removeMessage(messagesDataManager.api, message._id);
    messagesDataManager.untrack(message._id);

    // Assert
    await chatPage.shouldNotShowMessage(message._id);
  });

  test('A message sent in one tab appears in another @regression', async ({
    chatPage,
    messagesDataManager,
    context, chatUser }) => {
    // Arrange - two pages on the same app, as two people would have
    const text = messagesDataManager.uniqueText('Two tabs');
    const secondChatPage = new ChatPage(await context.newPage());

    await chatPage.visitSignedIn(chatUser.accessToken);
    await secondChatPage.visitSignedIn(chatUser.accessToken);
    await secondChatPage.shouldBeLoaded();

    // Act - send from the first tab
    await chatPage.sendMessage(text);

    // Assert - the second tab receives it over its own socket
    await secondChatPage.shouldShowMessageWithText(text);

    const [created] = await messagesDataManager.findByText(text);
    messagesDataManager.track(created._id);
  });

  test('A message deleted in one tab disappears in another @regression', async ({
    chatPage,
    messagesDataManager,
    context, chatUser }) => {
    // Arrange
    const message = await messagesDataManager.create(messagesDataManager.uniqueText('Deleted in two tabs'));
    const secondChatPage = new ChatPage(await context.newPage());

    await chatPage.visitSignedIn(chatUser.accessToken);
    await secondChatPage.visitSignedIn(chatUser.accessToken);
    await chatPage.shouldShowMessage(message._id, message.text);
    await secondChatPage.shouldShowMessage(message._id, message.text);

    // Act - delete in the first tab
    await chatPage.deleteMessage(message._id);

    // Assert - the second tab drops it too
    await chatPage.shouldNotShowMessage(message._id);
    await secondChatPage.shouldNotShowMessage(message._id);
    messagesDataManager.untrack(message._id);
  });
});
