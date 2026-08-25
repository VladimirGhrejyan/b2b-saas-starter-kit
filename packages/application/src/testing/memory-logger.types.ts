import type {LogLevel} from '@b2b-saas-starter-kit/platform'

export type MemoryLogRecord = {
  level: LogLevel
  context: string | undefined
  data: object | undefined
  message: string | undefined
}
