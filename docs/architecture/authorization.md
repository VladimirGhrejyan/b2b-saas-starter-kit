# Authorization

Generic, tenant-scoped authentication + authorization designed to be reused and extended by every product built on the kit.

Related: [`multi-tenancy.md`](./multi-tenancy.md), [`backend.md`](./backend.md), [`frontend.md`](./frontend.md).

## Authentication vs. authorization

- **Authentication** (who you are) is owned by the **identity** context: credentials, sessions, tokens, verification, password reset.
- **Authorization** (what you may do) is owned by the **authorization** context: roles, permissions, policies.
- **Tenancy** (which org, and your membership) sits between them — roles are assigned **per membership**, so authorization is always tenant-scoped.

## Authorization model — RBAC + resource policy seam

**Decision:** permission-based **RBAC** as the backbone, plus a **policy seam** for resource/attribute rules (ABAC-lite).

- **Permissions** are fine-grained, stable identifiers: `tenant.members.invite`, `authorization.roles.manage`, `audit.read`, … Checks are always against **permissions**, never role names.
- **Roles** are _bundles of permissions_ assigned per membership (e.g. `Owner`, `Admin`, `Member`, plus custom tenant-defined roles).
- **Policies** handle rules that pure RBAC cannot express — ownership and attribute checks like "may edit _this_ record" or "may act only within _this_ tenant". Policies are evaluated where the relevant data is loaded (application/domain).

```
user     → memberships → roles → permissions      (coarse: "can they invite members?")
api_key  → minted permission subset               (no membership)
                                     +
policy(resource, principal, context)                (fine: "can they edit THIS resource?")
```

A tenant request is a **`TenantActor`**: `{kind: TenantActorKind.user, id: UserId}` or `{kind: TenantActorKind.apiKey, id: ApiKeyId}`. Both ids are UUIDs at runtime, so **kind travels with the id**. API keys are tenant-owned credentials (ADR-037), not fake users. They authenticate with `Authorization: Bearer bsk_…` and never go through membership. User-only routes (`GET /me`, password, select-tenant) reject `kind === TenantActorKind.apiKey` (403).

## Where authorization logic belongs

| Concern                                        | Layer                | What it does                                                           |
| ---------------------------------------------- | -------------------- | ---------------------------------------------------------------------- |
| Coarse permission gate                         | **API** (`apps/api`) | `@RequirePermission('…')` guard rejects fast, self-documents endpoints |
| Fine-grained / resource / tenant-scoped checks | **application**      | Use case asks an `AuthorizationPort` / policy service before acting    |
| Business invariants                            | **domain**           | Aggregates enforce their own rules (not "permissions")                 |

**Decision:** enforce in **both** places (defense-in-depth):

- The **API guard** provides a fast, visible, coarse check (authenticated + has permission), and protects the HTTP surface.
- The **application** performs the authoritative fine-grained check. This matters because non-HTTP callers (workers, other use cases) bypass controllers — so the real decision must live where the work happens.
- The **domain** enforces invariants (e.g. "a tenant must always have at least one owner"), which is distinct from permission checks.

```typescript
// apps/api — coarse
@RequirePermission('tenant.members.invite')
@Post('/tenants/:tenantId/invitations')
invite(/* … */) { return this.inviteMember.execute(cmd) }

// application — authoritative, resource-aware
@Injectable()
export class InviteMemberUseCase {
  constructor(private readonly authz: AuthorizationPort /* … */) {}
  async execute(cmd: InviteMemberCommand) {
    await this.authz.require(cmd.actor, 'tenant.members.invite', { tenantId: cmd.tenantId })
    // + any resource policy checks
  }
}
```

The `AuthorizationPort` is defined so the application asks _questions_ ("does this actor have this permission in this tenant?") without depending on how roles/permissions are stored. `require` / `getPermissions` take `TenantActor`. The user path is unchanged (membership → roles → cache). The API-key path uses `ApiKeyPermissionsPort` (identity implements it; `AuthorizationService` does not inject `ApiKeyRepository`). Invalidate stays user/role-based; key permission edits delete a small key-scoped cache entry.

## How permissions are represented

- A permission is a namespaced string constant, grouped by context/resource/action. The canonical list is owned by the **authorization** context; cross-cutting permission _identifiers_ that the frontend also needs are surfaced through `contracts` (as enums/types), so backend and frontend agree on the vocabulary without the frontend importing backend internals.
- **Effective permissions** for a **user** in a tenant = union of permissions across their roles in that membership. Resolution loads those roles in one `RoleRepository.findByIds` and is cached (tenant-prefixed Redis key, 60s TTL). `AuthorizationPort.invalidate` deletes the user+tenant key. `invalidateHoldersOf` loads only memberships that hold that role (`MembershipRepository.findByTenantAndRole`) and deletes their keys.
- **API-key permissions** are a minted catalog subset stored on the key. They cannot include `identity.api_keys.manage` (a leaked key cannot mint more keys). The creator must hold `identity.api_keys.manage` **and** every requested permission. Owner gets the permission via `PermissionCatalog.all`; Admin is backfilled explicitly (same class of ops as `tenancy.members.manage`). Member: no.

## Tenant-scoped authorization

Every authorization question includes the tenant: a user who is `Admin` in Tenant A has no elevated rights in Tenant B. The `AuthorizationPort` always resolves permissions for the **(actor, active tenant)** pair, and the ambient `TenantContext` (`{tenantId, actor}`) guarantees the scope. See [`multi-tenancy.md`](./multi-tenancy.md).

## Frontend representation — effective permissions + `can()`

**Decision:** the backend returns the principal's **effective permission set** for the active tenant (on login and `/me`, and on tenant switch); the frontend gates UI with a `can()` helper.

- The frontend **never re-derives** permissions from roles (no drift).
- `useCan('tenant.members.invite')` / `<Can permission="…">` control rendering and enabled/disabled states.
- Frontend checks are **UX only** — the backend remains the sole authority. A hidden button is not a security control; the application-layer check is.

See [`frontend.md`](./frontend.md) for how permission state is stored (RTK Query cache of `/me`) and refreshed on tenant switch.

## Extensibility

- New permissions are added by their owning context and exposed via `contracts`.
- Custom roles are tenant-defined data (role → permission bundles). System roles cannot be renamed, re-permissioned, or deleted. The Owner system role is assigned only at tenant creation.
- Email invitations store a token hash; accept creates an active membership (and a user + local password when the email is new). Attach-existing adds an active membership immediately. Both refuse the Owner role id.
- Products needing richer rules extend the **policy seam** (e.g. a CASL adapter behind `AuthorizationPort`) without changing controllers or use cases.
