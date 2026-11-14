import { defineConfig, devices } from '@playwright/test';

const ci = Boolean(process.env.CI);

// Browser-Tests laufen gegen den fertigen Build (npm run build), so wie er ausgeliefert wird.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: ci,
  retries: ci ? 1 : 0,
  reporter: ci ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !ci,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // WebKit im iPad-Format: kommt dem Zielgerät am nächsten
    { name: 'ipad', use: { ...devices['iPad Pro 11'] } },
  ],
});
