import { type APIRequestContext, test as base, expect } from '@playwright/test';

import { generateUniqueName } from '../helper';
import {
  type AuthenticationResult,
  type Credentials,
  type User,
  authenticateLocal,
  createUser,
  findUsers,
  removeUser,
} from '../helper/utils/api/authRequests';
import { newMessagesContext } from '../helper/utils/api/messagesRequests';

/** A user the test created, with the credentials needed to sign in as them again. */
export interface TestUser extends Credentials {
  _id: string;
  email: string;
}

export interface UsersDataManager {
  api: APIRequestContext;
  /** Registers a user and removes it when the test ends. */
  create(overrides?: Partial<Credentials>): Promise<TestUser>;
  /** Registers a user and signs in as them, returning the user and their JWT. */
  createAndSignIn(overrides?: Partial<Credentials>): Promise<TestUser & { accessToken: string }>;
  /** Signs in as an existing user. Fails the test if the credentials are rejected. */
  signIn(credentials: Credentials): Promise<AuthenticationResult>;
  /** An email nobody has registered. */
  uniqueEmail(): string;
  /** Looks a user up by email, for one the UI registered. */
  findByEmail(email: string): Promise<User[]>;
  /** Cleans up a user the test registered directly; needs the credentials to sign in. */
  track(id: string, credentials: Credentials): void;
  untrack(id: string): void;
}

const DEFAULT_PASSWORD = 'supersecret';

/**
 * Users cannot be deleted without a token, so the manager keeps the creator's token and
 * uses it to clean up. Tests run in parallel, so it only ever removes its own users.
 */
export const usersDataManagerFixture = base.extend<{ usersDataManager: UsersDataManager }>({
  usersDataManager: async ({}, use) => {
    const api = await newMessagesContext();
    const created = new Map<string, Credentials | undefined>();

    const manager: UsersDataManager = {
      api,

      uniqueEmail() {
        return `${generateUniqueName('playwright').replace(/\s+/g, '-')}@example.com`;
      },

      async create(overrides = {}) {
        const credentials: Credentials = {
          email: overrides.email ?? manager.uniqueEmail(),
          password: overrides.password ?? DEFAULT_PASSWORD,
        };
        const response = await createUser(api, credentials);

        expect(response.status(), `Could not register a user: ${await response.text()}`).toBe(201);

        const user = (await response.json()) as User;
        created.set(user._id, credentials);

        return { ...credentials, _id: user._id };
      },

      async createAndSignIn(overrides = {}) {
        const user = await manager.create(overrides);
        const { accessToken } = await manager.signIn(user);

        return { ...user, accessToken };
      },

      async signIn(credentials) {
        const response = await authenticateLocal(api, credentials);

        expect(response.status(), `Could not sign in: ${await response.text()}`).toBe(201);

        return (await response.json()) as AuthenticationResult;
      },

      async findByEmail(email) {
        const response = await findUsers(api, undefined, { email });

        // Reading users needs a token, so go via a session for that user's own record
        if (!response.ok()) {
          const session = await authenticateLocal(api, { email, password: DEFAULT_PASSWORD });
          const { accessToken, user } = (await session.json()) as AuthenticationResult;

          const authorised = await findUsers(api, accessToken, { email });
          return authorised.ok() ? ((await authorised.json()).data as User[]) : [user];
        }

        return (await response.json()).data as User[];
      },

      track(id, credentials) {
        created.set(id, credentials);
      },

      untrack(id) {
        created.delete(id);
      },
    };

    await use(manager);

    // Removing a user needs a token, so sign in as each one to delete itself
    for (const [id, credentials] of created) {
      if (!credentials) {
        continue;
      }

      const response = await authenticateLocal(api, credentials).catch(() => undefined);

      if (!response?.ok()) {
        continue;
      }

      const { accessToken } = (await response.json()) as AuthenticationResult;
      await removeUser(api, id, accessToken).catch(() => undefined);
    }

    await api.dispose();
  },
});
