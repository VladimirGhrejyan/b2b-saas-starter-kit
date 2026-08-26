export type PostgresTestDatabase = {
  readonly databaseUrl: string
  truncate(): Promise<void>
  destroy(): Promise<void>
}
