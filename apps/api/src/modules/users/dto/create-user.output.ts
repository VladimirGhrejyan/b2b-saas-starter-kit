import {createUserOutputSchema} from '@b2b-saas-starter-kit/contracts'

import {createZodDto} from '@b2b-saas-starter-kit/nest-http'

export class CreateUserOutputDto extends createZodDto(createUserOutputSchema) {}
