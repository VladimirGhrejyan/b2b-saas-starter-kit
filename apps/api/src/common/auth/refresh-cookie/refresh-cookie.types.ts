export type RefreshCookieOptions = {
  readonly httpOnly: true
  readonly sameSite: 'lax'
  readonly path: string
  readonly secure: boolean
  readonly maxAge: number
}

export type RefreshCookieRequest = {
  readonly cookies?: Readonly<Record<string, string | undefined>>
}

export type RefreshCookieResponse = {
  cookie(name: string, value: string, options: RefreshCookieOptions): void
  clearCookie(name: string, options: RefreshCookieOptions): void
}
