/**
 * Thrown by {@link FrontendCoreConfigLocator.get} when {@link FrontendCoreConfigLocator.configure} has not run.
 */
export class FrontendCoreNotConfiguredError extends Error {
  readonly code = 'FRONTEND_CORE_NOT_CONFIGURED'

  constructor() {
    super('Frontend core is not configured. Call configureFrontendCore first.')
    this.name = new.target.name
  }
}
