import {Inject, Injectable} from '@nestjs/common'

import {REFRESH_TTL_MS} from '@b2b-saas-starter-kit/composition'

import type {JwtAccessConfig} from './jwt-access.types'
import {JWT_ACCESS_CONFIG} from './jwt-access-config.token'
import {REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH} from './refresh-cookie.constants'
import type {RefreshCookieOptions, RefreshCookieRequest, RefreshCookieResponse} from './refresh-cookie.types'

@Injectable()
export class RefreshCookie {
  constructor(@Inject(JWT_ACCESS_CONFIG) private readonly config: JwtAccessConfig) {}

  read(request: RefreshCookieRequest): string | undefined {
    const value = request.cookies?.[REFRESH_COOKIE_NAME]

    return typeof value === 'string' && value.length > 0 ? value : undefined
  }

  set(response: RefreshCookieResponse, refreshToken: string): void {
    response.cookie(REFRESH_COOKIE_NAME, refreshToken, this.options(REFRESH_TTL_MS))
  }

  clear(response: RefreshCookieResponse): void {
    response.clearCookie(REFRESH_COOKIE_NAME, this.options(0))
  }

  private options(maxAge: number): RefreshCookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      secure: this.config.cookieSecure,
      maxAge,
    }
  }
}
