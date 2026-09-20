# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Current state

This repository is a fresh scaffold. As of the initial commit (`a36ee51`) it contains only
`README.md` with the title `# front-end`. There is no source code, package manifest, build
tooling, test setup, linter config, or CI yet.

- Remote: `https://github.com/richardforjoejnr/front-end.git`
- Default branch: `main`

Nothing about the stack (framework, language, package manager, styling, testing) has been
decided in the repo. Do not assume one — if a task depends on it, ask, or propose a choice
and get confirmation before scaffolding.

## Working here

- Branch off `main` for changes rather than committing to it directly.
- When tooling is introduced, prefer the scripts defined in the package manifest over
  ad-hoc commands, and record them in the Commands section below.

## Keep this file current

Update this file as the project takes shape. The sections below are intentionally empty
placeholders — fill them in when the corresponding thing exists, and delete this note once
they are populated.

### Commands

npm, TypeScript 7, ESM (`"type": "module"`). Currently the Feathers quick-start server,
uncommitted.

- `npm install` — install dependencies
- `npm start` — run the server (`app.ts` via `tsx`) on port 3030
- `PORT=3031 npm start` — run on another port. On this machine a Docker container
  (`sandbox-public-api`) often holds 3030, which makes `npm start` fail with `EADDRINUSE`
- `npm run typecheck` — `tsc --noEmit`

Do not use `ts-node`: TypeScript 7 (the native compiler) ships no JS compiler API, so
ts-node crashes on startup (`Cannot read properties of undefined (reading 'fileExists')`).
Run TypeScript with `tsx` and type-check separately with `tsc`.

No build, lint, or test commands yet.

### Architecture

Flat layout, no `src/` yet.

- `app.ts` — Feathers 5 app on Koa (`@feathersjs/koa`): static hosting of `public/` only
  (never the repo root — that exposes source and config), REST, and Socket.io (`@feathersjs/socketio`). Every connection joins the `everybody`
  channel and all service events are published to it.
- `message.service.ts` — in-memory `MessageService` (`find`/`get`/`create`/`update`/`remove`),
  registered at `messages`. Ids arrive as strings over REST, so the service coerces them;
  missing ids throw `NotFound` from `@feathersjs/errors`.

Relative imports use the `.js` extension (`./message.service.js`) because of
`"module": "nodenext"`.

- `public/index.html` — the Feathers quick-start chat page: plain HTML with an inline
  script, Feathers client and styles from CDNs, no build step. It connects with `io()`
  (same origin) so it works on whatever `PORT` the server uses, and renders message text
  with `textContent` because messages come from other users.

### Conventions

_None yet._ Note naming, component structure, and testing conventions that aren't obvious
from the code itself.
