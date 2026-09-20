import { Conflict } from '@feathersjs/errors'

import type { HookContext, NextFunction } from '../declarations'

/**
 * MongoDB reports a violated unique index as a generic 500 whose message names the
 * collection and index. Report it as a 409 instead, and say nothing about the internals.
 */
export const uniqueEmail = async (context: HookContext, next: NextFunction) => {
  try {
    await next()
  } catch (error: any) {
    if (typeof error?.message === 'string' && error.message.includes('E11000')) {
      throw new Conflict('That email is already registered')
    }

    throw error
  }
}
