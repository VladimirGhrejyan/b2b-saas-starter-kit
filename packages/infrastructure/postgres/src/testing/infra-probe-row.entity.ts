import {Column, Entity, PrimaryColumn} from 'typeorm'

/** Throwaway entity for Phase 7 isolation tests. Not a production table. */
@Entity({name: 'infra_probe_rows'})
export class InfraProbeRowEntity {
  @PrimaryColumn({type: 'uuid'})
  id!: string

  @Column({name: 'tenant_id', type: 'uuid'})
  tenantId!: string

  @Column({type: 'text'})
  name!: string
}
