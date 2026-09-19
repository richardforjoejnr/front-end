import { xssPayload } from '../../support/data/Chat.content';
import { test } from '../../support/fixtures';

test.describe('Chat Send Message', () => {
  test('User can send a message and see it appear @Smoke', async ({ chatPage, messagesDataManager }) => {
    // Arrange
    const text = messagesDataManager.uniqueText('Sent from the form');
    await chatPage.visit();
    await chatPage.shouldBeLoaded();

    // Act
    await chatPage.sendMessage(text);

    // Assert
    await chatPage.shouldShowMessageWithText(text);

    // The UI created this one, so hand it to the data manager to clean up
    const [created] = await messagesDataManager.findByText(text);
    messagesDataManager.track(created._id);
  });

  test('The input is cleared after sending @regression', async ({ chatPage, messagesDataManager }) => {
    // Arrange
    const text = messagesDataManager.uniqueText('Clears input');
    await chatPage.visit();
    await chatPage.shouldBeLoaded();

    // Act
    await chatPage.sendMessage(text);

    // Assert
    await chatPage.shouldHaveEmptyInput();

    const [created] = await messagesDataManager.findByText(text);
    messagesDataManager.track(created._id);
  });

  test('A sent message is persisted and survives a reload @regression', async ({ chatPage, messagesDataManager }) => {
    // Arrange
    const text = messagesDataManager.uniqueText('Persisted');
    await chatPage.visit();
    await chatPage.shouldBeLoaded();

    // Act
    await chatPage.sendMessage(text);
    await chatPage.shouldShowMessageWithText(text);
    await chatPage.reload();

    // Assert
    await chatPage.shouldShowMessageWithText(text);

    const [created] = await messagesDataManager.findByText(text);
    messagesDataManager.track(created._id);
  });

  test('Message text is rendered as text, never as HTML @regression', async ({ chatPage, messagesDataManager }) => {
    // Arrange - a message that would execute if the page used innerHTML
    const message = await messagesDataManager.create(`${xssPayload} ${messagesDataManager.uniqueText('XSS')}`);

    // Act
    await chatPage.visit();

    // Assert
    await chatPage.shouldShowMessage(message._id, message.text);
    await chatPage.shouldNotRenderHtmlIn(message._id);
    await chatPage.shouldNotHaveDocumentTitle('xss');
  });
});
