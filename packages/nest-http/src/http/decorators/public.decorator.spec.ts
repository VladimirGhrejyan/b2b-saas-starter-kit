import {describe, expect, it} from 'vitest'

import {IS_PUBLIC_KEY} from './is-public-key'
import {Public} from './public.decorator'

describe('Public', () => {
  it('sets isPublic metadata on the method', () => {
    class Probe {
      @Public()
      ping(): string {
        return 'ok'
      }
    }

    expect(Reflect.getMetadata(IS_PUBLIC_KEY, Probe.prototype.ping)).toBe(true)
  })
})
