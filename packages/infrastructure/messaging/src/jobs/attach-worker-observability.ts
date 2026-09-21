import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import type {ObservableWorker} from './attach-worker-observability.types'

/**
 * Attaches structured logs for BullMQ worker-level and per-job failures.
 */
export function attachWorkerObservability(worker: ObservableWorker, queueName: string): void {
  const log = LoggerLocator.get().context('QueueWorkerFactory')

  worker.on('error', (error) => {
    log.error({queueName, err: error}, 'worker error')
  })

  worker.on('stalled', (jobId) => {
    log.warn({queueName, jobId}, 'job stalled')
  })

  worker.on('failed', (job, error) => {
    const maxAttempts = job?.opts.attempts ?? 1
    const attemptsMade = job?.attemptsMade ?? 0
    const exhausted = attemptsMade >= maxAttempts

    log.error(
      {
        queueName,
        jobId: job?.id,
        name: job?.name,
        attemptsMade,
        maxAttempts,
        err: error,
      },
      exhausted ? 'job exhausted' : 'job failed',
    )
  })
}
