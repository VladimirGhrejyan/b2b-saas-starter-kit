import 'reflect-metadata'

import {TypeormMigrationCli} from './typeorm-migration-cli'

try {
  await TypeormMigrationCli.generate()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`)
  process.exitCode = 1
}
