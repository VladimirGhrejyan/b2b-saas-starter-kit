/** Value type of an object's own properties (`T[keyof T]`). */
export type ObjectValue<T> = T[keyof T]
