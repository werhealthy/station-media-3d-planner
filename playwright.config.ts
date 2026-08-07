import { defineConfig, devices } from '@playwright/test'

// Alcuni ambienti CI/sandbox forniscono un Chromium pre-installato in un
// percorso non standard (es. sandbox di sviluppo remoto) e impostano questa
// variabile per usarlo invece di scaricarne uno. In locale, sulla macchina
// dello sviluppatore, questa variabile non è definita e Playwright usa il
// browser installato normalmente con `npx playwright install`.
const chromiumExecutablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromiumExecutablePath
          ? { launchOptions: { executablePath: chromiumExecutablePath } }
          : {}),
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
