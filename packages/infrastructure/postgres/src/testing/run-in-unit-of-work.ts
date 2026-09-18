import type {DataSource} from 'typeorm'

import {TypeormUnitOfWork} from '../kernel/persistence/unit-of-work'

export async function runInUnitOfWork(dataSource: DataSource, work: () => Promise<void>): Promise<void> {
  const uow = new TypeormUnitOfWork(dataSource)

  await uow.run(async () => {
    await work()
  })
}
