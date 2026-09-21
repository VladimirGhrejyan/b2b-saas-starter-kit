import {describe, expect, it, vi} from 'vitest'

import {HttpMailer} from './http-mailer'

describe('HttpMailer', () => {
  it('POSTs the port message to the configured emailing service', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ok: true, status: 200, text: async () => ''})
    const mailer = new HttpMailer(
      {
        url: 'https://mail.example.com/send',
        from: 'noreply@example.com',
        apiKey: 'secret-key',
      },
      fetchImpl,
    )

    await mailer.send({to: 'ada@example.com', subject: 'Password reset', text: 'reset token: abc'})

    expect(fetchImpl).toHaveBeenCalledWith('https://mail.example.com/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer secret-key',
      },
      body: JSON.stringify({
        from: 'noreply@example.com',
        to: 'ada@example.com',
        subject: 'Password reset',
        text: 'reset token: abc',
      }),
    })
  })

  it('throws when the emailing service rejects the request', async () => {
    const mailer = new HttpMailer(
      {url: 'https://mail.example.com/send', from: 'noreply@example.com'},
      vi.fn().mockResolvedValue({ok: false, status: 502, text: async () => 'upstream down'}),
    )

    await expect(
      mailer.send({to: 'ada@example.com', subject: 'Invite', text: 'invitation token: xyz'}),
    ).rejects.toThrow('HTTP mailer failed with 502: upstream down')
  })
})
