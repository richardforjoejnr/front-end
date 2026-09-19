import { resolve } from 'node:path';

import * as dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../.env') });

export interface Environment {
  /** Environment name, used in report titles. */
  name: string;
  /** Where the browser navigates to. */
  baseUrl: string;
  /** Where API requests are sent. Same origin as `baseUrl` for this app. */
  apiUrl: string;
  /** The messages service path, appended to `apiUrl`. */
  messagesPath: string;
  /** How long a real-time (socket) event may take to reach a second client. */
  realtimeTimeout: number;
}

let environment: Environment;

const env = process.env.NODE_ENV || 'localhost';

try {
  /* eslint-disable-next-line @typescript-eslint/no-require-imports */
  environment = require(`./${env}`).default;
} catch (error) {
  console.error(error);
  throw new Error(`Configuration file for environment "${env}" not found.`);
}

/** Full URL of the messages service, e.g. http://localhost:3031/messages */
export const messagesUrl = `${environment.apiUrl}/${environment.messagesPath}`;

export default environment;
