import { test as base } from '@playwright/test';

import { generateUniqueName } from '../helper';
import { type AuthenticationResult, authenticateLocal, createUser, removeUser } from '../helper/utils/api/authRequests';
import { newMessagesContext } from '../helper/utils/api/messagesRequests';
import SignInPage from '../pages/SignIn.page';

export interface ChatUser {
  _id: string;
  email: string;
  password: string;
  accessToken: string;
}

/**
 * One registered user per worker, for the specs that need to be signed in but are not
 * about signing in. Per-test registration would add a round trip to every chat test;
 * the sign-in flow itself is covered by SignIn.spec.ts with its own throwaway users.
 */
export const chatUserFixture = base.extend<{ signInPage: SignInPage }, { chatUser: ChatUser }>({
  chatUser: [
    async ({}, use) => {
      const api = await newMessagesContext();
      const credentials = {
        email: `${generateUniqueName('chat-user').replace(/\s+/g, '-')}@example.com`,
        password: 'supersecret',
      };

      const registration = await createUser(api, credentials);

      if (registration.status() !== 201) {
        throw new Error(`Could not register the worker's chat user: ${await registration.text()}`);
      }

      const { _id } = await registration.json();
      const session = await authenticateLocal(api, credentials);
      const { accessToken } = (await session.json()) as AuthenticationResult;

      await use({ ...credentials, _id, accessToken });

      await removeUser(api, _id, accessToken).catch(() => undefined);
      await api.dispose();
    },
    { scope: 'worker' },
  ],

  signInPage: async ({ page }, use) => {
    await use(new SignInPage(page));
  },
});
