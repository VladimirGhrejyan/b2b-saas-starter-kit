import {describe, expect, it} from 'vitest'

import {AppController} from './app.controller'

describe('AppController', () => {
  it('returns the Hello World payload', () => {
    const controller = new AppController()

    expect(controller.hello()).toEqual({message: 'Hello World', app: 'api'})
  })
})
