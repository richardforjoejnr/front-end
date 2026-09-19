import { request } from '@playwright/test';

import environment, { messagesUrl } from '../config';

/**
 * Fail fast with an actionable message when the app under test is not running, rather
 * than letting every spec time out on a connection refused.
 */
async function globalSetup() {
  const context = await request.newContext();

  try {
    const response = await context.get(messagesUrl, { timeout: 10000 });

    if (!response.ok()) {
      throw new Error(`${messagesUrl} responded ${response.status()} ${response.statusText()}`);
    }

    console.info(`Running against ${environment.name}: ${environment.baseUrl}`);
  } catch (error) {
    throw new Error(
      [
        `Could not reach the app at ${environment.baseUrl}.`,
        '',
        'Start it first:',
        '  cd feathers-chat && npm run docker:up',
        '',
        'Override the URL with BASE_URL, or the published port with APP_PORT.',
        '',
        `Cause: ${error instanceof Error ? error.message : String(error)}`,
      ].join('\n'),
    );
  } finally {
    await context.dispose();
  }
}

export default globalSetup;
