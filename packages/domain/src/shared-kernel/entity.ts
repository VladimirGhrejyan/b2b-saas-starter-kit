/**
 * An object with a durable identity.
 *
 * Equality is by runtime class and `id`, not by attribute values.
 */
export class Entity<TId> {
  constructor(readonly id: TId) {}

  /**
   * Returns whether `other` is the same entity (same class and id).
   *
   * @param other - Another entity, or a nullish value.
   * @returns `true` when both refer to the same identity.
   */
  equals(other: Entity<TId> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false
    }

    if (this.constructor !== other.constructor) {
      return false
    }

    return this.id === other.id
  }
}
