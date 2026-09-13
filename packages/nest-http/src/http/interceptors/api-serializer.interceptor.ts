import {Inject, Injectable} from '@nestjs/common'
import {Reflector} from '@nestjs/core'
import {ZodSerializerInterceptor} from 'nestjs-zod'

@Injectable()
export class ApiSerializerInterceptor extends ZodSerializerInterceptor {
  constructor(@Inject(Reflector) reflector: Reflector) {
    super(reflector)
  }
}
