// Needs the MongoDB from docker-compose.yml (`docker compose up -d mongo`), see config/test.json
import assert from 'assert'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import type { MockInstance } from 'vitest'
import { app } from '../src/app'
import { logger } from '../src/logger'

describe('service event logging', () => {
  const service = app.service('messages')
  let info: MockInstance

  // The logged lines for service events, as [message, path, event, meta]
  const eventLogs = () => info.mock.calls.filter(([message]) => message === 'Service event: %s %s')

  beforeEach(() => {
    info = vi.spyOn(logger, 'info').mockImplementation(() => logger)
  })

  afterEach(async () => {
    info.mockRestore()

    const collection = await service.getModel()

    await collection.deleteMany({})
  })

  it('logs created, patched and removed with the id of the record', async () => {
    const message = await service.create({ text: 'Logged' })
    const id = String(message._id)

    await service.patch(id, { text: 'Logged again' })
    await service.remove(id)

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
    await service.create({ text: 'Internal' })
    await service.create({ text: 'External' }, { provider: 'rest' })

    assert.deepStrictEqual(
      eventLogs().map(([, , , meta]) => meta.provider),
      ['internal', 'rest']
    )
  })

  it('never logs the payload', async () => {
    await service.create({ text: 'a secret message' })

    assert.ok(!JSON.stringify(eventLogs()).includes('a secret message'))
  })

  it('does not log for methods that emit no event', async () => {
    await service.find()

    assert.deepStrictEqual(eventLogs(), [])
  })
})
