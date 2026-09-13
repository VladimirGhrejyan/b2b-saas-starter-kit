import {tenantIdParamSchema} from '@b2b-saas-starter-kit/contracts'

import {createZodDto} from '@b2b-saas-starter-kit/nest-http'

export class TenantIdParamDto extends createZodDto(tenantIdParamSchema) {}
