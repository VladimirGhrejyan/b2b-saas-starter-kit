import {describe, expect, it} from 'vitest'

import {readClientIp} from './read-client-ip'

describe('readClientIp', () => {
  it('prefers Express req.ip', () => {
    expect(readClientIp({ip: '203.0.113.10', socket: {remoteAddress: '127.0.0.1'}})).toBe('203.0.113.10')
  })

  it('falls back to the socket address', () => {
    expect(readClientIp({socket: {remoteAddress: '127.0.0.1'}})).toBe('127.0.0.1')
  })

  it('uses unknown when no address is present', () => {
    expect(readClientIp({})).toBe('unknown')
  })
})
