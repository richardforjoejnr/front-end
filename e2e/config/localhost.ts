import { defaultConfig } from './defaultConfig';

/**
 * The app started by `npm run docker:up` in feathers-chat/.
 *
 * It publishes container port 3030 on host port 3031 by default (3030 is usually taken
 * on this machine), and `APP_PORT` overrides that — so the same variable is honoured here.
 */
const port = process.env.APP_PORT ?? '3031';
const baseUrl = process.env.BASE_URL ?? `http://localhost:${port}`;

const localhost = {
  ...defaultConfig,
  name: 'localhost',
  baseUrl,
  // The Feathers app serves the UI and the REST API from the same origin
  apiUrl: baseUrl,
};

export default localhost;
