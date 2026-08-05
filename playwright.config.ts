import { defineConfig, devices } from '@playwright/test';
import { APP_URL } from './src/config/environment';

export default defineConfig({
  testDir: './tests',

  /* Every test is independent, so run the whole suite in parallel. */
  fullyParallel: true,

  /* A stray `test.only` should fail the build rather than silently skip coverage. */
  forbidOnly: !!process.env.CI,

  /* Retry in CI to absorb transient network noise against the hosted demo app. */
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: APP_URL,
    /* Diagnostics kept for failures only, so a green run stays cheap. */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  expect: {
    timeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
