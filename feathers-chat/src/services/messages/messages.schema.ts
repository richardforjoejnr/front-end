// For more information about this file see https://dove.feathersjs.com/guides/cli/service.schemas.html
import { resolve, virtual, getValidator, querySyntax } from '@feathersjs/schema'
import { ObjectIdSchema } from '@feathersjs/schema'
import type { FromSchema } from '@feathersjs/schema'
import { NotAuthenticated } from '@feathersjs/errors'

import type { HookContext } from '../../declarations'
import { dataValidator, queryValidator } from '../../validators'
import type { MessagesService } from './messages.class'
import { userSchema } from '../users/users.schema'

export const messagesSchema = {
  $id: 'Messages',
  type: 'object',
  additionalProperties: false,
  required: ['_id', 'text', 'createdAt', 'userId'],
  properties: {
    _id: ObjectIdSchema(),
    text: { type: 'string', minLength: 1 },
    // ISO timestamp, set by the server when the message is created
    createdAt: { type: 'string', format: 'date-time' },
    // The author, set by the server from the signed-in user
    userId: ObjectIdSchema(),
    // Populated from `userId`, not stored. Missing once the author deleted their account
    user: {
      type: 'object',
      additionalProperties: false,
      required: ['_id', 'email'],
      properties: {
        _id: userSchema.properties._id,
        email: userSchema.properties.email
      }
    }
  }
} as const
export type Messages = FromSchema<typeof messagesSchema>
export const messagesValidator = getValidator(messagesSchema, dataValidator)
export const messagesResolver = resolve<Messages, HookContext<MessagesService>>({
  user: virtual(async (message, context) => {
    // An internal call: `users` only ever shows an external caller their own record.
    // That also means the password hash comes back, so pick the public fields by hand
    try {
      const { _id, email } = await context.app.service('users').get(String(message.userId))

      return { _id, email }
    } catch (error: any) {
      if (error.code === 404) {
        return undefined
      }

      throw error
    }
  })
})

export const messagesExternalResolver = resolve<Messages, HookContext<MessagesService>>({})

export const messagesDataSchema = {
  $id: 'MessagesData',
  type: 'object',
  additionalProperties: false,
  required: ['text'],
  properties: {
    // Clients may only send the text; everything else is set by the server
    text: messagesSchema.properties.text
  }
} as const
export type MessagesData = FromSchema<typeof messagesDataSchema>
export const messagesDataValidator = getValidator(messagesDataSchema, dataValidator)
export const messagesDataResolver = resolve<Messages, HookContext<MessagesService>>({
  createdAt: async () => new Date().toISOString(),
  userId: async (_value, _message, context) => {
    // Internal calls skip `authenticate`, so they have to pass `params.user` themselves
    if (!context.params.user) {
      throw new NotAuthenticated('A message needs an author')
    }

    return context.params.user._id
  }
})

export const messagesPatchSchema = {
  $id: 'MessagesPatch',
  type: 'object',
  additionalProperties: false,
  required: [],
  properties: {
    text: messagesSchema.properties.text
  }
} as const
export type MessagesPatch = FromSchema<typeof messagesPatchSchema>
export const messagesPatchValidator = getValidator(messagesPatchSchema, dataValidator)
export const messagesPatchResolver = resolve<MessagesPatch, HookContext<MessagesService>>({})

// `user` is populated, not stored, so it cannot be queried
const { user: _user, ...messagesQueryProperties } = messagesSchema.properties

export const messagesQuerySchema = {
  $id: 'MessagesQuery',
  type: 'object',
  additionalProperties: false,
  properties: {
    ...querySyntax(messagesQueryProperties)
  }
} as const
export type MessagesQuery = FromSchema<typeof messagesQuerySchema>
export const messagesQueryValidator = getValidator(messagesQuerySchema, queryValidator)
export const messagesQueryResolver = resolve<MessagesQuery, HookContext<MessagesService>>({
  // Everybody reads every message, but only the author can change or delete one. For
  // anyone else the message does not match the query, so they get a NotFound
  userId: async (value, _query, context) => {
    if (context.params.user && (context.method === 'patch' || context.method === 'remove')) {
      return context.params.user._id
    }

    return value
  }
})
