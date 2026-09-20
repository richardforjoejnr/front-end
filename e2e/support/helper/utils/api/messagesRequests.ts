import { type APIRequestContext, type APIResponse, request } from '@playwright/test';

import { messagesUrl } from '../../../../config';

export interface Message {
  _id: string;
  text: string;
  createdAt: string;
}

/** Feathers returns a page, not a bare array, because the service is paginated. */
export interface MessagePage {
  total: number;
  limit: number;
  skip: number;
  data: Message[];
}

/** A request context for the messages service, for use outside a test's own fixtures. */
export async function newMessagesContext(): Promise<APIRequestContext> {
  return request.newContext({
    extraHTTPHeaders: { Accept: 'application/json' },
  });
}

export async function findMessages(
  api: APIRequestContext,
  query: Record<string, string | number> = {},
): Promise<APIResponse> {
  return api.get(messagesUrl, { params: query });
}

export async function getMessage(api: APIRequestContext, id: string): Promise<APIResponse> {
  return api.get(`${messagesUrl}/${id}`);
}

export async function createMessage(api: APIRequestContext, data: Record<string, unknown>): Promise<APIResponse> {
  return api.post(messagesUrl, { data });
}

export async function patchMessage(
  api: APIRequestContext,
  id: string,
  data: Record<string, unknown>,
): Promise<APIResponse> {
  return api.patch(`${messagesUrl}/${id}`, { data });
}

export async function removeMessage(api: APIRequestContext, id: string): Promise<APIResponse> {
  return api.delete(`${messagesUrl}/${id}`);
}
