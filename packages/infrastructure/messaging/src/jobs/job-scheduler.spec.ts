import {describe, expect, it, vi} from 'vitest'

import {JobScheduler} from './job-scheduler'

describe('JobScheduler', () => {
  it('upserts a repeatable maintenance job by every-ms', async () => {
    const maintenance = {
      upsertJobScheduler: vi.fn(async () => undefined),
      add: vi.fn(async () => undefined),
    }
    const outbox = {
      add: vi.fn(async () => undefined),
    }
    const scheduler = new JobScheduler(maintenance as never, outbox as never)

    await scheduler.upsertJobScheduler('purge-refresh-sessions', 3_600_000)

    expect(maintenance.upsertJobScheduler).toHaveBeenCalledWith(
      'purge-refresh-sessions',
      {every: 3_600_000},
      {name: 'purge-refresh-sessions', data: {}},
    )
  })

  it('enqueues an outbox job keyed by outbox id', async () => {
    const maintenance = {
      upsertJobScheduler: vi.fn(),
      add: vi.fn(),
    }
    const outbox = {
      add: vi.fn(async () => undefined),
    }
    const scheduler = new JobScheduler(maintenance as never, outbox as never)
    const payload = {outboxId: 'outbox-1', eventType: 'UserCreated', tenantId: null}

    await scheduler.addOutboxJob(payload)

    expect(outbox.add).toHaveBeenCalledWith('UserCreated', payload, {jobId: 'outbox-1'})
  })
})
