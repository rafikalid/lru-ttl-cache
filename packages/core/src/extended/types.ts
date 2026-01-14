import { Metadata, ResolverResultType } from '../core/types';

export interface ExtendedResolverResultType<K, V> extends ResolverResultType<K, V> {
  weight?: number;
  isPermanent?: boolean;
  /**
   * Callback function invoked when an item is deleted from the cache.
   * This can be used for logging, cleanup, or other side effects.
   */
  onDeleted?: OnDeleted<K, V>;
}

/** Saved value metadata */
export interface ExtendedMetadata<K, V> extends Metadata<K, V> {
  /** Item weight @default 1 */
  weight: number;
  /** is permanent item or temporary @default false */
  isPermanent: boolean;
}

export type OnDeleted<K, V> = (record: ExtendedMetadata<K, V>, reason: CacheEventReason) => void;
export type CacheEventReason =
  | 'expired'
  | 'evicted'
  | 'removed'
  | 'clearedTemp'
  | 'clearedPerm'
  | 'clearedAll'
  | 'replaced';
