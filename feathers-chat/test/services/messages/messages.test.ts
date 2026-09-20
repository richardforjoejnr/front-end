// Needs the MongoDB from docker-compose.yml (`docker compose up -d mongo`), see config/test.json
import assert from 'assert'
import { afterEach, beforeAll, beforeEach, describe, it } from 'vitest'
import { app } from '../../../src/app'
import type { User } from '../../../src/client'

// Calls from a transport carry a `provider`; internal calls do not, and skip hooks such
// as `authenticate`. Passing it here exercises what an external client actually gets.
const external = { provider: 'rest' as const }

const password = 'supersecret'
let counter = 0
const uniqueEmail = () => `author-${Date.now()}-${counter++}@example.com`

describe('messages service', () => {
  const service = app.service('messages')
  const users = app.service('users')

  // What an external client sends once signed in: `authenticate('jwt')` verifies the
  // token and loads the user from it
  const signedIn = async (email = uniqueEmail()) => {
    await users.create({ email, password })

    const { user, accessToken } = await app
      .service('authentication')
      .create({ strategy: 'local', email, password }, {})

    return { user: user as User, params: { ...external, authentication: { strategy: 'jwt', accessToken } } }
  }

  // Internal calls skip `authenticate`, so they name the author themselves
  let author: User
  let asAuthor: { user: User }

  beforeAll(async () => {
    await app.setup()
  })

  beforeEach(async () => {
    author = await users.create({ email: uniqueEmail(), password })
    asAuthor = { user: author }
  })

  afterEach(async () => {
    await (await service.getModel()).deleteMany({})
    await (await users.getModel()).deleteMany({})
  })

  it('registered the service', () => {
    assert.ok(service, 'Registered the service')
  })

  describe('create', () => {
    it('creates a message and sets createdAt on the server', async () => {
      const before = Date.now()
      const message = await service.create({ text: 'Hello test' }, asAuthor)

      assert.ok(message._id, 'has an id')
      assert.strictEqual(message.text, 'Hello test')
      assert.ok(new Date(message.createdAt).getTime() >= before, 'createdAt is set to now')
    })

    it('rejects an empty text', async () => {
      await assert.rejects(() => service.create({ text: '' }, asAuthor), { name: 'BadRequest' })
    })

    it('rejects a missing text', async () => {
      await assert.rejects(() => service.create({} as any, asAuthor), { name: 'BadRequest' })
    })

    it('rejects a non-string text', async () => {
      await assert.rejects(() => service.create({ text: 42 } as any, asAuthor), { name: 'BadRequest' })
    })

    it('does not let a client set createdAt', async () => {
      const data = { text: 'Backdated', createdAt: '1999-01-01T00:00:00.000Z' }

      await assert.rejects(() => service.create(data as any, asAuthor), { name: 'BadRequest' })
    })

    it('rejects an unknown property', async () => {
      await assert.rejects(() => service.create({ text: 'Hello', isAdmin: true } as any, asAuthor), {
        name: 'BadRequest'
      })
    })

    it('never reuses an id after a message is removed', async () => {
      const first = await service.create({ text: 'first' }, asAuthor)
      await service.remove(String(first._id))
      const second = await service.create({ text: 'second' }, asAuthor)

      assert.notStrictEqual(String(second._id), String(first._id))
    })
  })

  describe('find', () => {
    it('returns a paginated page rather than an array', async () => {
      await service.create({ text: 'Paginated' }, asAuthor)

      const page = await service.find({ query: {} })

      assert.strictEqual(typeof page.total, 'number')
      assert.strictEqual(page.limit, 10, 'the default page size from config')
      assert.ok(Array.isArray(page.data))
    })

    it('supports $sort and $limit', async () => {
      await service.create({ text: 'older' }, asAuthor)
      await service.create({ text: 'newer' }, asAuthor)

      const page = await service.find({ query: { $sort: { createdAt: -1 }, $limit: 2 } })
      const [newest, older] = page.data

      assert.strictEqual(page.data.length, 2)
      assert.ok(new Date(newest.createdAt).getTime() >= new Date(older.createdAt).getTime())
    })
  })

  describe('get, patch and remove', () => {
    it('patches the text and keeps createdAt', async () => {
      const message = await service.create({ text: 'Before' }, asAuthor)
      const patched = await service.patch(String(message._id), { text: 'After' })

      assert.strictEqual(patched.text, 'After')
      assert.strictEqual(patched.createdAt, message.createdAt)
    })

    it('rejects a patch with an empty text', async () => {
      const message = await service.create({ text: 'Before' }, asAuthor)

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

  describe('authorship', () => {
    it('sets userId from the signed-in user', async () => {
      const message = await service.create({ text: 'Mine' }, asAuthor)

      assert.strictEqual(String(message.userId), String(author._id))
    })

    it('does not let a client choose the author', async () => {
      const data = { text: 'Forged', userId: '000000000000000000000000' }

      await assert.rejects(() => service.create(data as any, asAuthor), { name: 'BadRequest' })
    })

    it('does not let a patch change the author', async () => {
      const message = await service.create({ text: 'Mine' }, asAuthor)
      const data = { userId: '000000000000000000000000' }

      await assert.rejects(() => service.patch(String(message._id), data as any, asAuthor), {
        name: 'BadRequest'
      })
    })

    it('refuses an internal call that names no author', async () => {
      await assert.rejects(() => service.create({ text: 'Nobody' }), { name: 'BadRequest' })
    })

    it('populates the author with their id and email only', async () => {
      const message = await service.create({ text: 'Who wrote this' }, asAuthor)

      // The lookup is internal, so without care the password hash would come along
      assert.deepStrictEqual(message.user, { _id: author._id, email: author.email })
    })

    it('still returns a message whose author deleted their account', async () => {
      const message = await service.create({ text: 'Orphaned' }, asAuthor)
      await users.remove(String(author._id))

      const found = await service.get(String(message._id))

      assert.strictEqual(found.text, 'Orphaned')
      assert.strictEqual(found.user, undefined)
    })
  })

  describe('authorization', () => {
    it('rejects every method without a token', async () => {
      const message = await service.create({ text: 'Private' }, asAuthor)
      const id = String(message._id)

      await assert.rejects(() => service.find({ ...external, query: {} }), { name: 'NotAuthenticated' })
      await assert.rejects(() => service.get(id, external), { name: 'NotAuthenticated' })
      await assert.rejects(() => service.create({ text: 'Nobody' }, external), { name: 'NotAuthenticated' })
      await assert.rejects(() => service.patch(id, { text: 'Nobody' }, external), {
        name: 'NotAuthenticated'
      })
      await assert.rejects(() => service.remove(id, external), { name: 'NotAuthenticated' })
    })

    it('lets a signed-in user post, and records them as the author', async () => {
      const { user, params } = await signedIn()
      const message = await service.create({ text: 'Signed in' }, params)

      assert.strictEqual(String(message.userId), String(user._id))
    })

    it("lets a signed-in user read everybody's messages", async () => {
      const message = await service.create({ text: 'From somebody else' }, asAuthor)
      const { params } = await signedIn()

      const page = await service.find({ ...params, query: {} })
      const found = await service.get(String(message._id), params)

      assert.deepStrictEqual(
        page.data.map(({ _id }) => String(_id)),
        [String(message._id)]
      )
      assert.strictEqual(found.text, 'From somebody else')
    })

    it('lets the author patch and remove their own message', async () => {
      const { params } = await signedIn()
      const message = await service.create({ text: 'Before' }, params)

      const patched = await service.patch(String(message._id), { text: 'After' }, params)
      const removed = await service.remove(String(message._id), params)

      assert.strictEqual(patched.text, 'After')
      assert.strictEqual(String(removed._id), String(message._id))
    })

    // NotFound rather than Forbidden: the query is pinned to the caller's own messages,
    // so somebody else's simply does not match
    it("does not let a user patch somebody else's message", async () => {
      const message = await service.create({ text: 'Not yours' }, asAuthor)
      const { params } = await signedIn()

      await assert.rejects(() => service.patch(String(message._id), { text: 'Defaced' }, params), {
        name: 'NotFound'
      })
      assert.strictEqual((await service.get(String(message._id))).text, 'Not yours')
    })

    it("does not let a user remove somebody else's message", async () => {
      const message = await service.create({ text: 'Not yours' }, asAuthor)
      const { params } = await signedIn()

      await assert.rejects(() => service.remove(String(message._id), params), { name: 'NotFound' })
      assert.ok(await service.get(String(message._id)), 'the message is still there')
    })

    it('does not let a user widen a remove to somebody else with a query', async () => {
      const message = await service.create({ text: 'Not yours' }, asAuthor)
      const { params } = await signedIn()
      const query = { userId: String(author._id) }

      await assert.rejects(() => service.remove(String(message._id), { ...params, query }), {
        name: 'NotFound'
      })
    })
  })
})
