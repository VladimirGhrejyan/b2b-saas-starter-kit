import type {CompositionMailSlice, CompositionRuntimeConfig} from './composition-runtime-config.types'

export function toCompositionRuntimeConfig(input: {
  postgres: CompositionRuntimeConfig['postgres']
  redis: CompositionRuntimeConfig['redis']
  httpClient?: CompositionRuntimeConfig['httpClient']
  mail?: CompositionMailSlice | null
}): CompositionRuntimeConfig {
  return {
    postgres: input.postgres,
    redis: input.redis,
    httpClient: input.httpClient,
    mail: input.mail ?? null,
  }
}
