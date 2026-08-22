# Redis

Redis backs caching, distributed locks, pub/sub, and BullMQ. In the architecture these are reached
through generic ports (`CachePort`, `LockPort`, `PubSubPort`) — see
[`../architecture/infrastructure.md`](../architecture/infrastructure.md).

## Image & version

- Official **`redis:7.2-alpine`**, pinned.
- **Standalone, no cluster. No Redis Stack / modules** (RediSearch, RedisJSON, …).
- One instance serves cache + locks + pub/sub + BullMQ (cost-efficient).

## Eviction policy (important)

BullMQ requires `maxmemory-policy noeviction`, so the shared instance uses **`noeviction`**. That
means **cache correctness relies on per-key TTLs**, not LRU eviction — always set a TTL on cache
entries. If cache pressure ever competes with queue data, split into a second cache-only instance
(with `allkeys-lru`) later.

Config is passed on the command line (`--maxmemory`, `--maxmemory-policy`) because managed Redis
(see below) does not allow runtime `CONFIG SET`; keeping it out of runtime `CONFIG` preserves
portability.

## Persistence

**Fully ephemeral** — started with `--save "" --appendonly no` and **no volume**. Durability lives
in Postgres + the transactional outbox, which re-publishes on Redis loss. A Redis restart cold-starts
caches and drops in-flight jobs, all of which are recoverable. Do not treat Redis as a system of
record.

## Pub/Sub

Standard Redis PUB/SUB works on standalone Redis and on managed Redis. Keep usage behind
`PubSubPort`; if a clustered managed tier is later used, sharded pub/sub (`SSUBSCRIBE`, Redis 7+) is
the cluster-correct path and stays swappable behind the port. Keyspace notifications, if used, must
be enabled at instance-creation time on managed Redis.

## Future GCP portability

Target **Memorystore for Redis 7.x** or **Memorystore for Valkey** (Valkey 7.2 is a Redis-7.2
drop-in). Rules to stay portable — encoded now:

- No modules (unsupported on Memorystore).
- No runtime `CONFIG SET` — set memory policy / keyspace notifications at instance creation.
- Prefer standalone semantics; avoid assuming single-node key locality in Lua.
- Avoid admin commands like `SAVE`/`SWAPDB` and `KEYS` in hot paths.

Only `REDIS_URL` changes when moving to managed Redis; no app code changes.
