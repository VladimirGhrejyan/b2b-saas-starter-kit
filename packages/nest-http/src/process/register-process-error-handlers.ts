import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

export function registerProcessErrorHandlers(): void {
  process.on('unhandledRejection', (reason: unknown) => {
    LoggerLocator.get().fatal(reason instanceof Error ? reason : {reason}, 'unhandledRejection')
  })

  process.on('uncaughtException', (error: Error) => {
    LoggerLocator.get().fatal(error, 'uncaughtException')
  })
}
