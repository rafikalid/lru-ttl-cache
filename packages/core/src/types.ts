import { BytesValue } from './utils/bytes-parser';

export interface Options<K, V, ResolverArgsType extends Array<any>> {
  /**
   * Set the maximum allowed size of the cache.
   * By default, it's the number of items, but could be the total weight if you use weights
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
   * TTL resolution interval for batch cleanup.
   * Items are removed within [ttl, ttl + ttlResolution] range.
   * Constraints: 1ms <= ttlResolution <= ttl
   * @example
   *    { ttlResolution: 500 } checks every 500ms
   *    { ttlResolution: '10s' }
   * @default max(ttl/10, 1s)
   */
  ttlResolution?: number | string;

  /**
   * Force TTL check on every get() operation.
   * This ensures that expired items are not returned even if they haven't been cleaned up yet.
   * Note: Enabling this may impact performance due to additional checks on each access.
   * @default false
   */
  forceTTL?: boolean;

  /**
   * Default resolver function for missing keys.
   * This function is called when a key is not found in the cache.
   * It should return the value to be stored in the cache for the missing key or a Promise.
   */
  defaultResolver?: Resolver<K, V, ResolverArgsType>;

  /**
   * Callback function invoked when an item is deleted from the cache.
   * This can be used for logging, cleanup, or other side effects.
   */
  onDeleted?: OnDeleted<K, V>;
}

export type Resolver<K, V, ArgsType extends Array<any>> = (
  key: K,
  ...args: ArgsType
) => V extends Promise<infer U>
  ? ResolverResult<K, U> | Promise<ResolverResult<K, U>>
  : ResolverResult<K, V>;
export type ResolverResult<K, V> = ResolverResultType<K, V> | null | undefined;

export interface ResolverResultType<K, V> {
  value: V;
  weight?: number;
  isPermanent?: boolean;
  onDeleted?: OnDeleted<K, V>;
}

export type OnDeleted<K, V> = (key: K, value: V) => void;

export interface LruLinkedNode<K, V> {
  /** Prev is least recently used, cache object if it LRU */
  _prev: LruLinkedNode<K, V>;
  /** next is most recently used, cache object if it MRU */
  _next: LruLinkedNode<K, V>;
}

/** Saved value metadata */
export interface Metadata<K, V> extends LruLinkedNode<K, V> {
  key: K;
  value: V; // TODO: Check if setting this to undefined when deleted helps GC
  /** Item weight @default 1 */
  weight: number;
  /** is permanent item or temporary @default false */
  isPermanent: boolean;
  /** Added time - related to local timer instead of timestamp for performance */
  addedAt: number;
  /** Last accessed time - related to local timer instead of timestamp for performance */
  lastAccessedAt: number;
}
