import { mergeTests } from '@playwright/test';

import { beforeAfterManager } from './beforefterManager';
import { logger } from './logManager';
import { pageInstance } from './pageManager';

// `pageInstance` already chains chatUser -> usersDataManager -> messagesDataManager
export const test = mergeTests(pageInstance, logger, beforeAfterManager);

export { expect, type Page } from '@playwright/test';
export type { MessagesDataManager } from './messagesDataManager.fixture';
export type { Message, MessagePage } from '../helper/utils/api/messagesRequests';
export type { UsersDataManager, TestUser } from './usersDataManager.fixture';
export type { ChatUser } from './chatUser.fixture';
export type { AuthenticationResult, Credentials, User } from '../helper/utils/api/authRequests';
