import {describe, expect, it, vi} from 'vitest'

import {SmtpMailer} from './smtp-mailer'

describe('SmtpMailer', () => {
  it('sends the port message through the transporter', async () => {
    const sendMail = vi.fn().mockResolvedValue(undefined)
    const mailer = new SmtpMailer(
      {
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: 587,
        SMTP_FROM: 'noreply@example.com',
      },
      {sendMail} as never,
    )

    await mailer.send({to: 'ada@example.com', subject: 'Password reset', text: 'reset token: abc'})

    expect(sendMail).toHaveBeenCalledWith({
      from: 'noreply@example.com',
      to: 'ada@example.com',
      subject: 'Password reset',
      text: 'reset token: abc',
    })
  })
})
