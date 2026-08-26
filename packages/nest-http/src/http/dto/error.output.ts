import {errorOutputSchema} from '@b2b-saas-starter-kit/contracts'

import {createZodDto} from '../zod/create-zod-dto'

export class ErrorOutputDto extends createZodDto(errorOutputSchema) {}
