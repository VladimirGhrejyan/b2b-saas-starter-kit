import type {ArgumentMetadata, PipeTransform} from '@nestjs/common'
import {Injectable, Optional} from '@nestjs/common'
import {ZodValidationPipe} from 'nestjs-zod'

/**
 * Delegates to nestjs-zod instead of extending it so webpack-served apps can
 * construct the native ES class with `new`.
 */
@Injectable()
export class ApiValidationPipe implements PipeTransform {
  readonly #delegate: InstanceType<typeof ZodValidationPipe>

  constructor(@Optional() schemaOrDto?: ConstructorParameters<typeof ZodValidationPipe>[0]) {
    this.#delegate = new ZodValidationPipe(schemaOrDto)
  }

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    return this.#delegate.transform(value, metadata)
  }
}
