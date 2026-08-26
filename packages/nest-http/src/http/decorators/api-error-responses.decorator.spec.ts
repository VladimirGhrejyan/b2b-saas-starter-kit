import {describe, expect, it} from 'vitest'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {ApiErrorResponses} from './api-error-responses.decorator'

const swaggerApiResponseKey = 'swagger/apiResponse'

describe('ApiErrorResponses', () => {
  it('registers OpenAPI error responses on the handler', () => {
    class Probe {
      @ApiErrorResponses([
        {status: HttpStatus.BAD_REQUEST, description: 'Request body failed validation'},
        {status: HttpStatus.CONFLICT, description: 'Email is already taken'},
      ])
      create() {
        return {id: '1'}
      }
    }

    const metadata = Reflect.getMetadata(swaggerApiResponseKey, Probe.prototype.create) as Record<
      string,
      {description: string}
    >

    expect(metadata[String(HttpStatus.BAD_REQUEST)]?.description).toBe('Request body failed validation')
    expect(metadata[String(HttpStatus.CONFLICT)]?.description).toBe('Email is already taken')
  })
})
