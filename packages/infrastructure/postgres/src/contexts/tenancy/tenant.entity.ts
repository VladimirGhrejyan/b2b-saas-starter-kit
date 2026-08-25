import {Column, Entity, Index, PrimaryColumn} from 'typeorm'

@Entity({name: 'tenants'})
export class TenantEntity {
  @PrimaryColumn({type: 'uuid'})
  id!: string

  @Index('idx_tenants_tenant_id')
  @Column({name: 'tenant_id', type: 'uuid'})
  tenantId!: string

  @Column({type: 'text'})
  name!: string

  @Column({type: 'text'})
  status!: string
}
