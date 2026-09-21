import {workspaceRoot} from '@nx/devkit'
import {nxE2EPreset} from '@nx/playwright/preset'
import {defineConfig, devices} from '@playwright/test'

import {PlaywrightProcessEnv} from './playwright-process-env'

PlaywrightProcessEnv.loadWorkspaceEnv(workspaceRoot)

const baseURL = process.env.BASE_URL ?? 'http://localhost:4200'

export default defineConfig({
  ...nxE2EPreset(import.meta.dirname, {testDir: './src'}),
  fullyParallel: false,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'pnpm nx run postgres:migration:run && pnpm nx serve api --inspect=false',
      url: 'http://localhost:3000/health',
      reuseExistingServer: !process.env.CI,
      cwd: workspaceRoot,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: PlaywrightProcessEnv.merge({
        NODE_OPTIONS: '',
        APP_TYPE: 'api',
        CORS_ORIGINS: 'http://localhost:4200',
        CORS_CREDENTIALS: 'true',
        DATABASE_URL: PlaywrightProcessEnv.databaseUrl(),
        REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
      }),
    },
    {
      command: 'pnpm nx serve web',
      url: 'http://localhost:4200',
      reuseExistingServer: !process.env.CI,
      cwd: workspaceRoot,
      timeout: 180_000,
      stdout: 'pipe',
      stderr: 'pipe',
      env: PlaywrightProcessEnv.merge({
        NODE_OPTIONS: '',
        NODE_ENV: 'development',
      }),
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
  ],
})
