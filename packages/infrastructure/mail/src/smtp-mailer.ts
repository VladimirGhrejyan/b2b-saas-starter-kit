import {Injectable} from '@nestjs/common'
import {createTransport, type Transporter} from 'nodemailer'

import {TypeScriptUtils} from '@b2b-saas-starter-kit/utils'

import type {MailerPort, MailMessage} from '@b2b-saas-starter-kit/platform'

import type {SmtpConfig} from './config/smtp-config'

/**
 * Nodemailer {@link MailerPort}. Sends the port's plain-text message as-is.
 */
@Injectable()
export class SmtpMailer implements MailerPort {
  private readonly transport: Transporter

  constructor(
    private readonly config: SmtpConfig,
    transport?: Transporter,
  ) {
    this.transport =
      transport ??
      createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE === 'true',
        auth:
          TypeScriptUtils.isNil(config.SMTP_USER) || TypeScriptUtils.isNil(config.SMTP_PASS)
            ? undefined
            : {user: config.SMTP_USER, pass: config.SMTP_PASS},
      })
  }

  async send(message: MailMessage): Promise<void> {
    await this.transport.sendMail({
      from: this.config.SMTP_FROM,
      to: message.to,
      subject: message.subject,
      text: message.text,
    })
  }
}
