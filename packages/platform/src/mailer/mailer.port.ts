import type {MailMessage} from './mailer.types'

/**
 * Outbound email. Product SMTP is deferred; tests and local boot use stubs.
 */
export interface MailerPort {
  send(message: MailMessage): Promise<void>
}
