import { defineConfig, devices } from '@playwright/test'

/**
 * E2E (PROMPTS.md T1). Cần dữ liệu seed: pnpm seed --reset
 * Local: pnpm test:e2e (tự chạy pnpm dev + mock CRM nếu chưa chạy).
 * CI: chạy với bản build standalone (E2E_NO_SERVER=1, E2E_BASE_URL).
 */
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'vi-VN',
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /mobile\.spec\.ts/,
      // E2E_CHANNEL=chrome: dùng Chrome đã cài trên máy thay vì tải trình duyệt của Playwright
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 }, channel: process.env.E2E_CHANNEL },
    },
    {
      name: 'mobile',
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices['Pixel 7'], channel: process.env.E2E_CHANNEL },
    },
  ],
  webServer: process.env.E2E_NO_SERVER
    ? undefined
    : [
        { command: 'pnpm dev', url: baseURL, reuseExistingServer: true, timeout: 180_000 },
        { command: 'pnpm mock-crm', url: 'http://localhost:4010/health', reuseExistingServer: true },
      ],
})
