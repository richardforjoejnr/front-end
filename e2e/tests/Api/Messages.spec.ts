import { expect, test } from '../../support/fixtures';
import {
  createMessage,
  findMessages,
  getMessage,
  patchMessage,
  removeMessage,
} from '../../support/helper/utils/api/messagesRequests';


test.describe('Messages API', () => {
  test('POST creates a message and returns 201 @Smoke', async ({ messagesDataManager }) => {
    // Arrange
    const text = messagesDataManager.uniqueText('Created via API');

    // Act
    const response = await createMessage(messagesDataManager.api, { text });

    // Assert
    expect(response.status()).toBe(201);

    const message = await response.json();
    messagesDataManager.track(message._id);

    expect(message).toMatchObject({ text });
    expect(message._id).toBeTruthy();
  });

  test('POST sets createdAt on the server @regression', async ({ messagesDataManager }) => {
    // Arrange
    const before = Date.now();

    // Act
    const message = await messagesDataManager.create();

    // Assert
    expect(message.createdAt).toBeTruthy();
    expect(new Date(message.createdAt).getTime()).toBeGreaterThanOrEqual(before);
  });

  test('GET returns a paginated page, not an array @Smoke', async ({ messagesDataManager }) => {
    // Arrange
    await messagesDataManager.create();

    // Act
    const response = await findMessages(messagesDataManager.api);

    // Assert
    expect(response.status()).toBe(200);

    const page = await response.json();
    expect(page).toMatchObject({
      total: expect.any(Number),
      limit: expect.any(Number),
      skip: expect.any(Number),
      data: expect.any(Array),
    });
    expect(page.limit).toBe(10);
  });

  test('GET by id returns the message @Smoke', async ({ messagesDataManager }) => {
    // Arrange
    const message = await messagesDataManager.create();

    // Act
    const response = await getMessage(messagesDataManager.api, message._id);

    // Assert
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      _id: message._id,
      text: message.text,
      createdAt: message.createdAt,
    });
  });

  test('PATCH updates the text and keeps createdAt @regression', async ({ messagesDataManager }) => {
    // Arrange
    const message = await messagesDataManager.create();
    const newText = messagesDataManager.uniqueText('Patched');

    // Act
    const response = await patchMessage(messagesDataManager.api, message._id, { text: newText });

    // Assert
    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      _id: message._id,
      text: newText,
      createdAt: message.createdAt,
    });
  });

  test('DELETE removes the message @Smoke', async ({ messagesDataManager }) => {
    // Arrange
    const message = await messagesDataManager.create();

    // Act
    const response = await removeMessage(messagesDataManager.api, message._id);
    messagesDataManager.untrack(message._id);

    // Assert
    expect(response.status()).toBe(200);

    const after = await getMessage(messagesDataManager.api, message._id);
    expect(after.status()).toBe(404);
  });

  test('GET supports $sort and $limit @regression', async ({ messagesDataManager }) => {
    // Arrange
    await messagesDataManager.createMany(2, 'Sorted');

    // Act - Feathers takes nested query params in bracket notation over REST
    const page = await messagesDataManager.find({ '$sort[createdAt]': -1, $limit: 2 });

    // Assert
    expect(page.data).toHaveLength(2);

    const [newest, older] = page.data;
    expect(new Date(newest.createdAt).getTime()).toBeGreaterThanOrEqual(new Date(older.createdAt).getTime());
  });

  test('Ids are never reused after a delete @regression', async ({ messagesDataManager }) => {
    // Arrange
    const first = await messagesDataManager.create();

    // Act
    await removeMessage(messagesDataManager.api, first._id);
    messagesDataManager.untrack(first._id);

    const second = await messagesDataManager.create();

    // Assert
    expect(second._id).not.toBe(first._id);
  });
});
