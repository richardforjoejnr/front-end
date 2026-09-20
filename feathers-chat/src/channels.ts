// For more information about this file see https://dove.feathersjs.com/guides/cli/channels.html
import type { RealTimeConnection, Params } from '@feathersjs/feathers'
import type { AuthenticationResult } from '@feathersjs/authentication'
import '@feathersjs/transport-commons'
import type { Application, HookContext } from './declarations'

export const channels = (app: Application) => {
  app.on('connection', (connection: RealTimeConnection) => {
    app.channel('anonymous').join(connection)
  })

  app.on('login', (authResult: AuthenticationResult, { connection }: Params) => {
    // connection can be undefined if there is no
    // real-time connection, e.g. when logging in via REST
    if (connection) {
      app.channel('anonymous').leave(connection)

      app.channel('authenticated').join(connection)
    }
  })

  app.on('logout', (authResult: AuthenticationResult, { connection }: Params) => {
    // A socket that signs out stays connected, so stop sending it events
    if (connection) {
      app.channel('authenticated').leave(connection)

      app.channel('anonymous').join(connection)
    }
  })

  // eslint-disable-next-line no-unused-vars
  app.publish((data: any, context: HookContext) => {
    // Only signed-in connections: every service that emits events requires a JWT to read
    return app.channel('authenticated')
  })
}
