# Authentication, authorization, and related security

An educational guide. Kit decisions that are **normative** live in [`architecture/authorization.md`](../architecture/authorization.md), [`architecture/multi-tenancy.md`](../architecture/multi-tenancy.md), [`architecture/frontend.md`](../architecture/frontend.md), and [ADR-032](../architecture/decisions.md). This document explains the concepts, the common industry approaches, and how they map onto this repository **today** (Phase 20 auth, including the web login slice).

---

## 1. Three questions every request must answer

| Question                               | Name                       | Typical owner in this kit                     |
| -------------------------------------- | -------------------------- | --------------------------------------------- |
| Who is making this request?            | **Authentication** (authn) | `identity` context + API edge                 |
| Which organization are they acting in? | **Tenancy**                | `tenancy` context + `TenantContext`           |
| What are they allowed to do _there_?   | **Authorization** (authz)  | `authorization` context + `AuthorizationPort` |

People collapse these into “auth.” That causes bugs. A valid login is not a permission. A role in Tenant A is not a role in Tenant B. A hidden “Invite” button is not a security control.

```
                    ┌─────────────┐
                    │  User       │  global identity (one person)
                    └──────┬──────┘
                           │ memberships
                    ┌──────▼──────┐
                    │  Tenant     │  organization / workspace
                    └──────┬──────┘
                           │ roles on that membership
                    ┌──────▼──────┐
                    │  Permissions│  what they may do *in that tenant*
                    └─────────────┘
```

This kit models that as **User → Membership → Role(s) → Permission(s)**. The user is global. Roles are **tenant-scoped**. Authorization questions always include the tenant.

---

## 2. Vocabulary

| Term                            | Meaning                                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Identity**                    | The durable record of a person or service (`User`, service account). Not a session.                                                      |
| **Principal / subject / actor** | The identity _as attached to this request_. After authn succeeds you have a principal.                                                   |
| **Credential**                  | Proof of identity: password, passkey, OTP, client certificate, API key.                                                                  |
| **Session**                     | Server-side (or logically server-controlled) record that the principal is currently signed in.                                           |
| **Token**                       | A string the client presents on later requests. May be opaque (lookup) or self-describing (JWT).                                         |
| **Claim**                       | A field inside a token or session: `sub`, `tenantId`, `exp`, scopes.                                                                     |
| **Access token**                | Short-lived credential for _calling APIs_.                                                                                               |
| **Refresh token**               | Longer-lived credential used only to mint new access tokens.                                                                             |
| **Audience (`aud`)**            | Who the token is _for_ (this API, not some other service).                                                                               |
| **Issuer (`iss`)**              | Who minted the token. Verify both.                                                                                                       |
| **Scope**                       | OAuth string about _what the token may do_ (often coarse). Not a substitute for product RBAC.                                            |
| **Permission**                  | Fine-grained product capability, e.g. `tenancy.members.read`. This kit checks **permissions**, never role names.                         |
| **Role**                        | Named bundle of permissions (`Owner`, `Admin`, `Member`, later custom).                                                                  |
| **Policy**                      | Extra rule RBAC cannot express: “may edit _this_ invoice,” “only if owner.”                                                              |
| **Effective permissions**       | Union of permissions from all roles on the membership in the **active** tenant.                                                          |
| **IAM**                         | Identity and access management: the whole system (people, creds, roles, audit).                                                          |
| **IdP**                         | Identity provider (Auth0, Okta, Keycloak, Entra ID, your own `/login`).                                                                  |
| **RP / client**                 | Relying party — your app that trusts the IdP.                                                                                            |
| **Authorization server (AS)**   | Issues tokens (Okta, Auth0, or _you_ after local login).                                                                                 |
| **Resource server (RS)**        | The API that accepts an access token (this kit’s `apps/api`).                                                                            |
| **ID token**                    | OIDC JWT that tells the _client_ who logged in. Not a substitute for your API session.                                                   |
| **PKCE**                        | Proof Key for Code Exchange — stops an attacker who steals the auth code from exchanging it. Required for public clients (SPAs, mobile). |
| **JWKS**                        | JSON Web Key Set — public keys the AS publishes so you can verify JWT signatures.                                                        |
| **Authn strategy**              | _How_ a request proves identity (password, OIDC code, API key, passkey, today’s `x-user-id`).                                            |
| **Authn provider / connection** | _Who_ asserted that identity (local `identity`, Google, “Acme’s Okta”).                                                                  |
| **BFF**                         | Backend-for-frontend: a server that holds tokens so the browser never sees them.                                                         |

HTTP status convention (this kit follows it):

- **401 Unauthorized** — we do not know who you are (missing/invalid/expired credential). The name is historical; it means _unauthenticated_.
- **403 Forbidden** — we know who you are; you may not do this (no membership, missing permission).

---

## 3. Authentication — proving who you are

Authentication is a **protocol + storage + edge check**. The rest of the app should only see a principal (`userId`, later `tenantId` claim).

### 3.1 What this kit does today (Phase 20 backend)

**Shipped on `apps/api`:**

- Email + password (`POST /v1/auth/register`, `/v1/auth/login`, `/v1/auth/web/login`) with Argon2id hashes on a separate local-password record (`User` stays credential-free).
- Short HS256 access JWT in the JSON body (`sub`, optional `tid`, `exp`, `jti`). Sign/verify stays in `apps/api`.
- Two refresh transports, same use cases: cookie-only on `POST /v1/auth/web/{login,refresh,logout}` (`refresh_token`, `Path=/v1/auth`, no JSON `refreshToken`); JSON `{ refreshToken }` on `POST /v1/auth/{login,refresh,logout}` (no cookie read/write). Reuse of a rotated token revokes the family.
- Authenticated `POST /v1/auth/password` sets a first local password or changes an existing one (`currentPassword` required when a hash already exists).
- Tenant claim omitted at login unless the user has exactly one active membership. `POST /v1/auth/select-tenant` re-issues the access JWT.
- Password reset and invitations send through `MailerPort`. Composition binds `SmtpMailer` when `SMTP_HOST` is set; otherwise `LoggingMailer` / `InMemoryMailer` so tests can read tokens. Outbox and HTML templates stay deferred.

