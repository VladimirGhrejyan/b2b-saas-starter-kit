import {describe, expect, it} from 'vitest'

import {applyComposeHostPort} from './apply-compose-host-port'

describe('applyComposeHostPort', () => {
  it('rewrites localhost URLs to POSTGRES_PORT', () => {
    const url = applyComposeHostPort('postgres://app:secret@localhost:5432/app', '5433')

    expect(url).toBe('postgres://app:secret@localhost:5433/app')
  })

  it('leaves remote hosts unchanged', () => {
    const url = applyComposeHostPort('postgres://app:secret@postgres:5432/app', '5433')

    expect(url).toBe('postgres://app:secret@postgres:5432/app')
  })

  it('returns the original URL when no port is given', () => {
    const url = applyComposeHostPort('postgres://app:secret@127.0.0.1:5432/app', undefined)

    expect(url).toBe('postgres://app:secret@127.0.0.1:5432/app')
  })
})
