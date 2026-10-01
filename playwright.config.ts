import { defineConfig } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
export default defineConfig({
  testDir: "./e2e",
  timeout: 90000,
  workers: 1,
  expect: { timeout: 15000 },
  use: {
    actionTimeout: 15000,
    navigationTimeout: 30000,
    channel: process.env.PLAYWRIGHT_CHANNEL,
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
    timeout: 120000,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
