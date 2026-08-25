import {describe, expect, it} from 'vitest'

import {createDataSource} from './create-data-source'

describe('createDataSource', () => {
  it('builds an uninitialized postgres DataSource', () => {
    const dataSource = createDataSource({
      DATABASE_URL: 'postgres://app:change-me-local-only@127.0.0.1:5432/app',
    })

    expect(dataSource.options.type).toBe('postgres')
    expect(dataSource.isInitialized).toBe(false)
    expect(dataSource.options.entities).not.toHaveLength(0)
    expect(dataSource.options.migrations).toHaveLength(0)
  })
})
