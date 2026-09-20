// Needs the MongoDB from docker-compose.yml (`docker compose up -d mongo`), see config/test.json
import assert from 'assert'
import { afterEach, beforeAll, describe, it } from 'vitest'
import { app } from '../../../src/app'

// Calls from a transport carry a `provider`; internal calls do not, and skip hooks such
// as `authenticate`. Passing it here exercises what an external client actually gets.
const external = { provider: 'rest' as const }

const password = 'supersecret'
let counter = 0
const uniqueEmail = () => `user-${Date.now()}-${counter++}@example.com`

describe('users service', () => {
  const service = app.service('users')

  const register = async (email = uniqueEmail()) => {
    const user = await service.create({ email, password })

    return { ...user, email, password }
  }

  const signIn = async (email: string, secret = password) =>
    app.service('authentication').create({ strategy: 'local', email, password: secret }, {})

  beforeAll(async () => {
    // The unique index on email is created in UserService.setup()
    await app.setup()
  })

  afterEach(async () => {
    const collection = await service.getModel()

    await collection.deleteMany({})
  })

  it('registered the service', () => {
    assert.ok(service, 'Registered the service')
  })

  describe('registration', () => {
    it('is open to anyone, because it is how somebody signs up', async () => {
      const user = await service.create({ email: uniqueEmail(), password }, external)

      assert.ok(user._id)
    })

    // Hiding the password from clients happens via `context.dispatch`, which only a
    // transport produces, so that is asserted over HTTP in the e2e suite instead.
    it('stores the password hashed, never in plain text', async () => {
      const { _id } = await register()
      const collection = await service.getModel()
      const stored = await collection.findOne({ _id })

      assert.ok(stored?.password, 'a password is stored')
      assert.notStrictEqual(stored.password, password, 'it is not the plain text')
      assert.ok(stored.password.startsWith('$2'), 'it is a bcrypt hash')
    })

    it('rejects a second account with the same email', async () => {
      const email = uniqueEmail()

      await register(email)

      await assert.rejects(() => service.create({ email, password }), { name: 'Conflict' })
    })

    it('does not leak the collection name when rejecting a duplicate', async () => {
      const email = uniqueEmail()

      await register(email)
      await assert.rejects(
        () => service.create({ email, password }),
        (error: any) => {
          assert.ok(!error.message.includes('E11000'), 'the raw MongoDB error is not exposed')
          assert.ok(!error.message.includes('feathers-chat'), 'the database name is not exposed')
          return true
        }
      )
    })
  })

  describe('authorization', () => {
    it('rejects a find without a token', async () => {
      await assert.rejects(() => service.find({ ...external, query: {} }), { name: 'NotAuthenticated' })
    })

    it('rejects a get without a token', async () => {
      const user = await register()

      await assert.rejects(() => service.get(String(user._id), external), { name: 'NotAuthenticated' })
    })

    it('rejects a remove without a token', async () => {
      const user = await register()

      await assert.rejects(() => service.remove(String(user._id), external), { name: 'NotAuthenticated' })
    })

    it('lets a signed-in user read their own record', async () => {
      const registered = await register()
      const { user, accessToken } = await signIn(registered.email)
      const found = await service.get(String(user._id), {
        ...external,
        authentication: { strategy: 'jwt', accessToken },
        user
      })

      assert.strictEqual(String(found._id), String(user._id))
    })

    it('only returns the signed-in user from a find, never anybody else', async () => {
      const first = await register()
      const second = await register()
      const { user, accessToken } = await signIn(first.email)

      const page = await service.find({
        ...external,
        authentication: { strategy: 'jwt', accessToken },
        user,
        query: {}
      })
      const ids = page.data.map((found: any) => String(found._id))

      assert.ok(ids.includes(String(first._id)), 'sees themselves')
      assert.ok(!ids.includes(String(second._id)), 'does not see the other user')
    })

    it('does not let one user read another by id', async () => {
      const attacker = await register()
      const victim = await register()
      const { user, accessToken } = await signIn(attacker.email)

      await assert.rejects(
        () =>
          service.get(String(victim._id), {
            ...external,
            authentication: { strategy: 'jwt', accessToken },
            user
          }),
        { name: 'NotFound' }
      )
    })

    it('does not let one user delete another', async () => {
      const attacker = await register()
      const victim = await register()
      const { user, accessToken } = await signIn(attacker.email)

      await assert.rejects(
        () =>
          service.remove(String(victim._id), {
            ...external,
            authentication: { strategy: 'jwt', accessToken },
            user
          }),
        { name: 'NotFound' }
      )
    })
  })
})