**Edge:** `AuthPrincipalInterceptor` prefers `Authorization: Bearer`. In `development`/`test` only, it still accepts `x-user-id` / `x-tenant-id` so existing header e2e keep working. Production is JWT-only and refuses the development `JWT_ACCESS_SECRET`.

**Shipped on `apps/web`:** `/login` against `POST /v1/auth/web/login`, in-memory `accessToken`, `prepareHeaders` `Authorization: Bearer`, `credentials: 'include'`, 401 → `POST /v1/auth/web/refresh` → retry or `clearSession`. The dev principal picker is removed. Logout UI, select-tenant UI, and register/forgot/reset pages are still deferred. Controllers, `AuthorizationPort.require`, and `/me` did not change.

### 3.2 Classic approaches (backend)

#### Password + server session

1. Client `POST /login` with email/password.
2. Server verifies a **slow hash** (Argon2id preferred; bcrypt acceptable). Never store plaintext or reversible encryption of passwords.
3. Server creates a session row (`sessionId`, `userId`, `expiresAt`, `ip`/`ua` optional) in Redis or Postgres.
4. Server sets an **`HttpOnly` + `Secure` + `SameSite` cookie** with the session id (opaque).
5. Every request: cookie → lookup session → principal.

**Pros:** revocable instantly (delete row); small cookie; no JWT pitfalls.  
**Cons:** sticky affinity or shared session store; CSRF if cookie is sent cross-site; harder for mobile/SPA that cannot use first-party cookies easily (usually they can with a same-site API or BFF).

#### Opaque access token (not JWT)

Same as a session id, but sent as `Authorization: Bearer <opaque>` instead of a cookie. Server looks it up. Good for SPAs that cannot use cookies, or for mobile. Still **revocable**. XSS that steals the token is still fatal — treat storage like a password.

#### JWT access token (self-contained)

A JWT is three Base64url parts: `header.payload.signature`.

Typical access claims:

- `sub` — user id
- `tid` / `tenant_id` — **active tenant** (this kit’s planned source of truth)
- `iss`, `aud`, `exp`, `iat`, `nbf`
- sometimes a `jti` (id) for denylist

The API **verifies signature + exp + aud + iss**. It does **not** hit the DB to know who you are — that is the point and the danger.

**Pros:** stateless scale; easy service-to-service; works with OIDC.  
**Cons:** cannot revoke until `exp` unless you add a denylist or short TTL + refresh; people stuff permissions into the JWT and they go stale; `alg: none` / wrong key / accepting any issuer are classic bugs.

**Rules of thumb if you use JWT:**

- Access TTL measured in **minutes** (5–15), not days.
- Do **not** put effective permission lists in the access token as the only source of truth (they drift). This kit returns permissions from `/me` and Redis cache-aside instead.
- Put **tenant** in the token after the user _selects_ a tenant, then re-issue on switch.
- Verify `aud` so a token minted for `admin` cannot call `api`.
- Prefer asymmetric keys (RS256/ES256) if more than one service verifies; rotate via JWKS.

#### Refresh tokens

Access tokens expire quickly. The client uses a **refresh token** (rotation recommended):

1. Refresh token is one-time: each use returns a new pair; old refresh is invalidated.
2. Reuse of an already-rotated refresh ⇒ **theft**: revoke the whole family.
3. Store refresh in an **`HttpOnly` cookie** (web) or OS secure storage (native). Never `localStorage` if you can avoid it.

This kit’s planned story: **in-memory access token + refresh cookie**, with `401` in the RTK base query triggering refresh or “sign in again.”

#### API keys

Long-lived secrets for _machines_ (CI, incoming webhooks you send outbound to, partner integrations). Prefix + hash at rest, show the secret once, scope narrowly, rotate. Not a replacement for user login. Rate-limit and audit them.

#### Mutual TLS (mTLS)

Both sides present certificates. Common for service mesh and high-assurance B2B. Complements (does not replace) application RBAC.

### 3.3 Delegated login: OAuth 2.0, OIDC, SAML

These solve “I don’t want to store your Google/Okta password.”

| Protocol                  | Typical use                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **OAuth 2.0**             | Authorization _to call another API_ (“post to my calendar”). Tokens, grants, scopes.                                    |
| **OpenID Connect (OIDC)** | Identity layer on OAuth. Adds `id_token` (who logged in) and UserInfo. **This is what you want for “Login with Okta.”** |
| **SAML 2.0**              | XML, enterprise SSO, older IdPs. Still required by many B2B buyers.                                                     |

**OAuth grants you will actually meet:**

- **Authorization code + PKCE** — the default for SPAs and native apps. Browser never sees a client secret.
- **Client credentials** — service-to-service, no user.
- **Refresh token** — silent renew.
- **Device code** — CLI / TV.
- **Resource owner password** — deprecated; do not use for new work.
- **Implicit** — deprecated for SPAs.

**B2B SaaS patterns:**

1. **You are the IdP** — email/password or passkeys in `identity`. Full control, more work (reset, MFA, breach).
2. **You broker enterprise SSO** — per-tenant SAML/OIDC connection (Okta, Entra). Membership still lives in _your_ tenancy tables; the IdP only asserts email/`sub`.
3. **Social login** — Google/Microsoft for founder-led products; still map to `User` + memberships.

OIDC does **not** replace product RBAC. The IdP may send groups; you still map those to **your** roles/permissions (or ignore groups and assign roles in-app).

