import type {AppEnv, NodeEnv} from '@b2b-saas-starter-kit/config'

export type AuthBootstrapInput = {
  readonly nodeEnv: NodeEnv
  readonly appEnv: AppEnv | 'development'
  readonly jwtAccessSecret: string
  readonly corsOrigins: readonly string[]
}
