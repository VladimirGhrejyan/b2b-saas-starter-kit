import {Injectable} from '@nestjs/common'
import {ZodSerializerInterceptor} from 'nestjs-zod'

@Injectable()
export class ApiSerializerInterceptor extends ZodSerializerInterceptor {}
