import type { APIRequestContext, APIResponse } from '@playwright/test';

import environment from '../../../../config';

export interface User {
  _id: string;
  email: string;
  password?: string;
}

export interface Credentials extends Record<string, unknown> {
  email: string;
  password: string;
}

export interface AuthenticationResult {
  accessToken: string;
  authentication: { strategy: string };
  user: User;
}

export const usersUrl = `${environment.apiUrl}/users`;
export const authenticationUrl = `${environment.apiUrl}/authentication`;

export function bearer(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function createUser(api: APIRequestContext, data: Record<string, unknown>): Promise<APIResponse> {
  return api.post(usersUrl, { data });
}

export async function findUsers(
  api: APIRequestContext,
  accessToken?: string,
  query: Record<string, string | number> = {},
): Promise<APIResponse> {
  return api.get(usersUrl, {
    params: query,
    headers: accessToken ? bearer(accessToken) : undefined,
  });
}

export async function getUser(api: APIRequestContext, id: string, accessToken?: string): Promise<APIResponse> {
  return api.get(`${usersUrl}/${id}`, { headers: accessToken ? bearer(accessToken) : undefined });
}

export async function removeUser(api: APIRequestContext, id: string, accessToken?: string): Promise<APIResponse> {
  return api.delete(`${usersUrl}/${id}`, { headers: accessToken ? bearer(accessToken) : undefined });
}

/** Exchanges email + password for a JWT via the `local` strategy. */
export async function authenticateLocal(api: APIRequestContext, credentials: Credentials): Promise<APIResponse> {
  return api.post(authenticationUrl, { data: { strategy: 'local', ...credentials } });
}

/** Re-authenticates with an existing JWT via the `jwt` strategy. */
export async function authenticateJwt(api: APIRequestContext, accessToken: string): Promise<APIResponse> {
  return api.post(authenticationUrl, { data: { strategy: 'jwt', accessToken } });
}
