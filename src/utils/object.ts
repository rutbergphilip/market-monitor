/**
 * Type-safe version of Object.freeze
 * @param obj The object to freeze
 * @returns The frozen object
 */
export function freeze<T>(obj: T): Readonly<T> {
  return Object.freeze(obj);
}
