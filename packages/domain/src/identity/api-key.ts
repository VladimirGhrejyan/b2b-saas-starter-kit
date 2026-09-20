import type {ApiKeyId, TenantId, UserId} from '@b2b-saas-starter-kit/shared-kernel-types'
import {Permission} from '@b2b-saas-starter-kit/shared-kernel-types'

import {AggregateRoot} from '../shared-kernel/aggregate-root'
import {Guard} from '../shared-kernel/guard'

import {ApiKeyAlreadyRevokedError} from './errors/api-key-already-revoked.error'
import {ApiKeyCannotManageKeysError} from './errors/api-key-cannot-manage-keys.error'
import {EmptyApiKeyPermissionsError} from './errors/empty-api-key-permissions.error'
import {InvalidApiKeyNameError} from './errors/invalid-api-key-name.error'
import type {IdentityDomainEvent} from './events/identity.events'
import type {ApiKeyReconstituteProps} from './api-key.types'

/**
 * Tenant-owned machine credential. The raw token is never stored.
 *
 * `createdByUserId` is a uuid reference, not a foreign key and not the
 * authorizing principal after minting.
 */
export class ApiKey extends AggregateRoot<ApiKeyId, IdentityDomainEvent> {
  readonly tenantId: TenantId

  readonly createdByUserId: UserId

  readonly prefix: string

  readonly secretHash: string

  readonly expiresAt: Date | undefined

  #name: string

  #permissions: readonly Permission[]

  #revokedAt: Date | undefined

  #lastUsedAt: Date | undefined

  private constructor(
    id: ApiKeyId,
    tenantId: TenantId,
    createdByUserId: UserId,
    name: string,
    prefix: string,
    secretHash: string,
    permissions: readonly Permission[],
    expiresAt: Date | undefined,
    revokedAt: Date | undefined,
    lastUsedAt: Date | undefined,
  ) {
    super(id)
    this.tenantId = tenantId
    this.createdByUserId = createdByUserId
    this.prefix = prefix
    this.secretHash = secretHash
    this.expiresAt = expiresAt
    this.#name = name
    this.#permissions = permissions
    this.#revokedAt = revokedAt
    this.#lastUsedAt = lastUsedAt
  }

  get name(): string {
    return this.#name
  }

  get permissions(): readonly Permission[] {
    return this.#permissions
  }

  get revokedAt(): Date | undefined {
    return this.#revokedAt
  }

  get lastUsedAt(): Date | undefined {
    return this.#lastUsedAt
  }

  /**
   * Creates an active API key. Permissions must be a non-empty catalog subset
   * and must not include `identity.api_keys.manage`.
   */
  static create(
    id: ApiKeyId,
    tenantId: TenantId,
    createdByUserId: UserId,
    name: string,
    prefix: string,
    secretHash: string,
    permissions: readonly Permission[],
    occurredAt: Date,
    expiresAt?: Date,
  ): ApiKey {
    const apiKey = new ApiKey(
      id,
      tenantId,
      createdByUserId,
      ApiKey.#normalizeName(name),
      prefix,
      secretHash,
      ApiKey.#normalizePermissions(permissions),
      expiresAt,
      undefined,
      undefined,
    )

    apiKey.record({
      type: 'ApiKeyCreated',
      occurredAt,
      apiKeyId: id,
      tenantId,
      createdByUserId,
      prefix,
    })

    return apiKey
  }

  /**
   * Rebuilds an API key from persistence without recording events.
   */
  static reconstitute(props: ApiKeyReconstituteProps): ApiKey {
    return new ApiKey(
      props.id,
      props.tenantId,
      props.createdByUserId,
      props.name,
      props.prefix,
      props.secretHash,
      [...props.permissions],
      props.expiresAt,
      props.revokedAt,
      props.lastUsedAt,
    )
  }

  rename(name: string): void {
    this.#assertActive()
    this.#name = ApiKey.#normalizeName(name)
  }

  replacePermissions(permissions: readonly Permission[], occurredAt: Date): void {
    this.#assertActive()
    this.#permissions = ApiKey.#normalizePermissions(permissions)

    this.record({
      type: 'ApiKeyPermissionsReplaced',
      occurredAt,
      apiKeyId: this.id,
      tenantId: this.tenantId,
    })
  }

  revoke(at: Date): void {
    this.#assertActive()
    this.#revokedAt = at

    this.record({
      type: 'ApiKeyRevoked',
      occurredAt: at,
      apiKeyId: this.id,
      tenantId: this.tenantId,
    })
  }

  recordLastUsed(at: Date): void {
    this.#lastUsedAt = at
  }

  isUsable(now: Date): boolean {
    if (this.#revokedAt !== undefined) {
      return false
    }

    return this.expiresAt === undefined || this.expiresAt.getTime() > now.getTime()
  }

  static readonly managePermission = Permission.parse('identity.api_keys.manage')

  static #normalizeName(name: string): string {
    Guard.againstEmpty(name, new InvalidApiKeyNameError())

    return name.trim()
  }

  static #normalizePermissions(permissions: readonly Permission[]): Permission[] {
    const unique = new Set(permissions)

    if (unique.size === 0) {
      throw new EmptyApiKeyPermissionsError()
    }

    for (const permission of unique) {
      if (permission === ApiKey.managePermission) {
        throw new ApiKeyCannotManageKeysError()
      }
    }

    return [...unique]
  }

  #assertActive(): void {
    if (this.#revokedAt !== undefined) {
      throw new ApiKeyAlreadyRevokedError()
    }
  }
}
