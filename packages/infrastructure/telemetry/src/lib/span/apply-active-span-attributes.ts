import {trace} from '@opentelemetry/api'

import type {ActiveSpanAttributes} from './active-span-attributes.types'

/**
 * Sets correlation attributes on the current span. No-op when the SDK is not started.
 */
export function applyActiveSpanAttributes(attributes: ActiveSpanAttributes): void {
  const span = trace.getActiveSpan()

  if (span === undefined) {
    return
  }

  if (attributes.requestId !== undefined) {
    span.setAttribute('request.id', attributes.requestId)
  }

  if (attributes.tenantId !== undefined) {
    span.setAttribute('tenant.id', attributes.tenantId)
  }

  if (attributes.actorId !== undefined) {
    span.setAttribute('enduser.id', attributes.actorId)
  }
}
