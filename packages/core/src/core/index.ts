import { LruLinkedNode, Metadata, Options, Resolver } from './types';
import { BytesValue, parseBytes } from '../utils/bytes-parser';
import { parseTimeExpression } from '../utils/time-parser';

const TTL_ACCURACY_DEFAULT_FRAG = 10;
const TTL_ACCURACY_DEFAULT = 1000; // 1s
/**
 * 15ms. Minimum timer accuracy in Node.js and browsers.
 * Using a lower value is pointless as the timer won't be more accurate.
 * This is used to clamp ttlAccuracy values.
 */
const TIME_UNIT = 15;

export default class LRU_TTL<
  K = any,
  V = any,
  ResolverArgs extends any[] = any[],
  M extends Metadata<K, V> = Metadata<K, V>,
> implements LruLinkedNode<K, V>
{
  /** MRU @private */
  _prev: LruLinkedNode<K, V> = this;
  /** LRU @private */
  _next: LruLinkedNode<K, V> = this;

  /** store all temporary & permanent data @private */
  protected _map = new Map<K, M>();

  /** Max count or weight */
  protected _max: number = Infinity;
  /** Max as set by user */
  #maxRaw: BytesValue = Infinity;
  /** Time To Live */
  protected _ttl: number = Infinity;
  /** TTL as set by user */
  #ttlRaw: number | string = Infinity;
  /** TTL accuracy @default ttl/10 */
  protected _ttlAccuracy: number = 0;
  /** TTL accuracy as set by user */
  #ttlAccuracyRaw?: number | string = undefined;

  /** defaultResolver */
  #defaultResolver?: Resolver<K, V, ResolverArgs> = undefined;

  /**
   * Total entries weight, for this class it equals the number of items,
   * but in the extended class it will be the actual total records weight instead
   */
  // protected _weight: number = 0;

  /** TTL Check Interval ID */
  #ttlInterval: NodeJS.Timeout | null = null;

  /** Current TTL tick: use to clean up expired items (performance optimization) */
  protected _currentTick: number = 0;

  constructor(options?: Options<K, V, ResolverArgs>) {
    if (options != null) {
      const { max, ttl, ttlAccuracy, defaultResolver } = options;

      if (max != null) this.max = max;
      if (ttlAccuracy != null) this.ttlAccuracy = ttlAccuracy;
      if (ttl != null) this.ttl = ttl;
      if (defaultResolver != null) this.defaultResolver = defaultResolver;
    }
  }

  /** Get evaluated max value as number */
  get evalMax(): number {
    return this._max;
  }

  /** Get max value as set by user as number or string */
  get max(): BytesValue {
    return this.#maxRaw;
  }

  /**
   * Set the maximum allowed size of the cache.
   * By default, it's the number of items, but could be the total weight if you use weights
   * Set to Infinity to disable LRU/MRU behaviour of the cache.
   */
  set max(value: BytesValue) {
    const parsedValue = parseBytes(value);
    if (parsedValue <= 0) {
      throw new Error(`Invalid max value: ${value}`);
    }
    this.#maxRaw = value;
    this._max = parsedValue;
    this._enforceMaxLimits();
  }

  get evalTTL(): number {
    return this._ttl;
  }

  /** Get TTL as set by user as number or string */
  get ttl(): number | string {
    return this.#ttlRaw;
  }

  /**
   * Time to live after last access.
   * Items not accessed within this duration will be automatically removed.
   */
  set ttl(value: number | string) {
    const parsedValue = parseTimeExpression(value);
    const isSafeTTL =
      (Number.isSafeInteger(parsedValue) && parsedValue >= 0) || parsedValue === Infinity;
    if (!isSafeTTL) {
      throw new Error(`Invalid ttl value: ${value}`);
    }

    this.#ttlRaw = value;
    this._ttl = parsedValue;

    this.#setupTTLInterval();
  }

  /** Get evaluated TTL accuracy as number */
  get evalTTLAccuracy(): number {
    let ttlAccuracy = this._ttlAccuracy;
    if (ttlAccuracy === 0) {
      const ttl = this._ttl;
      ttlAccuracy =
        ttl === Infinity ? TTL_ACCURACY_DEFAULT : Math.ceil(ttl / TTL_ACCURACY_DEFAULT_FRAG);
    }
    return ttlAccuracy;
  }

  /** Get TTL accuracy as set by user as number or string */
  get ttlAccuracy(): number | string | undefined {
    return this.#ttlAccuracyRaw;
  }

  /** Set the accuracy of the TTL checking interval */
  set ttlAccuracy(value: number | string | undefined) {
    let parsedValue = 0;
    if (value != null) {
      parsedValue = parseTimeExpression(value);
      if (parsedValue < TIME_UNIT) {
        throw new Error(`Invalid ttlAccuracy value: ${value}. Minimum is ${TIME_UNIT}ms`);
      }
    }
    this._ttlAccuracy = parsedValue;
    this.#ttlAccuracyRaw = value;
    this.#setupTTLInterval();
  }

  /** Retrieve the default resolver function, which is utilized to resolve values that are not found in the cache when using `cache.resolve(key)`. */
  get defaultResolver(): Resolver<K, V, ResolverArgs> | undefined {
    return this.#defaultResolver;
  }

  /** Set the default resolver function, which is utilized to resolve values that are not found in the cache when using `cache.resolve(key)`. */
  set defaultResolver(resolver: Resolver<K, V, ResolverArgs> | undefined) {
    if (typeof resolver !== 'function' && resolver != null) {
      throw new Error(`defaultResolver must be a function or undefined.`);
    }
    this.#defaultResolver = resolver;
  }

  /** Get the number of items in the cache */
  get size(): number {
    return this._map.size;
  }

  /** @deprecated Use `size` instead. */
  get count(): number {
    return this._map.size;
  }

  /** Get the least recently used temporary record in the cache */
  get lru(): M | null {
    const lru = this._next;
    return lru === this ? null : (lru as M);
  }

  /** Get the most recently used temporary record in the cache */
  get mru(): M | null {
    const mru = this._prev;
    return mru === this ? null : (mru as M);
  }

  /** Check if a key exists in the cache */
  has(key: K): boolean {
    return this._map.has(key);
  }

  set(key: K, value: V): this {
    const map = this._map;
    const now = this._currentTick;
    let entry = map.get(key);

    if (entry == null) {
      entry = {
        key,
        value,
        lastAccessedAt: now,
        addedAt: now,
        _next: this,
        _prev: this,
      } as unknown as M;
      map.set(key, entry);
    } else {
      // Remove from current position in LRU list
      entry._prev._next = entry._next;
      entry._next._prev = entry._prev;
      // Add entry
      if (entry.value === value) {
        // Update existing entry
        entry.value = value;
        entry.lastAccessedAt = now;
      } else {
        entry = {
          key,
          value,
          lastAccessedAt: now,
          addedAt: now,
          _next: this,
          _prev: this,
        } as unknown as M;
        map.set(key, entry);
      }
    }

    // Append to MRU position
    entry._prev = this._prev;
    entry._next = this;
    this._prev._next = entry;
    this._prev = entry;

    // Enforce max limits
    if (this._map.size > this._max) this._enforceMaxLimits();
    return this;
  }

  get(key: K): V | undefined {
    return this.getMetadata(key)?.value;
  }

  getMetadata(key: K): M | undefined {
    const entry = this._map.get(key);
    if (entry == null) return undefined;

    const now = this._currentTick;
    // Update TTL
    entry.lastAccessedAt = now;
    // Move to MRU
    moveToMRU(this, entry);
    return entry;
  }

  /** Peek at a value in the cache without updating its recency or TTL */
  peek(key: K): V | undefined {
    return this._map.get(key)?.value;
  }

  /** Peek at the metadata of a record in the cache without updating its recency or TTL */
  peekMetadata(key: K): M | undefined {
    return this._map.get(key);
  }

  clear(): this {
    this._map = new Map<K, M>();
    // Reset linked list
    this._next = this;
    this._prev = this;
    return this;
  }

  #setupTTLInterval() {
    // Clear previous interval
    if (this.#ttlInterval != null) clearInterval(this.#ttlInterval);
    if (this._ttl === Infinity) return;

    const ttlAccuracy = this.evalTTLAccuracy;
    if (ttlAccuracy === Infinity)
      throw new Error(
        `Invalid ttlAccuracy value: cannot be Infinity when ttl is set (ttl= ${this._ttl}).`,
      );

    const intervalId = setInterval(() => {
      this._ttlCleaner();
    }, ttlAccuracy);
    /** Unref the interval to allow the program to exit if this is the only active timer */
    intervalId.unref?.();
    this.#ttlInterval = intervalId;
  }

  protected _ttlCleaner() {
    let lru: LruLinkedNode<K, V> = this._next;
    if (lru === this) return; // empty cache, we don't clear time interval for performance.
    // Get accuracy & set next tick interval
    const ttlAccuracy = this._ttlAccuracy;
    const currentTick = this._currentTick;
    this._currentTick += ttlAccuracy;
    // Remove expired items
    const map = this._map;
    const expires = currentTick - this._ttl;
    while (lru !== this && (lru as M).lastAccessedAt <= expires) {
      // Remove from map
      map.delete((lru as M).key);
      // Next item
      lru = lru._next;
    }
    // detached expired nodes
    this._next = lru;
    lru._prev = this;
  }

  protected _enforceMaxLimits() {
    const maxSize = this._max;
    let size = this._map.size;
    if (size <= maxSize) return;
    const map = this._map;
    let lru = this._next;
    while (size > maxSize && lru !== this) {
      // "lru===this" should not happen as size > maxSize
      // Remove from map
      map.delete((lru as M).key);
      // Next item
      lru = lru._next;
      --size;
    }
    // detached evicted nodes
    this._next = lru;
    lru._prev = this;
  }

  /** For(of) */
  *[Symbol.iterator](): IterableIterator<M> {
    const it = this._map.values();
    let v = it.next();
    while (!v.done) {
      const entry = v.value;
      yield entry;
      v = it.next();
    }
  }

  //TODO: async iterator
  // async *[Symbol.asyncIterator](): AsyncIterableIterator<Metadata<K, Awaited<V>>> {
  //   const it = this._map.values();
  //   let v = it.next();
  //   const promises: Metadata<K, V>[] = [];
  //   let promiseCount = 0;
  //   let resolveValue: (value: Metadata<K, Awaited<V>>) => void;
  //   let rejectValue: (reason?: any) => void;

  //   // Function to process settled promises
  //   while (!v.done) {
  //     const entry = v.value;
  //     const value = entry.value;
  //     if(value instanceof Promise) {
  //       promises.push(entry);
  //       ++promiseCount;
  //     }
  //     else yield {...entry, value : value as Awaited<V>};
  //     v = it.next();
  //   }

  //   // Resolve promises as soon as settled
  //   while(promiseCount > 0) {
  //     const {promise, resolve, reject} = Promise.withResolvers<Metadata<K, Awaited<V>>>();
  //     resolveValue = resolve;
  //     rejectValue = reject;
  //     yield await promise;
  //     --promiseCount;
  //   }
  // }
}

export function moveToMRU<K, V, M extends Metadata<K, V>>(
  cache: LRU_TTL<K, V, any[], M>,
  entry: M,
): void {
  // Remove from current position
  entry._prev._next = entry._next;
  entry._next._prev = entry._prev;
  // Append to MRU position
  entry._prev = cache._prev;
  entry._next = cache;
  cache._prev._next = entry;
  cache._prev = entry;
}
