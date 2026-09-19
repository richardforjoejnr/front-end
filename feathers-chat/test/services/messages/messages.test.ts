// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
// Needs the MongoDB from docker-compose.yml (`docker compose up -d mongo`), see config/test.json
import assert from 'assert'
import { afterEach, describe, it } from 'vitest'
import { app } from '../../../src/app'

describe('messages service', () => {
  const service = app.service('messages')

  // Remove everything the tests created
  afterEach(async () => {
    const collection = await service.getModel()

    await collection.deleteMany({})
  })

  it('registered the service', () => {
    assert.ok(service, 'Registered the service')
  })

  it('creates a message and sets createdAt on the server', async () => {
    const before = Date.now()
    const message = await service.create({ text: 'Hello test' })

    assert.ok(message._id, 'has an id')
    assert.strictEqual(message.text, 'Hello test')
    assert.ok(new Date(message.createdAt).getTime() >= before, 'createdAt is set to now')
  })

  it('rejects an empty text', async () => {
    await assert.rejects(() => service.create({ text: '' }), { name: 'BadRequest' })
  })

  it('does not let a client set createdAt', async () => {
    const data = { text: 'Backdated', createdAt: '1999-01-01T00:00:00.000Z' }

    await assert.rejects(() => service.create(data as any), { name: 'BadRequest' })
  })

  it('patches the text and keeps createdAt', async () => {
    const message = await service.create({ text: 'Before' })
    const patched = await service.patch(String(message._id), { text: 'After' })

    assert.strictEqual(patched.text, 'After')
    assert.strictEqual(patched.createdAt, message.createdAt)
  })

  it('throws NotFound for an unknown id', async () => {
    await assert.rejects(() => service.get('000000000000000000000000'), { name: 'NotFound' })
  })

  it('never reuses an id after a message is removed', async () => {
    const first = await service.create({ text: 'first' })
    await service.remove(String(first._id))
    const second = await service.create({ text: 'second' })

    assert.notStrictEqual(String(second._id), String(first._id))
  })
})
