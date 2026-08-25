import {describe, expect, it} from 'vitest'
import {z} from 'zod'

import {createZodDto} from './create-zod-dto'

describe('createZodDto', () => {
  it('builds a DTO from a Zod 4 schema', () => {
    const schema = z.object({email: z.email()})

    class EmailDto extends createZodDto(schema) {}

    expect(EmailDto.create({email: 'dev@example.com'})).toEqual({email: 'dev@example.com'})
    expect(() => EmailDto.create({email: 'not-an-email'})).toThrow()
  })
})
