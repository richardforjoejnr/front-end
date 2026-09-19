import { content } from '../../support/data/Chat.content';
import { expect, test } from '../../support/fixtures';
import { createMessage, getMessage, patchMessage, removeMessage } from '../../support/helper/utils/api/messagesRequests';

const UNKNOWN_ID = '000000000000000000000000';

/**
 * The schema in src/services/messages/messages.schema.ts is the contract: `text` is a
 * non-empty string, `createdAt` belongs to the server, and nothing else is accepted.
 */
test.describe('Messages API Validation', () => {
  test('POST rejects an empty text @Smoke', async ({ messagesDataManager }) => {
    // Act
    const response = await createMessage(messagesDataManager.api, { text: '' });

    // Assert
    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ name: content.errors.badRequest });
  });

  test('POST rejects a missing text @regression', async ({ messagesDataManager }) => {
    const response = await createMessage(messagesDataManager.api, {});

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ name: content.errors.badRequest });
  });

  test('POST rejects a non-string text @regression', async ({ messagesDataManager }) => {
    const response = await createMessage(messagesDataManager.api, { text: 42 });

    expect(response.status()).toBe(400);
  });

  test('POST rejects a client-supplied createdAt @regression', async ({ messagesDataManager }) => {
    // Arrange - a client must not be able to backdate a message
    const data = { text: 'Backdated', createdAt: '1999-01-01T00:00:00.000Z' };

    // Act
    const response = await createMessage(messagesDataManager.api, data);

    // Assert
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body).toMatchObject({ name: content.errors.badRequest });
    expect(JSON.stringify(body.data)).toContain('createdAt');
  });

  test('POST rejects an unknown property @regression', async ({ messagesDataManager }) => {
    const response = await createMessage(messagesDataManager.api, { text: 'Hello', isAdmin: true });

    expect(response.status()).toBe(400);
  });

  test('PATCH rejects an empty text @regression', async ({ messagesDataManager }) => {
    // Arrange
    const message = await messagesDataManager.create();

    // Act
    const response = await patchMessage(messagesDataManager.api, message._id, { text: '' });

    // Assert
    expect(response.status()).toBe(400);
  });

  test('GET an unknown id returns 404 NotFound @Smoke', async ({ messagesDataManager }) => {
    const response = await getMessage(messagesDataManager.api, UNKNOWN_ID);

    expect(response.status()).toBe(404);
    expect(await response.json()).toMatchObject({ name: content.errors.notFound });
  });

  test('DELETE an unknown id returns 404 NotFound @regression', async ({ messagesDataManager }) => {
    const response = await removeMessage(messagesDataManager.api, UNKNOWN_ID);

    expect(response.status()).toBe(404);
    expect(await response.json()).toMatchObject({ name: content.errors.notFound });
  });

  test('PATCH an unknown id returns 404 NotFound @regression', async ({ messagesDataManager }) => {
    const response = await patchMessage(messagesDataManager.api, UNKNOWN_ID, { text: 'Nobody' });

    expect(response.status()).toBe(404);
  });

  test('A malformed id is rejected rather than crashing the service @regression', async ({ messagesDataManager }) => {
    // Arrange - not a valid ObjectId
    const response = await getMessage(messagesDataManager.api, 'not-an-object-id');

    // Assert - any 4xx is fine; a 500 would mean the error escaped the adapter
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});
