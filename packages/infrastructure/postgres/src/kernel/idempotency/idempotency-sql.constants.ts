export const IDEMPOTENCY_CLAIM_INSERT_SQL = `
  INSERT INTO idempotency_keys (
    id,
    scope,
    endpoint,
    idempotency_key,
    request_fingerprint,
    status,
    response_status,
    response_body,
    expires_at,
    tenant_id,
    actor_id,
    created_at,
    updated_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, $7, $8, $9, $10, $10)
  ON CONFLICT ON CONSTRAINT uq_idempotency_keys_scope_endpoint_key DO NOTHING
  RETURNING id
`
export const IDEMPOTENCY_LOCK_TIMEOUT = '55P03'
export const IDEMPOTENCY_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
