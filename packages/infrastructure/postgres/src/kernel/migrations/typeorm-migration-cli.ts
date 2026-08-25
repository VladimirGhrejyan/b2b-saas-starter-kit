import {mkdir, writeFile} from 'node:fs/promises'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

/**
 * Scaffolds or generates a context-prefixed migration for review. Does not register it.
 * `generate` loads the DataSource lazily so `create` does not import entities.
 */
export class TypeormMigrationCli {
  static readonly #migrationsDir = fileURLToPath(new URL('.', import.meta.url))

  static readonly #namePattern = /^(identity|tenancy|authorization|audit|notifications)-[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

  static readonly #registerHint =
    'Review the file, then append the class to src/kernel/data-source/postgres-migrations.ts.'

  static async create(argv: readonly string[] = process.argv): Promise<void> {
    const name = TypeormMigrationCli.readName(argv)
    const timestamp = Date.now()
    const className = TypeormMigrationCli.#className(name, timestamp)
    const filePath = TypeormMigrationCli.#filePath(name, timestamp)

    await TypeormMigrationCli.#write(
      filePath,
      `import type {MigrationInterface, QueryRunner} from 'typeorm'

export class ${className} implements MigrationInterface {
  name = '${className}'

  async up(_queryRunner: QueryRunner): Promise<void> {}

  async down(_queryRunner: QueryRunner): Promise<void> {}
}
`,
    )

    process.stdout.write(`Created ${filePath}\n${TypeormMigrationCli.#registerHint}\n`)
  }

  static async generate(argv: readonly string[] = process.argv): Promise<void> {
    const name = TypeormMigrationCli.readName(argv)
    const timestamp = Date.now()
    const className = TypeormMigrationCli.#className(name, timestamp)
    const filePath = TypeormMigrationCli.#filePath(name, timestamp)

    const {loadPostgresConfigFromEnv} = await import('../config/load-postgres-config')
    const {createDataSource} = await import('../data-source/create-data-source')
    const dataSource = createDataSource(loadPostgresConfigFromEnv())

    try {
      await dataSource.initialize()

      const sql = await dataSource.driver.createSchemaBuilder().log()
      const upSqls = sql.upQueries.map((query) => TypeormMigrationCli.#queryCall(query.query, query.parameters))
      const downSqls = [...sql.downQueries]
        .reverse()
        .map((query) => TypeormMigrationCli.#queryCall(query.query, query.parameters))

      if (upSqls.length === 0) {
        throw new Error(
          'No schema changes vs the current database. Use postgres:migration:create for an empty scaffold.',
        )
      }

      await TypeormMigrationCli.#write(
        filePath,
        `import type {MigrationInterface, QueryRunner} from 'typeorm'

export class ${className} implements MigrationInterface {
  name = '${className}'

  async up(queryRunner: QueryRunner): Promise<void> {
${upSqls.join('\n')}
  }

  async down(queryRunner: QueryRunner): Promise<void> {
${downSqls.join('\n')}
  }
}
`,
      )
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy()
      }
    }

    process.stdout.write(`Generated ${filePath}\n${TypeormMigrationCli.#registerHint}\n`)
  }

  static readName(argv: readonly string[]): string {
    for (let index = 0; index < argv.length; index += 1) {
      const arg = argv[index]

      if (arg === '--name') {
        if (index + 1 >= argv.length || argv[index + 1].startsWith('-')) {
          throw new Error('Pass --name=<context>-<change>, e.g. --name=tenancy-add-slug')
        }

        return TypeormMigrationCli.assertMigrationName(argv[index + 1])
      }

      if (arg.startsWith('--name=')) {
        return TypeormMigrationCli.assertMigrationName(arg.slice('--name='.length))
      }
    }

    const positional = argv.find((arg) => TypeormMigrationCli.#namePattern.test(arg.replace(/\.ts$/i, '')))

    if (positional !== undefined) {
      return TypeormMigrationCli.assertMigrationName(positional)
    }

    throw new Error('Pass --name=<context>-<change>, e.g. --name=tenancy-add-slug')
  }

  static assertMigrationName(raw: string): string {
    const name = raw.trim().replace(/\.ts$/i, '')

    if (name.includes('/') || name.includes('\\') || name.includes('..')) {
      throw new Error('Migration name must be a kebab-case stem, not a path')
    }

    if (!TypeormMigrationCli.#namePattern.test(name)) {
      throw new Error(
        'Migration name must be context-prefixed kebab-case, e.g. tenancy-add-slug (identity|tenancy|authorization|audit|notifications)',
      )
    }

    return name
  }

  static #className(name: string, timestamp: number): string {
    const pascal = name
      .split('-')
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join('')

    return `${pascal}${String(timestamp)}`
  }

  static #filePath(name: string, timestamp: number): string {
    return join(TypeormMigrationCli.#migrationsDir, `${String(timestamp)}-${name}.ts`)
  }

  static #queryCall(query: string, parameters: unknown[] | undefined): string {
    const params = parameters !== undefined && parameters.length > 0 ? `, ${JSON.stringify(parameters)}` : ''

    return `    await queryRunner.query(\`${TypeormMigrationCli.#escapeSql(query)}\`${params})`
  }

  static #escapeSql(query: string): string {
    return query.replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${')
  }

  static async #write(filePath: string, contents: string): Promise<void> {
    await mkdir(dirname(filePath), {recursive: true})

    try {
      await writeFile(filePath, contents, {flag: 'wx'})
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
        throw new Error(`Migration file already exists: ${filePath}`, {cause: error})
      }

      throw error
    }
  }
}
