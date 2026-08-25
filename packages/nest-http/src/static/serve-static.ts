import {isAbsolute, join} from 'node:path'
import {cwd} from 'node:process'

import type {DynamicModule} from '@nestjs/common'
import {ServeStaticModule} from '@nestjs/serve-static'

import type {ApiStaticConfig} from '../builder/api-http-config.types'

export class ServeStatic {
  static forRoot(config: ApiStaticConfig): DynamicModule {
    const rootPath = isAbsolute(config.rootPath) ? config.rootPath : join(cwd(), config.rootPath)

    return ServeStaticModule.forRoot({
      rootPath,
      serveRoot: config.serveRoot,
      ...(config.exclude === undefined ? {} : {exclude: config.exclude}),
    })
  }
}
