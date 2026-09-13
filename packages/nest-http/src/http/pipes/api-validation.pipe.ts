import {Injectable, Optional} from '@nestjs/common'
import {ZodValidationPipe} from 'nestjs-zod'

@Injectable()
export class ApiValidationPipe extends ZodValidationPipe {
  constructor(@Optional() schemaOrDto?: ConstructorParameters<typeof ZodValidationPipe>[0]) {
    super(schemaOrDto)
  }
}
