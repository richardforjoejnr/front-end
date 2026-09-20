# E2E suite

Playwright UI and API tests for the `feathers-chat` app.

The layout mirrors the Vocovo `playwright-integration-test-suite`: environment config in
`config/`, Page Objects and fixtures in `support/`, specs grouped by feature in `tests/`.

## Running

The app must be running first — the suite does not start it:

```bash
cd ../feathers-chat && npm run docker:up   # app on http://localhost:3031
cd ../e2e && npm ci && npx playwright install chromium

npm test              # UI (chromium) + API
npm run test:api      # API only, no browser
npm run test:ui       # UI only
npm run test:smoke    # @Smoke tagged
npm run test:watch    # Playwright UI mode
npm run report        # open the last HTML report
```

`globalSetup` pings the app and fails with instructions if it is not up.

## Layout

```
config/            One file per environment; index.ts picks by NODE_ENV (default: localhost)
  defaultConfig.ts Shared settings
  localhost.ts     The Docker app on the host (honours APP_PORT / BASE_URL)
support/
  fixtures/        index.ts merges them; specs import `test` from here
    pageManager.ts           Page Objects as fixtures
    messagesDataManager...   Seeds messages and cleans up only what it created
    usersDataManager...      Registers users, signs them in, deletes them at teardown
    chatUser.fixture.ts      One signed-in user per worker, for specs that just need a session
    logManager.ts            Fails a test on an uncaught browser error
    beforefterManager.ts     Per-test / per-worker hooks
  pages/           Page Objects: Base.page.ts, Chat.page.ts
  helper/          Shared helpers, plus utils/api/ for the REST layer
  data/            Copy the tests assert on
tests/
  Chat/            UI specs (chromium project) — chat, sign-in, real-time
  Api/             HTTP-contract specs (api project, no browser)

Service rules live in feathers-chat/test (Vitest), not here. This suite only covers what
needs a browser or the wire: see the test pyramid section in ../CLAUDE.md.
```

## Conventions

- **Locators live in Page Object getters**, never inline in a spec. See
  [../docs/playwright-locator-strategy.md](../docs/playwright-locator-strategy.md).
- **`data-test` only.** `testIdAttribute` is set to `data-test`, so `getByTestId('chat-page')`
  resolves `[data-test="chat-page"]`. Never `data-testid`.
- **No positional selectors** — no `.first()`, `.nth()`, `.last()`. Target a message by its id:
  `chat-messages-list-item-{id}`.
- **Arrange / Act / Assert** comments in every spec.
- **Tags**: `@Smoke` for the critical path, `@regression` for the rest.
- **Data isolation**: tests run fully parallel against one database. Create data through
  `messagesDataManager` so it is cleaned up, and use `uniqueText()` for anything asserted on.
  Never delete all messages — other workers are using them.
