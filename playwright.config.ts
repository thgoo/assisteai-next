import { defineConfig, devices } from '@playwright/test';

// The front is built and served against e2e/mock-api.ts, never a real API
const MOCK_API_PORT = 3999;
const PORT = 3010;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'bun e2e/mock-api.ts',
      url: `http://localhost:${MOCK_API_PORT}/health`,
      env: { MOCK_API_PORT: String(MOCK_API_PORT) },
      reuseExistingServer: false,
    },
    {
      command: `bun run build && bun run start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      env: { NEXT_PUBLIC_API_URL: `http://localhost:${MOCK_API_PORT}` },
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
});
