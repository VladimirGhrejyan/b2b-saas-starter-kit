import {describe, expect, it} from 'vitest'

import {Argon2PasswordHasher} from './argon2-password-hasher'

describe('Argon2PasswordHasher', () => {
  it('hashes and verifies a password', async () => {
    const hasher = new Argon2PasswordHasher()
    const passwordHash = await hasher.hash('secret-password')

    expect(passwordHash).not.toContain('secret-password')
    await expect(hasher.verify('secret-password', passwordHash)).resolves.toBe(true)
    await expect(hasher.verify('wrong-password', passwordHash)).resolves.toBe(false)
  })

  it('returns false for a malformed hash', async () => {
    const hasher = new Argon2PasswordHasher()

    await expect(hasher.verify('secret-password', 'not-a-hash')).resolves.toBe(false)
  })
})
