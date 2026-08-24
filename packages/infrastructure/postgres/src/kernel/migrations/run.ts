import {TypeormMigrationRunner} from './migration-runner'

try {
  await TypeormMigrationRunner.run()
} catch (error) {
  process.stderr.write(`${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`)
  process.exitCode = 1
}
