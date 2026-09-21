import type {CallHandler, ExecutionContext, NestInterceptor} from '@nestjs/common'
import {Inject, Injectable} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import {ZodSerializerInterceptor} from 'nestjs-zod'
import type {Observable} from 'rxjs'

/**
 * Delegates to nestjs-zod instead of extending it so webpack-served apps can
 * construct the native ES class with `new`.
 */
@Injectable()
export class ApiSerializerInterceptor implements NestInterceptor {
  readonly #delegate: InstanceType<typeof ZodSerializerInterceptor>

  constructor(@Inject(Reflector) reflector: Reflector) {
    this.#delegate = new ZodSerializerInterceptor(reflector)
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return this.#delegate.intercept(context, next)
  }
}
