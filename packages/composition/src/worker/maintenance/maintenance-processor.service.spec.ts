import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {DateUtils} from '@b2b-saas-starter-kit/utils'

import type {Clock, Logger} from '@b2b-saas-starter-kit/platform'
import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {
  PURGE_BATCH_SIZE,
  type PurgePasswordResetTokensUseCase,
  type PurgeRefreshSessionsUseCase,
  type PurgeStaleInvitationsUseCase,
} from '@b2b-saas-starter-kit/application'

import type {OutboxRelay} from '@b2b-saas-starter-kit/postgres'
import type {JobHandler, JobScheduler, QueueWorkerFactory} from '@b2b-saas-starter-kit/messaging'
import {MaintenanceJobName} from '@b2b-saas-starter-kit/messaging'

import {MaintenanceProcessorService} from './maintenance-processor.service'
import type {WorkerMaintenanceConfig} from './worker-maintenance-config.token'

type LogEntry = {
  readonly level: 'warn'
  readonly data: object
  readonly message?: string
}

const now = new Date('2026-01-01T00:00:00.000Z')
const config: WorkerMaintenanceConfig = {
  refreshSessionsEveryMs: DateUtils.secToMs(DateUtils.hourToSec(1)),
  passwordResetTokensEveryMs: DateUtils.secToMs(DateUtils.dayToSec(1)),
  staleInvitationsEveryMs: DateUtils.secToMs(DateUtils.dayToSec(1)),
  reclaimStaleOutboxEveryMs: DateUtils.secToMs(DateUtils.minToSec(1)),
  staleProcessingMs: DateUtils.secToMs(DateUtils.minToSec(5)),
}

describe('MaintenanceProcessorService', () => {
  const logs: LogEntry[] = []

  const logger: Logger = {
    context: () => logger,
    trace: () => undefined,
    debug: () => undefined,
    info: () => undefined,
    warn: (dataOrMessage, message) => {
      logs.push({level: 'warn', data: dataOrMessage as object, message})
    },
    error: () => undefined,
    fatal: () => undefined,
  }

  beforeEach(() => {
    logs.length = 0
    LoggerLocator.init(logger)
  })

  afterEach(() => {
    LoggerLocator.reset()
  })

  it('runs each known maintenance job without a follow-up when the batch is partial', async () => {
    const {handleJob, purgeRefreshSessions, purgePasswordResetTokens, purgeStaleInvitations, outboxRelay, scheduler} =
      createProcessor()

    await handleJob(job(MaintenanceJobName.purgeRefreshSessions))
    await handleJob(job(MaintenanceJobName.purgePasswordResetTokens))
    await handleJob(job(MaintenanceJobName.purgeStaleInvitations))
    await handleJob(job(MaintenanceJobName.reclaimStaleOutbox))

    expect(purgeRefreshSessions.execute).toHaveBeenCalledOnce()
    expect(purgePasswordResetTokens.execute).toHaveBeenCalledOnce()
    expect(purgeStaleInvitations.execute).toHaveBeenCalledOnce()
    expect(outboxRelay.reclaimStaleProcessing).toHaveBeenCalledWith(
      DateUtils.fromUnixMs(DateUtils.toUnixMs(now) - config.staleProcessingMs),
      PURGE_BATCH_SIZE,
    )
    expect(scheduler.addMaintenanceJob).not.toHaveBeenCalled()
  })

  it('enqueues another job when a purge batch is full', async () => {
    const {handleJob, purgeRefreshSessions, scheduler} = createProcessor()

    purgeRefreshSessions.execute.mockResolvedValue({deleted: PURGE_BATCH_SIZE})

    await handleJob(job(MaintenanceJobName.purgeRefreshSessions))

    expect(purgeRefreshSessions.execute).toHaveBeenCalledOnce()
    expect(scheduler.addMaintenanceJob).toHaveBeenCalledWith(MaintenanceJobName.purgeRefreshSessions)
  })

  it('throws on an unknown job name and does not enqueue a follow-up', async () => {
    const {handleJob, scheduler} = createProcessor()

    await expect(handleJob(job('not-a-job'))).rejects.toThrow('Unknown maintenance job: not-a-job')
    expect(logs).toEqual([{level: 'warn', data: {jobName: 'not-a-job'}, message: 'unknown maintenance job'}])
    expect(scheduler.addMaintenanceJob).not.toHaveBeenCalled()
  })
})

function job(name: string): Parameters<JobHandler>[0] {
  return {name, data: {}, attemptsMade: 0, maxAttempts: 1}
}

function createProcessor(): {
  handleJob: JobHandler
  purgeRefreshSessions: {readonly execute: ReturnType<typeof vi.fn>}
  purgePasswordResetTokens: {readonly execute: ReturnType<typeof vi.fn>}
  purgeStaleInvitations: {readonly execute: ReturnType<typeof vi.fn>}
  outboxRelay: {readonly reclaimStaleProcessing: ReturnType<typeof vi.fn>}
  scheduler: {readonly addMaintenanceJob: ReturnType<typeof vi.fn>}
} {
  let handleJob: JobHandler | undefined

  const purgeRefreshSessions = {execute: vi.fn(async () => ({deleted: 1}))}
  const purgePasswordResetTokens = {execute: vi.fn(async () => ({deleted: 1}))}
  const purgeStaleInvitations = {execute: vi.fn(async () => ({deleted: 1}))}
  const outboxRelay = {reclaimStaleProcessing: vi.fn(async () => 1)}
  const scheduler = {addMaintenanceJob: vi.fn(async () => undefined)}
  const workers = {
    create: vi.fn((_queue: string, handler: JobHandler) => {
      handleJob = handler

      return {close: vi.fn(async () => undefined)}
    }),
  }
  const clock = {now: () => now} satisfies Clock

  const service = new MaintenanceProcessorService(
    workers as unknown as QueueWorkerFactory,
    scheduler as unknown as JobScheduler,
    purgeRefreshSessions as unknown as PurgeRefreshSessionsUseCase,
    purgePasswordResetTokens as unknown as PurgePasswordResetTokensUseCase,
    purgeStaleInvitations as unknown as PurgeStaleInvitationsUseCase,
    outboxRelay as unknown as OutboxRelay,
    clock,
    config,
  )

  service.onModuleInit()

  if (handleJob === undefined) {
    throw new Error('QueueWorkerFactory.create did not capture a handler')
  }

  return {
    handleJob,
    purgeRefreshSessions,
    purgePasswordResetTokens,
    purgeStaleInvitations,
    outboxRelay,
    scheduler,
  }
}
