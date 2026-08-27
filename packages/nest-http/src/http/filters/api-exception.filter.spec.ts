import type {ArgumentsHost} from '@nestjs/common'
import {HttpException, UnauthorizedException} from '@nestjs/common'
import {ZodValidationException} from 'nestjs-zod'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {z} from 'zod'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import {FakeLogger} from '../../testing/fake-logger'

import {ApiExceptionFilter} from './api-exception.filter'

function createHost() {
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({json})

  return {
    host: {
      switchToHttp: () => ({
        getResponse: () => ({status, json}),
      }),
    } as ArgumentsHost,
    status,
    json,
  }
}

describe('ApiExceptionFilter', () => {
  afterEach(() => {
    LoggerLocator.reset()
  })

  it('maps Zod validation to a 400 envelope', () => {
    const filter = new ApiExceptionFilter()
    const {host, status, json} = createHost()
    const parsed = z.object({email: z.email()}).safeParse({email: 'not-an-email'})

    expect(parsed.success).toBe(false)

    if (parsed.success) {
      return
    }

    filter.catch(new ZodValidationException(parsed.error), host)

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      }),
    )
  })

  it('maps INSUFFICIENT_PERMISSION to a 403 envelope when the code is in the map', () => {
    const filter = new ApiExceptionFilter({INSUFFICIENT_PERMISSION: HttpStatus.FORBIDDEN})
    const {host, status, json} = createHost()

    filter.catch({code: 'INSUFFICIENT_PERMISSION', message: "missing permission 'tenancy.members.read'"}, host)

    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
    expect(json).toHaveBeenCalledWith({
      code: 'INSUFFICIENT_PERMISSION',
      message: "missing permission 'tenancy.members.read'",
    })
  })

  it('maps USER_NOT_FOUND to a 404 envelope when the code is in the map', () => {
    const filter = new ApiExceptionFilter({USER_NOT_FOUND: HttpStatus.NOT_FOUND})
    const {host, status, json} = createHost()

    filter.catch({code: 'USER_NOT_FOUND', message: 'user was not found'}, host)

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
    expect(json).toHaveBeenCalledWith({
      code: 'USER_NOT_FOUND',
      message: 'user was not found',
    })
  })

  it('maps unmapped duck-typed code/message to a 409 envelope and warns', () => {
    const logger = new FakeLogger()

    LoggerLocator.init(logger)

    const filter = new ApiExceptionFilter()
    const {host, status, json} = createHost()

    filter.catch({code: 'TENANT_NAME_TAKEN', message: 'Name already taken'}, host)

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT)
    expect(json).toHaveBeenCalledWith({
      code: 'TENANT_NAME_TAKEN',
      message: 'Name already taken',
    })
    expect(logger.records.some((record) => record.level === 'warn')).toBe(true)
  })

  it('logs 5xx HttpExceptions and hides internals', () => {
    const logger = new FakeLogger()

    LoggerLocator.init(logger)

    const filter = new ApiExceptionFilter()
    const {host, status, json} = createHost()

    filter.catch(new HttpException('secret internals', HttpStatus.INTERNAL_SERVER_ERROR), host)

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(json).toHaveBeenCalledWith({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    })
    expect(JSON.stringify(json.mock.calls)).not.toContain('secret internals')
    expect(logger.records.some((record) => record.level === 'error')).toBe(true)
  })

  it('does not log 4xx HttpExceptions', () => {
    const logger = new FakeLogger()

    LoggerLocator.init(logger)

    const filter = new ApiExceptionFilter()
    const {host, status, json} = createHost()

    filter.catch(new UnauthorizedException('x-user-id is required'), host)

    expect(status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'UNAUTHORIZED',
      }),
    )
    expect(logger.records).toEqual([])
  })

  it('maps unknown errors to a 500 envelope without leaking the message', () => {
    const logger = new FakeLogger()

    LoggerLocator.init(logger)

    const filter = new ApiExceptionFilter()
    const {host, status, json} = createHost()

    filter.catch(new Error('secret internals'), host)

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(json).toHaveBeenCalledWith({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    })
    expect(JSON.stringify(json.mock.calls)).not.toContain('secret internals')
    expect(logger.records.some((record) => record.level === 'error')).toBe(true)
  })
})
