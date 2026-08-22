import {describe, expect, it} from 'vitest'

import {HelloWorldService} from './hello-world.service'

describe('HelloWorldService', () => {
  it('returns the Hello World payload', () => {
    const service = new HelloWorldService()

    expect(service.hello()).toEqual({message: 'Hello World', app: 'worker'})
  })
})
