import {tenantMembersOutputSchema} from '@b2b-saas-starter-kit/contracts'

import {createZodDto} from '@b2b-saas-starter-kit/nest-http'

export class TenantMembersOutputDto extends createZodDto(tenantMembersOutputSchema) {}
