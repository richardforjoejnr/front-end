import { expect, test } from '../../support/fixtures';


test.describe('Chat Delete Message', () => {
  test('User can delete a message with the delete icon @Smoke', async ({ chatPage, messagesDataManager }) => {
    // Arrange
    const message = await messagesDataManager.create(messagesDataManager.uniqueText('Delete me'));
    await chatPage.visit();
    await chatPage.shouldShowMessage(message._id, message.text);

    // Act
    await chatPage.deleteMessage(message._id);

    // Assert
    await chatPage.shouldNotShowMessage(message._id);
    messagesDataManager.untrack(message._id);
  });

  test('A deleted message is gone from the server @regression', async ({ chatPage, messagesDataManager }) => {
    // Arrange
    const message = await messagesDataManager.create(messagesDataManager.uniqueText('Deleted on server'));
    await chatPage.visit();
    await chatPage.shouldShowMessage(message._id, message.text);

    // Act
    await chatPage.deleteMessage(message._id);
    await chatPage.shouldNotShowMessage(message._id);

    // Assert - the server agrees, not just the page
    const remaining = await messagesDataManager.findByText(message.text);
    expect(remaining).toHaveLength(0);
    messagesDataManager.untrack(message._id);
  });

  test('Deleting one message leaves the others @regression', async ({ chatPage, messagesDataManager }) => {
    // Arrange
    const [keep, remove] = await messagesDataManager.createMany(2, 'Delete one of two');
    await chatPage.visit();
    await chatPage.shouldShowMessage(remove._id, remove.text);

    // Act
    await chatPage.deleteMessage(remove._id);

    // Assert
    await chatPage.shouldNotShowMessage(remove._id);
    await chatPage.shouldShowMessage(keep._id, keep.text);
    messagesDataManager.untrack(remove._id);
  });

  test('Deleting a message already removed elsewhere clears it from the page @regression', async ({
    chatPage,
    messagesDataManager,
    page,
  }) => {
    // Arrange - somebody else deleted this message a moment ago, so the delete icon on
    // this page is stale. Answering 404 is how the server reports that.
    const message = await messagesDataManager.create(messagesDataManager.uniqueText('Already gone'));
    await chatPage.visit();
    await chatPage.shouldShowMessage(message._id, message.text);

    await page.route(`**/messages/${message._id}`, async route => {
      if (route.request().method() !== 'DELETE') {
        return route.fallback();
      }

      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          name: 'NotFound',
          message: `No record found for id '${message._id}'`,
          code: 404,
          className: 'not-found',
        }),
      });
    });

    // Act
    await chatPage.deleteMessage(message._id);

    // Assert - the 404 is handled, the message disappears rather than the page erroring
    await chatPage.shouldNotShowMessage(message._id);
  });
});
