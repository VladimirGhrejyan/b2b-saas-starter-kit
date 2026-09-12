import {describe, expect, it} from 'vitest'

import type {PasswordHasher} from './password-hasher.port'

describe('PasswordHasher', () => {
  it('hashes and verifies through the port', async () => {
    const hasher: PasswordHasher = {
      hash: async (password) => `hashed:${password}`,
      verify: async (password, passwordHash) => passwordHash === `hashed:${password}`,
    }

    const passwordHash = await hasher.hash('secret')

    expect(await hasher.verify('secret', passwordHash)).toBe(true)
    expect(await hasher.verify('other', passwordHash)).toBe(false)
  })
})
