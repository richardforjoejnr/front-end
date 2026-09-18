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

npm, TypeScript 7, ESM (`"type": "module"`). Currently a single Feathers quick-start
script (`app.ts`), uncommitted.

- `npm install` — install dependencies
- `npm start` — run `app.ts` via `tsx`
- `npm run typecheck` — `tsc --noEmit`

Do not use `ts-node`: TypeScript 7 (the native compiler) ships no JS compiler API, so
ts-node crashes on startup (`Cannot read properties of undefined (reading 'fileExists')`).
Run TypeScript with `tsx` and type-check separately with `tsc`.

No build, lint, or test commands yet.

### Architecture

_None yet._ Describe the directory layout, routing, state management, data fetching/API
layer, and styling approach once they are established.

### Conventions

_None yet._ Note naming, component structure, and testing conventions that aren't obvious
from the code itself.
