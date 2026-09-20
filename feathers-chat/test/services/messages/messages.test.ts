// Needs the MongoDB from docker-compose.yml (`docker compose up -d mongo`), see config/test.json
import assert from 'assert'
import { afterEach, describe, it } from 'vitest'
import { app } from '../../../src/app'

// Calls from a transport carry a `provider`; internal calls do not, and skip hooks such
// as `authenticate`. Passing it here exercises what an external client actually gets.
const external = { provider: 'rest' as const }

describe('messages service', () => {
  const service = app.service('messages')

  afterEach(async () => {
    const collection = await service.getModel()

    await collection.deleteMany({})
  })

  it('registered the service', () => {
    assert.ok(service, 'Registered the service')
  })

  describe('create', () => {
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

    it('rejects a missing text', async () => {
      await assert.rejects(() => service.create({} as any), { name: 'BadRequest' })
    })

    it('rejects a non-string text', async () => {
      await assert.rejects(() => service.create({ text: 42 } as any), { name: 'BadRequest' })
    })

    it('does not let a client set createdAt', async () => {
      const data = { text: 'Backdated', createdAt: '1999-01-01T00:00:00.000Z' }

      await assert.rejects(() => service.create(data as any), { name: 'BadRequest' })
    })

    it('rejects an unknown property', async () => {
      await assert.rejects(() => service.create({ text: 'Hello', isAdmin: true } as any), {
        name: 'BadRequest'
      })
    })

    it('never reuses an id after a message is removed', async () => {
      const first = await service.create({ text: 'first' })
      await service.remove(String(first._id))
      const second = await service.create({ text: 'second' })

      assert.notStrictEqual(String(second._id), String(first._id))
    })
  })

  describe('find', () => {
    it('returns a paginated page rather than an array', async () => {
      await service.create({ text: 'Paginated' })

      const page = await service.find({ ...external, query: {} })

      assert.strictEqual(typeof page.total, 'number')
      assert.strictEqual(page.limit, 10, 'the default page size from config')
      assert.ok(Array.isArray(page.data))
    })

    it('supports $sort and $limit', async () => {
      await service.create({ text: 'older' })
      await service.create({ text: 'newer' })

      const page = await service.find({ ...external, query: { $sort: { createdAt: -1 }, $limit: 2 } })
      const [newest, older] = page.data

      assert.strictEqual(page.data.length, 2)
      assert.ok(new Date(newest.createdAt).getTime() >= new Date(older.createdAt).getTime())
    })
  })

  describe('get, patch and remove', () => {
    it('patches the text and keeps createdAt', async () => {
      const message = await service.create({ text: 'Before' })
      const patched = await service.patch(String(message._id), { text: 'After' })

      assert.strictEqual(patched.text, 'After')
      assert.strictEqual(patched.createdAt, message.createdAt)
    })

    it('rejects a patch with an empty text', async () => {
      const message = await service.create({ text: 'Before' })

      await assert.rejects(() => service.patch(String(message._id), { text: '' }), { name: 'BadRequest' })
    })

    it('throws NotFound for an unknown id', async () => {
      await assert.rejects(() => service.get('000000000000000000000000'), { name: 'NotFound' })
    })

    it('throws NotFound when patching an unknown id', async () => {
      await assert.rejects(() => service.patch('000000000000000000000000', { text: 'Nobody' }), {
        name: 'NotFound'
      })
    })

    it('throws NotFound when removing an unknown id', async () => {
      await assert.rejects(() => service.remove('000000000000000000000000'), { name: 'NotFound' })
    })

    it('rejects a malformed id rather than crashing', async () => {
      await assert.rejects(
        () => service.get('not-an-object-id'),
        (error: any) => {
          assert.ok(error.code >= 400 && error.code < 500, `expected a 4xx, got ${error.code}`)
          return true
        }
      )
    })
  })

  describe('authorization', () => {
    // Authentication exists, but messages.ts registers no `authenticate('jwt')` hook, so
    // the chat data is still public. These pin the gap; invert them once it is closed.
    it('lets an unauthenticated client read messages', async () => {
      const page = await service.find({ ...external, query: {} })

      assert.ok(page.data, 'messages are not yet behind authentication')
    })

    it('lets an unauthenticated client post a message', async () => {
      const message = await service.create({ text: 'Posted by nobody' }, external)

      assert.ok(message._id, 'messages are not yet behind authentication')
    })

    it("lets an unauthenticated client delete somebody else's message", async () => {
      const message = await service.create({ text: 'Not mine' })
      const removed = await service.remove(String(message._id), external)

      assert.strictEqual(String(removed._id), String(message._id))
    })

    it('has no author field, so deletion cannot be restricted yet', async () => {
      const message = await service.create({ text: 'Anonymous' })

      assert.deepStrictEqual(Object.keys(message), ['_id', 'text', 'createdAt'])
    })
  })
})
