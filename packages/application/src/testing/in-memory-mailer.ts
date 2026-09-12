import type {MailerPort, MailMessage} from '@b2b-saas-starter-kit/platform'

/**
 * Records outbound mail for tests. The reset token is in {@link MailMessage.text}.
 */
export class InMemoryMailer implements MailerPort {
  readonly messages: MailMessage[] = []

  send(message: MailMessage): Promise<void> {
    this.messages.push(message)

    return Promise.resolve()
  }
}
