import type {FetchArgs} from '@reduxjs/toolkit/query'

export function isAuthSessionUrl(args: string | FetchArgs): boolean {
  const url = typeof args === 'string' ? args : args.url

  return url.includes('auth/web/login') || url.includes('auth/web/refresh')
}
