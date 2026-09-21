import {Injectable} from '@nestjs/common'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import type {MailerPort, MailMessage} from '@b2b-saas-starter-kit/platform'

import type {HttpMailerConfig} from './config/http-mailer-config'

/**
 * HTTP {@link MailerPort}. POSTs `{ from, to, subject, text }` to a configured emailing service.
 */
@Injectable()
export class HttpMailer implements MailerPort {
  constructor(
    private readonly config: HttpMailerConfig,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(message: MailMessage): Promise<void> {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    }

    if (!TypeScriptUtils.isNil(this.config.apiKey)) {
      headers.authorization = `Bearer ${this.config.apiKey}`
    }

    const response = await this.fetchImpl(this.config.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: this.config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
      }),
    })

    if (response.ok) {
      return
    }

    const detail = await response.text()

    throw new Error(`HTTP mailer failed with ${String(response.status)}${detail.length > 0 ? `: ${detail}` : ''}`)
  }
}
