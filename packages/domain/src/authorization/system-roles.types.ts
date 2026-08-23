/**
 * Seeded per tenant at creation. Custom roles reuse the same `Role` aggregate.
 */
export const SystemRoleNames = ['Owner', 'Admin', 'Member'] as const

export type SystemRoleName = (typeof SystemRoleNames)[number]
