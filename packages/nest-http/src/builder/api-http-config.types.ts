export type ApiSwaggerBasicAuth = {
  username: string
  password: string
}

export type ApiSwaggerSchemaConfig = {
  /** Absolute or cwd-relative directory. Overrides `staticAssets.rootPath` + `relativePath`. */
  outputDirectory?: string
  /** Subdirectory under `staticAssets.rootPath` when `outputDirectory` is omitted. */
  relativePath?: string
  filename?: string
}

export type ApiSwaggerConfig = {
  enabled: boolean
  path?: string
  description?: string
  basicAuth?: ApiSwaggerBasicAuth
  /** JWT bearer button in Swagger UI. Default true. */
  bearerAuth?: boolean
  /** Persist the authorize token in the browser. Default true. */
  persistAuthorization?: boolean
  schema?: ApiSwaggerSchemaConfig
}

export type ApiStaticConfig = {
  /** Filesystem directory (absolute or cwd-relative). */
  rootPath: string
  /** URL prefix, e.g. `/static`. */
  serveRoot: string
  /** Glob patterns that must not be served (keep API routes). */
  exclude?: string[]
}

export type ApiHttpConfig = {
  title: string
  port: number
  host?: string
  version?: string
  globalPrefix?: string
  isProduction: boolean
  isPlainHttp?: boolean
  corsOrigins: string[]
  corsCredentials?: boolean
  swagger?: ApiSwaggerConfig
  staticAssets?: ApiStaticConfig
}