Deep dive: [§13 OAuth, OAuth 2.0, and OpenID Connect](#13-oauth-oauth-20-and-openid-connect) and [§14 Multiple authentication strategies and providers](#14-multiple-authentication-strategies-and-providers).

### 3.4 Passwordless and stronger factors

| Method                     | Notes                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| **Magic link / email OTP** | Phishing-resistant-ish if links are one-time and short-lived; email account takeover is the risk. |
| **TOTP / SMS OTP**         | Second factor. SMS is weaker (SIM swap). TOTP is fine as MFA.                                     |
| **WebAuthn / passkeys**    | Phishing-resistant. Best modern default alongside or instead of passwords.                        |
| **Recovery codes**         | One-time, hashed, shown once.                                                                     |

MFA should apply at **authentication** time (and step-up for dangerous actions). It is not an authorization model.

### 3.5 Service-to-service and workers

- **Inbound HTTP to `apps/api`:** user principal (future JWT) or machine client-credentials / mTLS.
- **`apps/worker`:** no cookie. Job payload must carry `tenantId` + `actorId` (or a system actor). Re-run `TenantContext` before the use case. The outbox (deferred) preserves tenant on the message.
- **Outbound HTTP (`HttpClientPort`):** you are the _client_. Attach `Authorization` to Stripe/OIDC JWKS/etc. Redact those headers in logs. Do not confuse outbound tokens with inbound user sessions.

---

## 4. Client-side authentication

The browser or native host must (1) obtain a credential, (2) send it on every API call, (3) survive refresh/401, (4) not leak it.

### 4.1 What this kit does today

`FrontendApi.prepareHeaders` sets `Authorization: Bearer` from the in-memory session `accessToken`. `/me` is server-authoritative for profile + **effective permissions**. A product-route `401` triggers a single-flight cookie refresh; failure clears the session and the app shows `/login`. Session is in-memory (no `redux-persist` by default). Desktop/mobile hosts load the same web bundle; they must not invent a second auth stack.

### 4.2 Where to put tokens (web)

| Storage                                           | XSS can steal?      | Sent automatically?   | CSRF risk                     | Typical use                                    |
| ------------------------------------------------- | ------------------- | --------------------- | ----------------------------- | ---------------------------------------------- |
| `localStorage` / `sessionStorage`                 | Yes                 | No (you attach in JS) | Low                           | Convenient, **discouraged** for refresh tokens |
| In-memory JS variable                             | Only while XSS runs | No                    | Low                           | Access token (this kit’s planned approach)     |
| `HttpOnly` cookie                                 | No                  | Yes, to cookie domain | Yes if `SameSite=None` sloppy | Refresh or full session                        |
| Electron `safeStorage` / Capacitor secure storage | Harder              | No                    | N/A                           | Native refresh / secrets (deferred adapters)   |

**XSS vs CSRF (the trade-off everyone repeats):**

- Token in JS (`localStorage` / memory + `Authorization` header): CSRF is hard (attacker site cannot set your header). XSS **can** read the token.
- Cookie `HttpOnly` session: XSS cannot read the cookie, but the browser **will send it** on requests the attacker triggers unless `SameSite` + CSRF token + custom header.

Practical SPA recommendation used by many B2B products:

- **Access token:** memory only, `Authorization: Bearer`.
- **Refresh token:** `HttpOnly`, `Secure`, `SameSite=Lax` or `Strict`, path-scoped to `/v1/auth/refresh`, rotatable.
- **BFF variant:** cookies only; browser never sees a Bearer token. Your BFF talks to the API with the session.

### 4.3 `prepareHeaders` vs cookies

```
Today
  accessToken (memory) → Authorization: Bearer
  active tenant        → token claim (authoritative)
  401                  → refresh cookie → new access → retry
                       → or clear session and show login
```

Do not send a spoofable `x-user-id` with a JWT. The **token** is the identity. API `development`/`test` may still accept header-trust for e2e.

### 4.4 CORS, cookies, and first-party

If `apps/web` is `https://app.example.com` and API is `https://api.example.com`:

- CORS must allow the web origin, `credentials: true` if cookies are used, and a tight allowed-header list.
- Cookies need `Domain=.example.com` (careful) or a BFF on the same site (`app.example.com/api` proxied).
- This kit’s API CORS is fail-closed; do not open `*` with credentials.

### 4.5 Frontend authorization is UX only

`useCan('tenancy.members.read')` and `<Can>` hide or disable UI from the **effective permission list** returned by `/me`.

- Same permission **strings** as the backend (`contracts` / `PermissionName`).
- Frontend **must not** recompute permissions from role names (drift).
- A determined client skips the UI and calls the API. **Backend remains the only authority.**

On **tenant switch**: change active tenant → re-fetch `/me` → replace permission set → invalidate tenant-scoped RTK Query tags. Otherwise User A’s Admin permissions leak into the Tenant B UI.

### 4.6 Native hosts

Electron and Capacitor should keep using the same `frontend/core` session + `prepareHeaders`. Persistence goes through a **storage port**, not `localStorage` copied into each host. Deep links and cookie jars are host-specific; product auth logic is not.

---

## 5. Authorization — deciding what they may do

### 5.1 Models (choose explicitly)

#### ACL (access-control list)

Each object stores “who can do what.” Simple for small systems; explodes at SaaS scale (every invoice row lists users).

#### RBAC (role-based)

Users get roles; roles get permissions; checks are `can(user, permission)` in a tenant.

This kit: **permission-based RBAC**. UI and API name permissions (`tenancy.members.read`), not `if (role === 'Admin')`. Roles become data (seeded Owner/Admin/Member; later custom tenant roles).

#### ABAC (attribute-based)

Rules over attributes: `resource.ownerId == actor.id`, `resource.region in actor.regions`, time of day. Powerful, harder to explain to customers, harder to cache.

This kit leaves an **ABAC-lite policy seam**: RBAC answers “may they invite members at all?”; a policy (later CASL or hand-rolled) answers “may they edit _this_ record?”

#### ReBAC (relationship-based, Zanzibar-style)

“User U is viewer of Doc D because U is member of Group G that owns Folder F that contains D.” Google Zanzibar, SpiceDB, OpenFGA. Excellent for sharing graphs; overkill until you have nested resources and sharing.

#### Capabilities / ACLs on tokens

A token that _is_ the permission (like a signed “can upload to this path”). Rare in product CRUD; common in object storage.

**What to use for this product:** RBAC for the catalog + policy for ownership. Do not start with Zanzibar.

### 5.2 Permission design

Good permission ids are **stable, namespaced, and checkable**:

```
<context>.<resource>.<action>
tenancy.members.read
tenancy.members.invite
authorization.roles.manage
audit.read
```

Owned by the **authorization** domain catalog; mirrored in `contracts` so web and API never drift.

Anti-patterns:

- Checking role names in controllers (`if admin`).
- One mega-permission `do_everything`.
- Encoding tenant in the permission string (`tenant_abc.members.read`) — tenant is **scope**, not the permission id.

**Effective permissions** = union across roles on the membership. Cached in Redis with a **tenant-prefixed** key and TTL (60s today). Role/membership **writes must `del` that key** (not implemented yet — stale allow/deny until TTL).

### 5.3 Where this kit enforces (defense in depth)

```
HTTP request
  → DevPrincipal / future JWT     authn + membership
  → TenantContext ALS             isolation guardrail
  → @RequirePermission            coarse, documents the route
  → use case AuthorizationPort    authoritative (also workers)
  → domain invariants             e.g. last Owner cannot leave
  → TenantAwareRepository         WHERE tenant_id = ctx
  → (optional later) Postgres RLS
```

| Layer                                       | What                      | Why both API and application?                 |
| ------------------------------------------- | ------------------------- | --------------------------------------------- |
| `@RequirePermission` in `apps/api`          | Fast 403, Swagger-visible | Protects HTTP; not used by workers            |
| `AuthorizationPort.require` in the use case | Real decision             | Workers and nested use cases skip controllers |
| Domain                                      | Business invariants       | Not the same as IAM                           |
| Persistence                                 | Tenant filter             | Stops forgotten `WHERE`                       |

`ListTenantMembers` already calls `authz.require(..., tenancy.members.read, {tenantId})`. The members controller also has `@RequirePermission`. That duplication is **intentional**.

`AuthorizationService` does **not** SQL-join memberships to roles across contexts. It asks `MembershipRolesPort` (tenancy) for role ids, then `RoleRepository` (authorization) for permission sets. That keeps bounded contexts isolated and cache-friendly.

### 5.4 Other backend styles you will see

- **Nest guards** (`CanActivate`) vs interceptors — same idea; this kit uses interceptors + Reflector metadata.
- **CASL / cerbos / OPA** — externalize policy as data. Fits behind `AuthorizationPort` without rewriting controllers.
- **Row-level security** — DB enforces `tenant_id`. Defense in depth, not a replacement for `require()`.
- **API gateway auth** — JWT validation at the edge. Still do application checks; the gateway does not know “this invoice.”

---

## 6. Tenancy is not authorization (but they couple)

Isolation models:

| Model               | Isolation           | Ops cost | This kit                    |
| ------------------- | ------------------- | -------- | --------------------------- |
| **Pool**            | `tenant_id` on rows | Lowest   | **Shipped**                 |
| Schema-per-tenant   | Postgres schema     | Medium   | Possible later behind repos |
| Database-per-tenant | Separate DB         | Highest  | Enterprise outliers         |

Active tenant sources (pluggable; **token claim is planned as authoritative**):

- JWT / session claim (after tenant picker)
- Header (`x-tenant-id` — stub today)
- Subdomain (`acme.app.com`)
- Path (`/t/acme/...`)

Always **validate membership** before establishing context. “User exists” + “header says tenant X” is not enough — that is IDOR waiting to happen. The stub already calls `AssertActiveMembership`.

Hybrid propagation in this kit:

1. **Explicit** `tenantId` + `actorId` on every command/query (testable, no hidden ALS in unit tests).
2. **Ambient** `TenantContext` so repositories cannot forget the filter; infra asserts command tenant matches ALS.

Admin/support impersonation (deferred) is a _new principal or a privileged escape hatch_, not “set `x-user-id` in prod.”

---

## 7. End-to-end request (today vs target)

**Today**

```
Login → identity verifies credential
  → access JWT (sub + tenant when the user has one membership) + refresh cookie
  → prepareHeaders: Bearer
  → GET /v1/tenants/:id/members
  → AuthPrincipalInterceptor (Bearer, or headers in development/test e2e)
  → TenantContext.run
  → RequirePermissionInterceptor (tenancy.members.read)
  → ListTenantMembersQuery.authz.require (same permission)
  → TenantAwareRepository
  → JSON members
  → useCan hides the page if /me lacked the permission
```

Select-tenant UI (multi-membership) and logout UI are still deferred.

---

## 8. Related controls people mix up with “auth”

| Topic                 | Relation                                                                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CORS**              | Browser rule for _which frontend_ may call you. Not authentication.                                                                                                             |
| **CSRF**              | Forged cookie-authenticated request. Relevant when you use cookies.                                                                                                             |
| **XSS**               | Script in your origin steals tokens or acts as the user. CSP, sanitization.                                                                                                     |
| **IDOR**              | Authn succeeded; you loaded Tenant B’s row because you trusted a path id. Tenant filter + `require` + never trust client ids blindly.                                           |
| **Rate limiting**     | Authn endpoints are brute-force targets. Public `/v1/auth/*` is limited via Redis `RateLimiterPort` (IP + route bucket). Invite limits and global API throttling stay deferred. |
| **Lockout / backoff** | After N failed logins. Careful: user enumeration vs account lock DoS. Still deferred.                                                                                           |
| **Audit log**         | Who did what, when, in which tenant. Deferred `audit` context; do not log passwords or tokens.                                                                                  |
| **PII in JWT**        | Prefer `sub` only; load profile from `/me`.                                                                                                                                     |
| **Secrets**           | Signing keys, OAuth client secrets — env/secret manager, not git.                                                                                                               |
| **Clock skew**        | JWT `exp`/`nbf`; this kit’s `Clock` port exists so tests are deterministic.                                                                                                     |
| **Idempotency**       | Not auth, but dangerous writes (invite, pay) should be idempotent; outbound HTTP client already supports `idempotencyKey`.                                                      |

---

## 9. Common mistakes

1. **Frontend `can()` as security.** Hide the button; still enforce in the use case.
2. **Trusting `x-user-id` in production.** The stub is a teaching seam, not a product.
3. **Role checks in UI and API.** Roles get renamed; permissions stay.
4. **Permissions in a long-lived JWT.** Admin revoked, token still admin for 7 days.
5. **No membership check** when setting tenant from a header or subdomain.
6. **Cross-tenant cache keys.** This kit prefixes Redis with tenant; copy that habit.
7. **Authorization only in the controller.** Workers will skip it.
8. **`localStorage` refresh token** on a XSS-prone SPA.
9. **`SameSite=None; Secure` cookies** without a real CSRF story.
10. **Confusing OAuth scopes with product permissions.** Scopes are “what this token is allowed to ask the IdP/API for,” not your RBAC catalog.
11. **One shared JWT secret** across admin and customer APIs with no `aud`.
12. **Logging `Authorization` headers.** The outbound HTTP client redacts them; inbound access logs should too.

---

## 10. How pieces map in this repository

| Concern                                                     | Where it lives now                                                                                                |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Permission catalog                                          | `packages/domain` (`PermissionCatalog`)                                                                           |
| Wire-safe permission names                                  | `packages/shared/contracts` (`PermissionName`)                                                                    |
| Branded `Permission` type                                   | `packages/shared/kernel-types`                                                                                    |
| `AuthorizationPort` / `require` / `getEffectivePermissions` | `packages/application` (`AuthorizationService`)                                                                   |
| Membership → role ids                                       | `MembershipRolesPort` (tenancy application)                                                                       |
| Cache-aside effective set                                   | `CachePort` + Redis, tenant-prefixed key                                                                          |
| Coarse HTTP gate                                            | `apps/api` `@RequirePermission` + interceptor                                                                     |
| API identity                                                | `AuthPrincipalInterceptor` (Bearer + non-prod header fallback), `@Public()` from `nest-http`                      |
| Authn strategies / providers                                | Local password + JWT/refresh (ADR-032). Header-trust remains a non-prod fallback. SSO/passkeys not built. See §14 |
| Session + `useCan` / `<Can>`                                | `packages/frontend/core`                                                                                          |
| Header injection                                            | `FrontendApi.prepareHeaders` (`Authorization: Bearer`)                                                            |
| Web login                                                   | `apps/web` `features/auth` + `/login`                                                                             |

**Not built yet (by design):** logout UI, select-tenant UI, register/forgot/reset pages, MFA, SSO, OIDC/SAML connections, linked identities, extra authn strategies, policy/CASL adapter, RLS, admin impersonation, outbox, HTML email templates.

**Now built:** email invitations + accept, attach-existing members, custom-role CRUD, and permission-cache `del` on those writes.

---

## 11. Choosing an approach (practical)

**If you are finishing this kit’s next phase (real authentication):**

- Prefer **OIDC-quality session**: short JWT or opaque access + **rotating refresh cookie**, tenant claim after selection.
- Keep **RBAC permissions** and `/me` as the UI source.
- Replace DevPrincipal only at the edge.
- Write-path **cache `del`** is implemented on invite/accept/attach/replace-roles and custom-role updates.

**If a customer demands “Login with Okta”:**

- Add a **per-tenant IdP connection**; map `email`/`sub` to `User`; issue _your_ session/JWT after SSO. Do not make Okta groups your only authorization model unless you explicitly sync them to roles.

**If you only have machine callers:**

- Client credentials or mTLS + tight permissions; no browser session.

**If you need “share this document with a link”:**

- That is ReBAC or capability tokens — not your membership RBAC. Don’t overload `Owner`.

---

## 12. Mental model to keep

```
Authentication  →  Principal          “We believe you are User U”
Tenancy         →  Active tenant      “You are acting in Tenant T (membership proven)”
Authorization   →  Permission + policy “In T, U may do X (and this resource)”
Frontend can()  →  UX                 “Don’t show the button”
Domain          →  Invariant          “Tenant must keep an Owner”
Database        →  Isolation          “Rows for T only”
```

If those stay separate, you can swap passwords for passkeys, or cookies for JWT, without rewriting `ListTenantMembers` or `useCan`.

---

## 13. OAuth, OAuth 2.0, and OpenID Connect

People say “OAuth” for three different things. They are related, not interchangeable.

| Name                      | Year                         | What it actually is                                                                                  | Use it for                                                                  |
| ------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **OAuth 1.0 / 1.0a**      | 2010                         | Delegation via **per-request HMAC signatures** (nonce, timestamp, shared secrets). No bearer tokens. | Legacy APIs only. Do not start new work here.                               |
| **OAuth 2.0**             | 2012 (RFC 6749 + later RFCs) | Delegation via **tokens**. “Let this app call that API on my behalf.” **Not a login protocol.**      | Access to _someone else’s_ API; machine tokens; the _transport_ under OIDC. |
| **OpenID Connect (OIDC)** | 2014                         | An **identity layer on OAuth 2.0**. Adds `id_token`, UserInfo, discovery, standard claims.           | “Login with Okta / Google / Entra.” **This is what you want for SSO.**      |

When someone says “we use OAuth” they almost always mean **OAuth 2.0**, and if they mean _login_ they almost always mean **OIDC** (whether they know the name or not).

### 13.1 The problem OAuth was invented to solve

You do **not** want Acme Calendar to ask for the user’s Google password. The user should tell Google: “this client may read my calendar,” Google should give the client a **limited token**, and Google Calendar should accept that token — not the password.

```
Resource owner (the person)
        │  “yes, Acme Calendar may read calendar.readonly”
        ▼
Authorization server (Google accounts)
        │  access token (and maybe refresh)
        ▼
Client (Acme Calendar)  ──calls──►  Resource server (Google Calendar API)
```

That is **authorization / delegation**. After it succeeds you know the client may call a scoped API. You do **not** automatically know a stable product user, email, or tenant membership. Those are identity questions.

### 13.2 Four roles (OAuth 2.0)

| Role                     | Job                                      | In this kit (when real auth exists)                |
| ------------------------ | ---------------------------------------- | -------------------------------------------------- |
| **Resource owner**       | The person (or org) who owns the data    | The `User`                                         |
| **Client**               | The app asking for access                | `apps/web` / a BFF / a partner integration         |
| **Authorization server** | Authenticates the owner, issues tokens   | Okta/Auth0/Entra _or_ your `identity` token issuer |
| **Resource server**      | Accepts the access token, serves the API | `apps/api`                                         |

A B2B product **plays more than one role**:

- **Login with Okta** — you are the **client**; Okta is the authorization server; you then become an authorization server for _your own_ API.
- **Your SPA calls `apps/api`** — you are the **resource server**. The token you accept should be _yours_ (or one you explicitly trust), with `aud` = this API.
- **Partner / CI calls you** — client-credentials or API key; no browser user.

Mixing those up is how teams send an Okta `id_token` to `apps/api` and call it a session. Wrong audience, wrong lifetime, no tenant claim, cannot revoke independently.

### 13.3 What OAuth 2.0 specifies — and what it leaves out

OAuth 2.0 specifies **grants** (how you get a token), **tokens**, and **scopes** (coarse strings the authorization server understands, e.g. `calendar.readonly`).

It does **not** specify:

- a standard “who is this person?” token
- a user profile schema
- how to discover the authorization server’s URLs and keys
- how your product maps that person onto `User` + memberships

An access token may be opaque (lookup) or a JWT. The **client** is not supposed to read it. The **resource server** is. There is no requirement that it contain `email` or even a stable user id you can use as `UserId`.

That gap is why early “Sign in with Twitter/Google” hacks used OAuth 2.0, then called a vendor-specific profile URL as a side effect. It worked until it didn’t (every vendor different, no `id_token`, no standard `sub`).

### 13.4 What OIDC adds

OIDC is OAuth 2.0 **plus** a contract for **authentication**.

The client requests the `openid` scope. In addition to an access token it receives an **`id_token`**: a JWT the **client** is meant to read.

Typical ID-token claims:

| Claim                                | Meaning                                                              |
| ------------------------------------ | -------------------------------------------------------------------- |
| `iss`                                | Authorization server that minted it                                  |
| `sub`                                | Stable subject _at that issuer_ (not your `UserId` until you map it) |
| `aud`                                | **Your OIDC client id**, not `apps/api`                              |
| `exp` / `iat` / `nonce`              | Lifetime and replay protection                                       |
| `email`, `email_verified`, `name`, … | Optional standard profile claims                                     |

Also standardized:

- **UserInfo** — HTTP GET with the access token; returns more profile claims
- **Discovery** — `https://{issuer}/.well-known/openid-configuration` (token URL, JWKS URL, supported grants)
- **JWKS** — public keys so you verify the `id_token` signature without a shared secret (RS256/ES256)

```
OAuth 2.0                         OpenID Connect
─────────                         ──────────────
“May this client                  “Who just authenticated,
 call that API?”                   and can I trust that answer?”

access token  (+ refresh)         id_token  +  UserInfo
                                  (still uses OAuth grants
                                   and often an access token)
```

**Rule:** OIDC answers _authentication at the IdP_. It does not replace this kit’s `AuthorizationPort`, permission catalog, or tenant membership. Groups/roles the IdP sends are _hints_ you may sync to **your** roles — they are not `tenancy.members.read`.

### 13.5 Three tokens, three jobs

| Token             | Audience                  | Job                                 | Store it?                                                           |
| ----------------- | ------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| **Access token**  | Resource server           | Call an API                         | Memory (SPA) or not at all (BFF)                                    |
| **Refresh token** | Authorization server only | Mint new access tokens              | `HttpOnly` cookie or OS secure store                                |
| **ID token**      | The OIDC **client**       | Prove who logged in _to the client_ | Read once at login; do not send it as `Authorization` to `apps/api` |

After a successful OIDC login this kit should: verify the `id_token` (sig, `iss`, `aud`, `exp`, `nonce`) → map `iss`+`sub` (or verified email) to a `User` → issue **this product’s** session (short access JWT or opaque token + refresh cookie, tenant claim after selection). Downstream code keeps seeing `userId` + `tenantId`.

### 13.6 Authorization code + PKCE (the flow you will implement)

Public clients (SPA, mobile, desktop) cannot hide a client secret. **Authorization code + PKCE** is the default. Implicit and resource-owner-password are deprecated.

```
[Browser]                         [apps/api or BFF]              [IdP]
    │  1. login button                  │                          │
    │  generate code_verifier           │                          │
    │  code_challenge = S256(verifier)  │                          │
    │──────────────────────────────────►│  2. 302 to IdP           │
    │                                   │  client_id, redirect_uri,│
    │                                   │  scope=openid …,         │
    │                                   │  state, nonce,           │
    │                                   │  code_challenge          │
    │◄──────────────────────────────────┼──────────────────────────┤
    │  3. user authenticates at IdP (password / MFA / corporate SSO)
    │───────────────────────────────────┼─────────────────────────►│
    │  4. 302 back with ?code=&state=   │                          │
    │──────────────────────────────────►│  5. check state (CSRF)   │
    │                                   │  POST /token             │
    │                                   │  code + code_verifier    │
    │                                   │─────────────────────────►│
    │                                   │  id_token + access       │
    │                                   │  (+ refresh)             │
    │                                   │◄─────────────────────────│
    │                                   │  6. verify id_token      │
    │                                   │  map to User             │
    │                                   │  issue *your* session    │
    │◄── set refresh cookie + SPA ──────│                          │
         receives access token (memory)
```

`state` binds the redirect to the browser that started login (CSRF). `nonce` is echoed in the `id_token` (replay). PKCE binds the code to the client that created the challenge — a stolen `code` is useless without `code_verifier`.

**Confidential clients** (server-side BFF, classic web app) still use the code grant; they also send a client secret (or JWT assertion). PKCE is still recommended.

### 13.7 Other grants, in one place

| Grant                         | Who uses it                     | Notes                                                                                       |
| ----------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| **Authorization code + PKCE** | Users in browsers / native apps | Default for login (OIDC) and delegated API access                                           |
| **Client credentials**        | Services, workers, partners     | No user. `sub` is the client, not a `User`. Map to a machine principal + tight permissions. |
| **Refresh token**             | Same client, later              | Rotation + reuse detection; see §3.2                                                        |
| **Device code**               | CLI, TV, limited input          | User approves on another device                                                             |
| **Resource owner password**   | Legacy                          | Client sees the password. Do not add.                                                       |
| **Implicit**                  | Old SPAs                        | Tokens in the URL fragment. Do not add.                                                     |

SAML 2.0 is a **different** SSO protocol (XML, browser POST). Same product outcome (IdP asserts identity → you create a session). Many enterprise buyers still require it next to OIDC. Treat it as another **strategy**, not as “OAuth.”

### 13.8 Scopes are not product permissions

|               | OAuth / OIDC **scope**                            | This kit **permission**                                      |
| ------------- | ------------------------------------------------- | ------------------------------------------------------------ |
| Issued by     | Authorization server / IdP                        | `authorization` catalog (`PermissionName`)                   |
| Grain         | Coarse (`openid`, `profile`, `calendar.readonly`) | Fine (`tenancy.members.read`)                                |
| Lifetime      | Lives on the token                                | Resolved live via membership → roles (cached, tenant-scoped) |
| Checked where | Token introspection / JWT `scope` claim           | `AuthorizationPort.require` + `@RequirePermission`           |

A scope of `openid email` means “the IdP may tell you who this is.” It does not mean the user may invite members in Tenant B. Do not stuff `PermissionName` values into an IdP access token as the only source of truth — they go stale the moment a role changes.

### 13.9 How this maps onto the repository

**Today:** password login, JWT access, cookie `/auth/web/*` and native `/auth/{login,refresh,logout}` token paths, set/change password, and SMTP when `SMTP_HOST` is set are implemented on the API (ADR-032). The web app still uses the header stub until the frontend follow-up.

**When SSO / social login lands** (all in `identity` + the API edge):

1. Register an OIDC client (or per-tenant connection — §14.5).
2. Run authorization-code + PKCE (BFF or `apps/api` callback).
3. Verify `id_token` against the issuer’s JWKS (`HttpClientPort` outbound; redact tokens in logs).
4. Find or create `User`; store a linked identity `(issuer, sub)`.
5. Issue **this kit’s** access + refresh (tenant claim after the user selects a tenant).
6. Leave `AuthorizationPort`, `TenantContext`, `useCan`, and controllers alone.

You remain free to _also_ be an OAuth **client** in the original sense (e.g. “connect Slack”) — that is a separate token, stored against the tenant or user, never confused with the login session.

---

## 14. Multiple authentication strategies and providers

Authentication is a **plug-in**. Authorization and tenancy are not. The rest of the kit already assumes that: controllers, `AuthorizationPort.require`, and `useCan` take a principal, not a password.

### 14.1 Strategy vs provider

Two words that get mixed up:

| Term                                        | Question it answers                                | Examples                                                                                                      |
| ------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Strategy**                                | _How_ do we verify _this request_ (or this login)? | Password hash, OIDC authorization code, WebAuthn assertion, API key lookup, mTLS, today’s `x-user-id` headers |
| **Provider** (also **connection**, **IdP**) | _Who_ asserted the identity?                       | `local` (this kit’s `identity`), Google, Microsoft, “Acme Corp Okta”, “Beta Inc Entra”                        |

One strategy can serve many providers (a single OIDC strategy, many issuer URLs). One provider can support several strategies over time (Okta via OIDC today, SAML still on for one customer).

Passport.js / NestJS “Passport strategies” popularized the same idea: many verifiers, **one** `validate()` result. This kit should keep that shape even if it never imports Passport — a port, not a library choice.

### 14.2 Why a B2B SaaS has more than one

| Caller                      | Typical strategy                                   | Typical provider                          |
| --------------------------- | -------------------------------------------------- | ----------------------------------------- |
| Founder / self-serve user   | Password, passkey, or social OIDC                  | `local`, Google, Microsoft                |
| Enterprise employee         | OIDC or SAML SSO                                   | **That tenant’s** Okta / Entra            |
| Browser already signed in   | Bearer access token / session cookie               | _You_ (your issuer)                       |
| CI, partner, webhook sender | API key or client credentials                      | Machine client, not a `User`              |
| Local development (now)     | Bearer JWT, or `x-user-id` / `x-tenant-id` headers | Header-trust is `development`/`test` only |

If each of those leaked a different “current user” type into use cases, you would rewrite `ListTenantMembers` for every new login method. They must all collapse to the same principal: `{ userId }` plus an active `{ tenantId }` after membership is proven.

```
                    ┌─────────────────────────────────────────┐
  password  ──────► │                                         │
  Google OIDC ────► │  strategy.verify(request) → userId      │
  Acme Okta  ─────► │  AssertActiveMembership(user, tenant)   │──► same stack
  API key    ─────► │  TenantContext + AuthorizationPort      │    as today
  x-user-id  ─────► │                                         │
                    └─────────────────────────────────────────┘
```

`AuthPrincipalInterceptor` is already strategy #1 (Bearer, plus headers in non-production). More strategies **add** at the edge; they do not replace `require()` or `/me`.

### 14.3 The seam in this architecture

| Layer                                   | May know about strategies?                               | Why                                                       |
| --------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------- |
| `apps/api` edge (interceptor / guard)   | **Yes** — pick and run them                              | Transport: headers, cookies, redirects                    |
| `identity` application + domain         | **Yes** — credentials, linked identities, token issuance | This is the context’s job                                 |
| `tenancy` / `authorization` / use cases | **No**                                                   | They need `userId` + `tenantId`, not “Google vs password” |
| `packages/frontend/core`                | Only “session exists” + `/me`                            | Same `prepareHeaders` and `useCan` after any login        |
| `features/auth`                         | Password login + session restore                         | Must not grow a second auth model per host                |

A useful port shape (not built yet; illustrative):

```
AuthenticationPort.authenticate(rawRequest) → Principal
  // or, for interactive login:
IdentityProviderPort.startLogin(providerId) → redirect
IdentityProviderPort.finishLogin(callback) → { userId }
```

Implementations live in infrastructure (OIDC client, Argon2id verify, API-key lookup). Composition binds them. The domain `User` stays “a person”; credentials are associated records, not fields on the aggregate forever.

### 14.4 One user, many ways in (account linking)

`User` is global and today has **no credentials** (`email`, `displayName`, `status` only). When real auth lands, do not add `passwordHash` as the only door. Model **linked identities**:

```
User  (global person — your UserId)
  ├── LocalPassword     { passwordHash }          provider = local
  ├── FederatedIdentity { issuer, subject }       provider = google | okta:tenant:…
  └── WebAuthnCredential { credentialId, publicKey }
```

`(issuer, subject)` is the stable key from OIDC (`iss` + `sub`). Email is a **hint** for first-time match, not a primary key — emails get recycled; `sub` does not.

**Linking rules to decide explicitly** (product, not a library default):

- **Invite-only:** OIDC may succeed, but no `User` / membership until an invite. Safer for B2B.
- **JIT (just-in-time) provision:** first SSO creates a `User` (and maybe a membership). Faster; easier to get wrong (account takeover if you trust unverified email).
- **Explicit link:** signed-in user connects Google. Clearest, more UX.

Never auto-merge two existing users because emails match without a verified claim and an explicit policy.

### 14.5 Product-wide vs per-tenant providers

| Kind               | Configured where                                | Who can use it                                |
| ------------------ | ----------------------------------------------- | --------------------------------------------- |
| **Product-wide**   | Env / `identity` config                         | Any user (password, Google, passkeys)         |
| **Per-tenant SSO** | Tenant setting (IdP client id, issuer, domains) | Users signing into _that_ tenant (enterprise) |
| **Machine**        | Tenant or platform client registry              | No human; client-credentials / API key        |

B2B buyers expect **their** Okta, not your Google button, for employees. Membership still lives in _your_ `tenancy` tables. The IdP only asserts `sub` / email.

**Home-realm discovery:** user types `ada@acme.com` → you look up a connection for `acme.com` → redirect to Acme’s IdP. Unknown domains fall through to local / social. Do not let a user pick “Acme Okta” and then land in Tenant Beta without a membership check.

**Tenant in the token:** issue the access token _after_ tenant selection (or a single-membership shortcut). A Google login does not know the tenant. An enterprise IdP connection often _implies_ one tenant — still verify membership before `TenantContext.run`.

### 14.6 How to add a strategy later (without rewriting the product)

1. **Implement a verifier** that, given the raw credential, returns a `userId` or fails closed (401).
2. **Register it at the edge** — Bearer JWT is the production path; keep header-trust only in `development`/`test` (`assertAuthBootstrap`).
3. **Persist the link** in `identity` (`FederatedIdentity`, password, API key hash).
4. **Issue the kit session** (same access + refresh story as password login). Do not let each provider invent its own cookie names and `/me` shapes.
5. **Do not** pass IdP groups into `AuthorizationPort`. If you sync groups, write **your** role assignments, then `del` the effective-permissions cache.
6. **Frontend:** a login page lists _enabled_ strategies; after success the session slice + `prepareHeaders` + `/me` are unchanged. Desktop/mobile keep using `frontend/core` — host-specific is storage and redirect URLs, not a second auth model.

Interactive strategies (OIDC redirect, passkey prompt) live on **login routes** (`@Public()`). Ongoing request strategies (Bearer, cookie, API key) live on the **global interceptor**, same place as `AuthPrincipalInterceptor` today.

### 14.7 Machines are a strategy, not a fake user (usually)

Client credentials and API keys should resolve to a **machine principal** (or a narrowly scoped service account) with explicit permissions — not `x-user-id` of a human admin. Workers already pass `tenantId` + `actorId` on the job; keep that, do not make the worker “log in with Google.”

### 14.8 What not to do

- One Passport strategy that writes roles into the JWT and skip `AuthorizationPort`.
- A different session type per provider (`GoogleUser` vs `PasswordUser` in controllers).
- Trusting IdP `tid` / org claims as `tenantId` without membership.
- Enabling DevPrincipal and OIDC in production “just in case.”
- Storing provider access tokens (Slack, Google Calendar) in the **login** session — those are connections, not authn.

If strategies stay behind `identity` + the edge, you can add Okta for one tenant, passkeys for self-serve, and API keys for partners, and `ListTenantMembers` never learns any of their names.
