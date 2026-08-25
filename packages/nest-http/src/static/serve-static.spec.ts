import {ServeStaticModule} from '@nestjs/serve-static'
import {describe, expect, it} from 'vitest'

import {ServeStatic} from './serve-static'

describe('ServeStatic', () => {
  it('builds a ServeStaticModule rooted at the configured directory', () => {
    const module = ServeStatic.forRoot({
      rootPath: '/tmp/static',
      serveRoot: '/static',
      exclude: ['/v1/(.*)'],
    })

    expect(module.module).toBe(ServeStaticModule)
  })
})
