import { BytesValue } from '../utils/bytes-parser';

/** Saved value metadata */
export interface Metadata<V> {
  value: V;
  lastAccessedAt: number;
}

export type Resolver<K, V, ArgsType extends any[]> = (
  key: K,
  ...args: ArgsType
) =>
  | null
  | (V extends Promise<infer U>
      ? ResolverResult<K, U> | Promise<ResolverResult<K, U>>
      : ResolverResult<K, V>);
export type ResolverResult<K, V> = ResolverResultType<V> | null | undefined;

export interface ResolverResultType<V> {
  value: V;
}

export interface Options<K, V> {
  /**
   * Set the maximum allowed size of the cache.
   * By default, it's the number of items, but could be the total weight if you use weights
   * Set to Infinity to disable LRU/MRU behaviour of the cache.
   * @example
   *    { max: 500 }
   *    { max: "5k" } converted to 5 000
   *    { max: "5M" } converted to 5 000 000
   *    { max: "5MB" } converted to 5 * 2**20
   *    { max: "5MiB" } converted to 5 000 000
   *    { max: Infinity } disable LRU/MRU behaviour of the cache
   * @default Infinity
   */
  max?: BytesValue;

  /**
   * Time to live after last access.
   * Items not accessed within this duration will be automatically removed.
   * @example
   *    { ttl: 3000 } removes after 3000ms
   *    { ttl: '2h' }
   *    { ttl: '4d 2h 25min 66s 5ms' }
   * @default Infinity
   */
  ttl?: number | string;

  /**
   * TTL accuracy interval for batch cleanup.
   * Items are removed within [ttl, ttl + ttlAccuracy] range.
   * Constraints: 500ms <= ttlAccuracy <= ttl
   * @example
   *    { ttlAccuracy: 500 } checks every 500ms
   *    { ttlAccuracy: '10s' }
   * @default max(ttl/10, 1s)
   */
  ttlAccuracy?: number | string;
}
