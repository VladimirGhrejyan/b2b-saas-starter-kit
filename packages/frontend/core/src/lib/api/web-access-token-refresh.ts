import {type AuthSessionOutput, authSessionOutputSchema} from '@b2b-saas-starter-kit/contracts'
import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import {FrontendCoreConfigLocator} from '../../config/frontend-core-config.locator'

export class WebAccessTokenRefresh {
  static readonly instance = new WebAccessTokenRefresh()

  static readonly path = 'auth/web/refresh'

  private inflight: Promise<AuthSessionOutput | null> | undefined

  async run(): Promise<AuthSessionOutput | null> {
    if (!TypeScriptUtils.isNil(this.inflight)) {
      return this.inflight
    }

    this.inflight = this.refresh().finally(() => {
      this.inflight = undefined
    })

    return this.inflight
  }

  reset(): void {
    this.inflight = undefined
  }

  private async refresh(): Promise<AuthSessionOutput | null> {
    const baseUrl = FrontendCoreConfigLocator.get().baseUrl.replace(/\/$/, '')

    try {
      const response = await fetch(`${baseUrl}/${WebAccessTokenRefresh.path}`, {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        return null
      }

      const parsed = authSessionOutputSchema.safeParse(await response.json())

      return parsed.success ? parsed.data : null
    } catch {
      return null
    }
  }
}
