import {join} from 'node:path'

import {ApiBootstrap} from './bootstrap/api-bootstrap'

void ApiBootstrap.run(join(__dirname, 'config')).catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error)

  process.stderr.write(`${message}\n`)
  process.exit(1)
})
