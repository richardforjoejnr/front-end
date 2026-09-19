import { expect, test } from '../../support/fixtures';

import environment from '../../config';

/**
 * The app serves `public/` only. Serving the repo root would expose source and config,
 * so these are regression tests for that decision.
 */
test.describe('Static Hosting', () => {
  test('The chat page is served at / @Smoke', async ({ messagesDataManager }) => {
    const response = await messagesDataManager.api.get(environment.baseUrl);

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('data-test="chat-page"');
  });

  for (const path of ['/package.json', '/src/app.ts', '/config/default.json', '/tsconfig.json']) {
    test(`${path} is not served @regression`, async ({ messagesDataManager }) => {
      const response = await messagesDataManager.api.get(`${environment.baseUrl}${path}`);

      expect(response.status()).toBe(404);
    });
  }

  test('An unknown path returns a JSON 404 @regression', async ({ messagesDataManager }) => {
    const response = await messagesDataManager.api.get(`${environment.baseUrl}/path/to/nowhere`);

    expect(response.status()).toBe(404);
    expect(await response.json()).toMatchObject({ code: 404, name: 'NotFound' });
  });
});
