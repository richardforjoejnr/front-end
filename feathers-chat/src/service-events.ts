// For more information about service events see https://feathersjs.com/api/events.html
import type { Application, HookContext } from './declarations'
import { logger } from './logger'

export const serviceEvents = ['created', 'updated', 'patched', 'removed'] as const

export const logServiceEvents = (app: Application) => {
  for (const path of Object.keys(app.services)) {
    const service = app.service(path as any)

    for (const event of serviceEvents) {
      service.on(event, (data: any, context?: HookContext) => {
        logger.info('Service event: %s %s', path, event, {
          id: data?._id === undefined ? undefined : String(data._id),
          provider: context?.params?.provider ?? 'internal'
        })
      })
    }
  }
}
