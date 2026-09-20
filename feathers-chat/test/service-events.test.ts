// Needs the MongoDB from docker-compose.yml (`docker compose up -d mongo`), see config/test.json
import assert from 'assert'
import { afterEach, beforeAll, beforeEach, describe, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import { app } from '../src/app'
import type { User } from '../src/client'
import { logger } from '../src/logger'

const password = 'supersecret'

describe('service event logging', () => {
  const service = app.service('messages')
  let info: MockInstance
  let author: User

  // The logged lines for service events, as [message, path, event, meta]
  const eventLogs = () => info.mock.calls.filter(([message]) => message === 'Service event: %s %s')

  beforeAll(async () => {
    await app.setup()
  })

  beforeEach(async () => {
    author = await app.service('users').create({ email: `events-${Date.now()}@example.com`, password })
    // After the user exists, so its own `created` event is not counted below
    info = vi.spyOn(logger, 'info').mockImplementation(() => logger)
  })

  afterEach(async () => {
    info.mockRestore()

    await (await service.getModel()).deleteMany({})
    await (await app.service('users').getModel()).deleteMany({})
  })

  it('logs created, patched and removed with the id of the record', async () => {
    const message = await service.create({ text: 'Logged' }, { user: author })
    const id = String(message._id)

    await service.patch(id, { text: 'Logged again' }, { user: author })
    await service.remove(id, { user: author })

    assert.deepStrictEqual(
      eventLogs().map(([, path, event, meta]) => [path, event, meta.id]),
      [
        ['messages', 'created', id],
        ['messages', 'patched', id],
        ['messages', 'removed', id]
      ]
    )
  })

  it('logs where the call came from', async () => {
    await service.create({ text: 'Internal' }, { user: author })

    const { accessToken } = await app
      .service('authentication')
      .create({ strategy: 'local', email: author.email, password }, {})

    await service.create(
      { text: 'External' },
      { provider: 'rest', authentication: { strategy: 'jwt', accessToken } }
    )

    assert.deepStrictEqual(
      // Signing in above emits an `authentication created` of its own
      eventLogs()
        .filter(([, path]) => path === 'messages')
        .map(([, , , meta]) => meta.provider),
      ['internal', 'rest']
    )
  })

  it('never logs the payload', async () => {
    await service.create({ text: 'a secret message' }, { user: author })

    assert.ok(!JSON.stringify(eventLogs()).includes('a secret message'))
  })

  it('does not log for methods that emit no event', async () => {
    await service.find()

    assert.deepStrictEqual(eventLogs(), [])
  })
})
