import { BytesValue } from './utils/bytes-parser';

export interface Options<K, V, ResolverArgsType extends any[]> {
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

export type OnDeleted<K, V> = (records: Metadata<K, V>[], reason: DeletedReason) => void;
export type DeletedReason =
  | 'expired'
  | 'lru'
  | 'removed'
  | 'replaced'
  | 'clearedAll'
  | 'clearedTemp'
  | 'clearedPerm';

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
  /** addedAt ≤ real_Added_time ≤ addedAt + ttlAccuracy */
  addedAt: number;
  /** lastAccessedAt ≤ real_LastAccessed_time ≤ lastAccessedAt + ttlAccuracy */
  lastAccessedAt: number;
}
