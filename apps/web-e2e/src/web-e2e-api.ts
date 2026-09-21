import {randomUUID} from 'node:crypto'

import {HttpStatus, registerUserInputSchema} from '@b2b-saas-starter-kit/contracts'

export class WebE2eApi {
  static readonly origin = process.env.API_ORIGIN ?? 'http://localhost:3000/v1'

  static async registerOwner(): Promise<{email: string; password: string}> {
    const body = registerUserInputSchema.parse({
      email: `e2e-${randomUUID()}@example.com`,
      displayName: 'E2E Owner',
      password: 'secret-password',
    })

    const response = await fetch(`${WebE2eApi.origin}/auth/register`, {
      method: 'POST',
      headers: {'content-type': 'application/json'},
      body: JSON.stringify(body),
    })

    if (response.status !== HttpStatus.CREATED) {
      throw new Error(`register failed: ${response.status} ${await response.text()}`)
    }

    return {email: body.email, password: body.password}
  }
}
