import {join} from 'node:path'

import {WorkerBootstrap} from './bootstrap/worker-bootstrap'

void WorkerBootstrap.run(join(__dirname, 'config')).catch((error: unknown) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error)

  process.stderr.write(`${message}\n`)
  process.exit(1)
})
