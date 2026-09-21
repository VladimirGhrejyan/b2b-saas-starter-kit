import {type DynamicModule, Global, Module} from '@nestjs/common'

import {COMPOSITION_RUNTIME_CONFIG} from './composition-runtime-config.token'
import type {CompositionRuntimeConfig} from './composition-runtime-config.types'

@Global()
@Module({})
export class RuntimeConfigModule {
  static forRoot(config: CompositionRuntimeConfig): DynamicModule {
    return {
      module: RuntimeConfigModule,
      global: true,
      providers: [{provide: COMPOSITION_RUNTIME_CONFIG, useValue: config}],
      exports: [COMPOSITION_RUNTIME_CONFIG],
    }
  }
}
