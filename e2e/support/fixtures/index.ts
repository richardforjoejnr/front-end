import { mergeTests } from '@playwright/test';

import { beforeAfterManager } from './beforefterManager';
import { logger } from './logManager';
import { messagesDataManagerFixture } from './messagesDataManager.fixture';
import { pageInstance } from './pageManager';

export const test = mergeTests(pageInstance, messagesDataManagerFixture, logger, beforeAfterManager);

export { expect, type Page } from '@playwright/test';
export type { MessagesDataManager } from './messagesDataManager.fixture';
export type { Message, MessagePage } from '../helper/utils/api/messagesRequests';
