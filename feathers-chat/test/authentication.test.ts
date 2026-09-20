// Needs the MongoDB from docker-compose.yml (`docker compose up -d mongo`), see config/test.json
import assert from 'assert'
import { afterEach, describe, it } from 'vitest'
import { app } from '../src/app'

const password = 'supersecret'
let counter = 0
const uniqueEmail = () => `auth-${Date.now()}-${counter++}@example.com`

describe('authentication service', () => {
  const users = app.service('users')
  const authentication = app.service('authentication')

  const register = async (email = uniqueEmail()) => {
    await users.create({ email, password })

    return { email, password }
  }

  afterEach(async () => {
    const collection = await users.getModel()

    await collection.deleteMany({})
  })

  it('registered the service', () => {
    assert.ok(authentication, 'Registered the service')
  })

  describe('local strategy', () => {
    it('returns an access token and the user for valid credentials', async () => {
      const credentials = await register()
      const result = await authentication.create({ strategy: 'local', ...credentials }, {})

      assert.ok(result.accessToken, 'issued an access token')
      assert.strictEqual(result.authentication.strategy, 'local')
      assert.strictEqual(result.user.email, credentials.email)
    })

    it('rejects a wrong password', async () => {
      const credentials = await register()

      await assert.rejects(
        () => authentication.create({ strategy: 'local', email: credentials.email, password: 'wrong' }, {}),
        { name: 'NotAuthenticated' }
      )
    })

    it('rejects an unknown email', async () => {
      await assert.rejects(
        () => authentication.create({ strategy: 'local', email: uniqueEmail(), password }, {}),
        { name: 'NotAuthenticated' }
      )
    })

    it('gives the same message whether the email exists or not', async () => {
      const credentials = await register()

      const wrongPassword = await authentication
        .create({ strategy: 'local', email: credentials.email, password: 'wrong' }, {})
        .catch((error: any) => error)
      const unknownEmail = await authentication
        .create({ strategy: 'local', email: uniqueEmail(), password }, {})
        .catch((error: any) => error)

      // Otherwise an attacker can enumerate which emails have accounts
      assert.strictEqual(wrongPassword.message, unknownEmail.message)
      assert.strictEqual(wrongPassword.code, unknownEmail.code)
    })

    it('rejects a request with no strategy', async () => {
      const credentials = await register()

      await assert.rejects(() => authentication.create({ ...credentials } as any, {}))
    })
  })

  describe('jwt strategy', () => {
    it('exchanges a valid token for a new session', async () => {
      const credentials = await register()
      const { accessToken } = await authentication.create({ strategy: 'local', ...credentials }, {})

      const result = await authentication.create({ strategy: 'jwt', accessToken }, {})

      assert.strictEqual(result.authentication.strategy, 'jwt')
      assert.ok(result.accessToken)
    })

    it('rejects a tampered token', async () => {
      const credentials = await register()
      const { accessToken } = await authentication.create({ strategy: 'local', ...credentials }, {})
      const tampered = accessToken.slice(0, -1) + (accessToken.endsWith('a') ? 'b' : 'a')

      await assert.rejects(() => authentication.create({ strategy: 'jwt', accessToken: tampered }, {}), {
        name: 'NotAuthenticated'
      })
    })

    it('rejects a token that is not a JWT at all', async () => {
      await assert.rejects(() => authentication.create({ strategy: 'jwt', accessToken: 'not-a-jwt' }, {}), {
        name: 'NotAuthenticated'
      })
    })

    it('issues a token that expires, per jwtOptions', async () => {
      const credentials = await register()
      const { accessToken } = await authentication.create({ strategy: 'local', ...credentials }, {})
      const [, payload] = accessToken.split('.')
      const claims = JSON.parse(Buffer.from(payload, 'base64').toString())

      assert.ok(claims.exp, 'the token carries an expiry')
      assert.ok(claims.exp > claims.iat, 'the expiry is after it was issued')
      assert.strictEqual(claims.exp - claims.iat, 24 * 60 * 60, 'the 1d expiry from config')
    })
  })
})
