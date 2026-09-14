import {TypeormMigrationCli} from './typeorm-migration-cli'

try {
  await TypeormMigrationCli.create()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`)
  process.exitCode = 1
}
