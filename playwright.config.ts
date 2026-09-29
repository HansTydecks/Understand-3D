import { defineConfig, devices } from "@playwright/test";

// In der Cloud-Umgebung liegt Chromium vorinstalliert unter /opt/pw-browsers; in CI installiert
// `playwright install chromium` den passenden Browser. PW_CHROMIUM_PATH überschreibt bei Bedarf.
const executablePath = process.env.PW_CHROMIUM_PATH;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 180_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure",
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "pnpm build && pnpm preview",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
