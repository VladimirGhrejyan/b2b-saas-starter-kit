import type {DomainError} from './domain-error'
import {Guard} from './guard'

/**
 * Trims, lowercases, and validates a simple local@domain email.
 *
 * @param onInvalid - Factory for the context-specific domain error.
 */
export function normalizeEmail(email: string, onInvalid: () => DomainError): string {
  Guard.againstEmpty(email, onInvalid())

  const normalized = email.trim().toLowerCase()
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(normalized)) {
    throw onInvalid()
  }

  return normalized
}
