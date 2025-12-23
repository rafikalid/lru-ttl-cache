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