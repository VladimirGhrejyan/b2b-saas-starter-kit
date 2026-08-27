/**
 * DevPrincipal trusts request headers. That stub must not boot in production.
 */
export function assertDevPrincipalAllowed(nodeEnv: string): void {
  if (nodeEnv === 'production') {
    throw new Error('DevPrincipal header-trust must not run in production')
  }
}
