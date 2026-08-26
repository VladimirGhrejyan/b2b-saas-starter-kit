import type {ArgumentsHost, ExceptionFilter} from '@nestjs/common'
import {Catch, HttpException} from '@nestjs/common'
import {ZodSerializationException, ZodValidationException} from 'nestjs-zod'

import {HttpStatus} from '@b2b-saas-starter-kit/contracts'

import {LoggerLocator} from '@b2b-saas-starter-kit/platform'

import type {HttpResponseWriter} from './http-response-writer.types'

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponseWriter>()

    if (exception instanceof ZodValidationException) {
      response.status(HttpStatus.BAD_REQUEST).json({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: this.#zodDetails(exception.getZodError()),
      })

      return
    }

    if (exception instanceof ZodSerializationException) {
      this.#logger().error(exception, 'Response serialization failed')
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      })

      return
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus()

      response.status(status).json({
        code: this.#httpExceptionCode(status),
        message: this.#httpExceptionMessage(exception),
      })

      return
    }

    if (this.#isCodedError(exception)) {
      const status = exception.code === 'INSUFFICIENT_PERMISSION' ? HttpStatus.FORBIDDEN : HttpStatus.CONFLICT

      response.status(status).json({
        code: exception.code,
        message: exception.message,
      })

      return
    }

    this.#logger().error(exception instanceof Error ? exception : {err: exception}, 'Unhandled exception')
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    })
  }

  #logger() {
    return LoggerLocator.get().context(ApiExceptionFilter.name)
  }

  #zodDetails(error: unknown): unknown {
    if (typeof error === 'object' && error !== null && 'issues' in error) {
      return error.issues
    }

    return error
  }

  #httpExceptionCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST: {
        return 'BAD_REQUEST'
      }

      case HttpStatus.UNAUTHORIZED: {
        return 'UNAUTHORIZED'
      }

      case HttpStatus.FORBIDDEN: {
        return 'FORBIDDEN'
      }

      case HttpStatus.NOT_FOUND: {
        return 'NOT_FOUND'
      }

      case HttpStatus.CONFLICT: {
        return 'CONFLICT'
      }

      case HttpStatus.INTERNAL_SERVER_ERROR: {
        return 'INTERNAL_ERROR'
      }

      default: {
        return 'HTTP_ERROR'
      }
    }
  }

  #httpExceptionMessage(exception: HttpException): string {
    const body: unknown = exception.getResponse()

    if (typeof body === 'string' && body.length > 0) {
      return body
    }

    if (typeof body !== 'object' || body === null || !('message' in body)) {
      return exception.message
    }

    const message: unknown = body.message

    if (typeof message === 'string' && message.length > 0) {
      return message
    }

    if (Array.isArray(message)) {
      const first: unknown = message[0]

      if (typeof first === 'string') {
        return first
      }
    }

    return exception.message
  }

  #isCodedError(exception: unknown): exception is {code: string; message: string} {
    if (typeof exception !== 'object' || exception === null) {
      return false
    }

    if (!('code' in exception) || !('message' in exception)) {
      return false
    }

    return typeof exception.code === 'string' && typeof exception.message === 'string'
  }
}
