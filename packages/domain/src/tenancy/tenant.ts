import type {TenantId, TenantStatus} from '@b2b-saas-starter-kit/shared-kernel-types'
import {TenantStatus as TenantStatusEnum} from '@b2b-saas-starter-kit/shared-kernel-types'

import {AggregateRoot} from '../shared-kernel/aggregate-root'
import {Guard} from '../shared-kernel/guard'

import {InvalidTenantNameError} from './errors/invalid-tenant-name.error'
import {TenantAlreadyActiveError} from './errors/tenant-already-active.error'
import {TenantAlreadySuspendedError} from './errors/tenant-already-suspended.error'
import type {TenantReconstituteProps} from './tenant.types'

/**
 * Organization / workspace. Memberships are a separate aggregate.
 */
export class Tenant extends AggregateRoot<TenantId> {
  #name: string

  #status: TenantStatus

  private constructor(id: TenantId, name: string, status: TenantStatus) {
    super(id)
    this.#name = name
    this.#status = status
  }

  get name(): string {
    return this.#name
  }

  get status(): TenantStatus {
    return this.#status
  }

  /**
   * Creates an active tenant.
   */
  static create(id: TenantId, name: string, occurredAt: Date): Tenant {
    const tenant = new Tenant(id, Tenant.#normalizeName(name), TenantStatusEnum.parse('active'))

    tenant.record({
      type: 'TenantCreated',
      occurredAt,
      tenantId: id,
      name: tenant.name,
    })

    return tenant
  }

  /**
   * Rebuilds a tenant from persistence without recording events.
   */
  static reconstitute(props: TenantReconstituteProps): Tenant {
    return new Tenant(props.id, props.name, props.status)
  }

  /**
   * Changes the tenant name.
   */
  rename(name: string, occurredAt: Date): void {
    this.#name = Tenant.#normalizeName(name)

    this.record({
      type: 'TenantRenamed',
      occurredAt,
      tenantId: this.id,
      name: this.#name,
    })
  }

  /**
   * Transitions `active` → `suspended`.
   */
  suspend(occurredAt: Date): void {
    if (this.#status === 'suspended') {
      throw new TenantAlreadySuspendedError()
    }

    this.#status = TenantStatusEnum.parse('suspended')

    this.record({
      type: 'TenantSuspended',
      occurredAt,
      tenantId: this.id,
    })
  }

  /**
   * Transitions `suspended` → `active`.
   */
  activate(occurredAt: Date): void {
    if (this.#status === 'active') {
      throw new TenantAlreadyActiveError()
    }

    this.#status = TenantStatusEnum.parse('active')

    this.record({
      type: 'TenantActivated',
      occurredAt,
      tenantId: this.id,
    })
  }

  static #normalizeName(name: string): string {
    Guard.againstEmpty(name, new InvalidTenantNameError())

    return name.trim()
  }
}
