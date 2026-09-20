import { expect, test } from '../../support/fixtures';

test.describe('Chat Page', () => {
  test('Page loads with the send form and messages list @Smoke', async ({ chatPage, chatUser }) => {
    // Arrange / Act
    await chatPage.visitSignedIn(chatUser.accessToken);

    // Assert
    await chatPage.shouldBeLoaded();
  });

  test('Existing messages are rendered on load @Smoke', async ({ chatPage, messagesDataManager, chatUser }) => {
    // Arrange
    const message = await messagesDataManager.create();

    // Act
    await chatPage.visitSignedIn(chatUser.accessToken);

    // Assert
    await chatPage.shouldShowMessage(message._id, message.text);
  });

  test('Each message has a delete button @regression', async ({ chatPage, messagesDataManager, chatUser }) => {
    // Arrange
    const message = await messagesDataManager.create();

    // Act
    await chatPage.visitSignedIn(chatUser.accessToken);

    // Assert
    await chatPage.shouldShowMessage(message._id, message.text);
    await chatPage.shouldHaveDeleteButton(message._id);
  });

  test('Each message shows who wrote it @regression', async ({
    chatPage,
    messagesDataManager,
    usersDataManager,
    chatUser,
  }) => {
    // Arrange
    const somebodyElse = await usersDataManager.createAndSignIn();
    const mine = await messagesDataManager.create();
    const theirs = await messagesDataManager.createAs(somebodyElse);

    // Act
    await chatPage.visitSignedIn(chatUser.accessToken);

    // Assert
    await chatPage.shouldShowAuthor(mine._id, chatUser.email);
    await chatPage.shouldShowAuthor(theirs._id, somebodyElse.email);
  });

  test('Messages are listed oldest first @regression', async ({ chatPage, messagesDataManager, chatUser }) => {
    // Arrange
    const [first, second] = await messagesDataManager.createMany(2, 'Order');

    // Act
    await chatPage.visitSignedIn(chatUser.accessToken);
    await chatPage.shouldShowMessage(second._id, second.text);

    // Assert
    const texts = await chatPage.getMessageTexts();
    expect(texts.indexOf(first.text)).toBeLessThan(texts.indexOf(second.text));
  });
});
