import {Injectable} from '@nestjs/common'

import type {MailerPort, MailMessage} from '@b2b-saas-starter-kit/platform'
import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

/**
 * Stub mailer that logs the message (including reset tokens) instead of sending SMTP.
 */
@Injectable()
export class LoggingMailer implements MailerPort {
  readonly messages: MailMessage[] = []

  send(message: MailMessage): Promise<void> {
    this.messages.push(message)
    LoggerLocator.get()
      .context('mailer')
      .info({to: message.to, subject: message.subject, text: message.text}, 'outbound mail (stub)')

    return Promise.resolve()
  }
}
