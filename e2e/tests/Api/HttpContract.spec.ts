import { expect, test } from '../../support/fixtures';
import { authenticateLocal, findUsers } from '../../support/helper/utils/api/authRequests';
import { createMessage, findMessages } from '../../support/helper/utils/api/messagesRequests';

/**
 * A thin layer over real HTTP against the built container. Service rules, validation and
 * authorization are covered in feathers-chat/test (Vitest) — this only asserts what those
 * cannot reach: status codes on the wire, and `context.dispatch`, which exists only when
 * a transport serialises the response.
 */
test.describe('HTTP Contract', () => {
  // `messagesDataManager.api` sends the worker's chatUser token with every request
  test('The messages service answers over REST @Smoke', async ({ messagesDataManager }) => {
    const created = await createMessage(messagesDataManager.api, { text: 'Over HTTP' });

    expect(created.status()).toBe(201);
    messagesDataManager.track((await created.json())._id);

    const page = await findMessages(messagesDataManager.api);

    expect(page.status()).toBe(200);
    expect(await page.json()).toMatchObject({ total: expect.any(Number), data: expect.any(Array) });
  });

  test('A validation failure is a 400 on the wire @Smoke', async ({ messagesDataManager }) => {
    const response = await createMessage(messagesDataManager.api, { text: '' });

    expect(response.status()).toBe(400);
    expect(await response.json()).toMatchObject({ name: 'BadRequest' });
  });

  test('Signing in over REST returns a token @Smoke', async ({ usersDataManager }) => {
    const user = await usersDataManager.create();

    const response = await authenticateLocal(usersDataManager.api, {
      email: user.email,
      password: user.password,
    });

    expect(response.status()).toBe(201);
    expect((await response.json()).accessToken).toBeTruthy();
  });

  test('A request without a token is a 401 on the wire @Smoke', async ({ usersDataManager }) => {
    const response = await findUsers(usersDataManager.api);

    expect(response.status()).toBe(401);
    expect(await response.json()).toMatchObject({ name: 'NotAuthenticated' });
  });

  // The external resolver strips the password into `context.dispatch`, which only exists
  // once a transport serialises the result — so this is only observable over HTTP.
  test('The serialised response never carries a password @Smoke', async ({ usersDataManager }) => {
    const user = await usersDataManager.createAndSignIn();

    const session = await authenticateLocal(usersDataManager.api, {
      email: user.email,
      password: user.password,
    });
    expect((await session.json()).user.password).toBeUndefined();

    const page = await findUsers(usersDataManager.api, user.accessToken);
    for (const found of (await page.json()).data) {
      expect(found.password).toBeUndefined();
    }
  });
});
