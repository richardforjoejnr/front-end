import { type APIRequestContext, type APIResponse, request } from '@playwright/test';

import { messagesUrl } from '../../../../config';
import { bearer } from './authRequests';

export interface Message {
  _id: string;
  text: string;
  createdAt: string;
  /** The author, set by the server from the token that created the message. */
  userId: string;
  /** Populated from `userId`. Missing once the author deleted their account. */
  user?: { _id: string; email: string };
}

/** Feathers returns a page, not a bare array, because the service is paginated. */
export interface MessagePage {
  total: number;
  limit: number;
  skip: number;
  data: Message[];
}

/**
 * A request context for use outside a test's own fixtures. With a token every request is
 * made as that user, which `messages` requires; a per-request header still overrides it.
 */
export async function newMessagesContext(accessToken?: string): Promise<APIRequestContext> {
  return request.newContext({
    extraHTTPHeaders: { Accept: 'application/json', ...(accessToken ? bearer(accessToken) : {}) },
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

export async function createMessage(
  api: APIRequestContext,
  data: Record<string, unknown>,
  accessToken?: string,
): Promise<APIResponse> {
  return api.post(messagesUrl, { data, headers: accessToken ? bearer(accessToken) : undefined });
}

export async function patchMessage(
  api: APIRequestContext,
  id: string,
  data: Record<string, unknown>,
): Promise<APIResponse> {
  return api.patch(`${messagesUrl}/${id}`, { data });
}

export async function removeMessage(api: APIRequestContext, id: string, accessToken?: string): Promise<APIResponse> {
  return api.delete(`${messagesUrl}/${id}`, { headers: accessToken ? bearer(accessToken) : undefined });
}
