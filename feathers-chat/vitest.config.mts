import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // Globals are imported explicitly from 'vitest' in each file rather than injected,
    // so no extra `types` entry is needed for the editor to resolve them
    globals: false,
    // node-config reads NODE_ENV to pick config/test.json (its own database and port)
    env: { NODE_ENV: 'test' },
    // The suites share one app instance and one database, so they run one at a time
    fileParallelism: false,
    testTimeout: 10000,
    hookTimeout: 20000
  }
})
