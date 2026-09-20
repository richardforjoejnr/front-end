/**
 * Settings shared by every environment. Each environment file spreads these and
 * overrides only what differs, so a new environment is a few lines rather than a copy.
 */
export const defaultConfig = {
  /** The messages service path, appended to `apiUrl`. */
  messagesPath: 'messages',
  /** How long a real-time (socket) event may take to reach a second client. */
  realtimeTimeout: 5000,
};

export type DefaultConfig = typeof defaultConfig;
