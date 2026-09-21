import {existsSync} from 'node:fs'
import {join} from 'node:path'

export class PlaywrightProcessEnv {
  static loadWorkspaceEnv(workspaceRoot: string): void {
    const candidates = [
      process.env.NX_WORKSPACE_ROOT ? join(process.env.NX_WORKSPACE_ROOT, 'infra/env/.env') : undefined,
      join(workspaceRoot, 'infra/env/.env'),
      join(process.cwd(), 'infra/env/.env'),
      join(process.cwd(), '../../infra/env/.env'),
    ]

    const envPath = candidates.find((candidate) => candidate !== undefined && existsSync(candidate))

    if (envPath) {
      process.loadEnvFile(envPath)
    }
  }

  static databaseUrl(): string {
    return PlaywrightProcessEnv.applyComposeHostPort(
      process.env.DATABASE_URL ?? 'postgres://app:change-me-local-only@localhost:5432/app',
      process.env.POSTGRES_PORT,
    )
  }

  static applyComposeHostPort(urlString: string, port: string | undefined): string {
    if (!port) {
      return urlString
    }

    const url = new URL(urlString)

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.port = port
    }

    return url.toString()
  }

  static merge(overrides: Record<string, string>): Record<string, string> {
    const env: Record<string, string> = {}

    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value
      }
    }

    return Object.assign(env, overrides)
  }
}
