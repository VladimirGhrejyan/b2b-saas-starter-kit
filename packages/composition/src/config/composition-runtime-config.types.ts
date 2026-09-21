export type CompositionPostgresSlice = {
  readonly url: string
  readonly poolMax?: number
  readonly connectTimeoutMs?: number
  readonly statementTimeoutMs?: number
  readonly lockTimeoutMs?: number
  readonly idleInTxTimeoutMs?: number
  readonly applicationName?: string
  readonly slowQueryMs?: number
}

export type CompositionRedisSlice = {
  readonly url: string
  readonly keyPrefix?: string
}

export type CompositionHttpClientSlice = {
  readonly timeoutMs?: number
  readonly connectTimeoutMs?: number
  readonly poolMax?: number
  readonly maxResponseBytes?: number
  readonly userAgent?: string
  readonly maxRedirects?: number
  readonly httpsProxy?: string
  readonly noProxy?: string
}

export type CompositionSmtpMailSlice = {
  readonly transport: 'smtp'
  readonly from: string
  readonly host: string
  readonly port?: number
  readonly user?: string
  readonly pass?: string
  readonly secure?: boolean
}

export type CompositionHttpMailSlice = {
  readonly transport: 'http'
  readonly from: string
  readonly url: string
  readonly apiKey?: string
}

export type CompositionMailSlice = CompositionSmtpMailSlice | CompositionHttpMailSlice

export type CompositionRuntimeConfig = {
  readonly postgres: CompositionPostgresSlice
  readonly redis: CompositionRedisSlice
  readonly httpClient?: CompositionHttpClientSlice
  readonly mail?: CompositionMailSlice | null
}
