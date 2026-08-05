/**
 * Environment configuration.
 *
 * Values are read from environment variables so the suite can be pointed at a
 * different deployment (or run with different credentials) without a code change.
 * The demo credentials below are published in the assessment brief and are safe
 * defaults; real projects would supply these via CI secrets and commit no default.
 */

export const APP_URL =
  process.env.APP_URL ?? 'https://create-asana-like-pr-39y5.bolt.host/';

export const CREDENTIALS = {
  username: process.env.APP_USERNAME ?? 'admin',
  password: process.env.APP_PASSWORD ?? 'password123',
} as const;
