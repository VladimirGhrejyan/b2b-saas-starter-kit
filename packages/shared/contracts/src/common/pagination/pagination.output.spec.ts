import {describe, expect, it} from 'vitest'
import {z} from 'zod'

import {paginatedOutputSchema} from './pagination.output'

describe('paginatedOutputSchema', () => {
  it('parses a page of items', () => {
    const schema = paginatedOutputSchema(z.string(), {id: 'StringPage'})
    const parsed = schema.parse({
      items: ['a', 'b'],
      page: 1,
      pageSize: 20,
      total: 2,
    })

    expect(parsed.items).toEqual(['a', 'b'])
    expect(parsed.total).toBe(2)
  })

  it('rejects a non-positive page', () => {
    const schema = paginatedOutputSchema(z.string(), {id: 'StringPage'})
    const result = schema.safeParse({
      items: [],
      page: 0,
      pageSize: 20,
      total: 0,
    })

    expect(result.success).toBe(false)
  })
})
