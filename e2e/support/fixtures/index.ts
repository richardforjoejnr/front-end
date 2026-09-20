import { mergeTests } from '@playwright/test';

import { beforeAfterManager } from './beforefterManager';
import { chatUserFixture } from './chatUser.fixture';
import { logger } from './logManager';
import { messagesDataManagerFixture } from './messagesDataManager.fixture';
import { usersDataManagerFixture } from './usersDataManager.fixture';
import { pageInstance } from './pageManager';

export const test = mergeTests(
  pageInstance,
  messagesDataManagerFixture,
  usersDataManagerFixture,
  chatUserFixture,
  logger,
  beforeAfterManager,
);

export { expect, type Page } from '@playwright/test';
export type { MessagesDataManager } from './messagesDataManager.fixture';
export type { Message, MessagePage } from '../helper/utils/api/messagesRequests';
export type { UsersDataManager, TestUser } from './usersDataManager.fixture';
export type { ChatUser } from './chatUser.fixture';
export type { AuthenticationResult, Credentials, User } from '../helper/utils/api/authRequests';
