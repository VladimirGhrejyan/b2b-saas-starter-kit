import type {DestinationStream} from 'pino'

import type {LogLevel} from '@b2b-saas-starter-kit/platform'

export type PinoLoggerOptions = {
  level?: LogLevel
  isPretty?: boolean
  /** Capture records without writing to stdout (unit tests). */
  destination?: DestinationStream
}
