import { LruLinkedNode, Metadata, OnDeleted, Options, Resolver } from './types';
import { BytesValue, parseBytes } from './utils/bytes-parser';
import { parseTimeExpression } from './utils/time-parser';

const TTL_ACCURACY_DEFAULT_FRAG = 10;
const TTL_ACCURACY_DEFAULT = 1000; // 1s
/**
 * 15ms. Minimum timer accuracy in Node.js and browsers.
 * Using a lower value is pointless as the timer won't be more accurate.
 * This is used to clamp ttlAccuracy values.
 */
const TIME_UNIT = 15;

export default class LRU_TTL<K = any, V = any, ResolverArgs extends any[] = any[]>
  implements LruLinkedNode<K, V>
{
  /** MRU @private */
  _prev: LruLinkedNode<K, V> = this;
  /** LRU @private */
  _next: LruLinkedNode<K, V> = this;

  /** store all temporary & permanent data @private */
  #map = new Map<K, Metadata<K, V>>();

  /** Max count or weight */
  #max: number = Infinity;
  /** Max as set by user */
  #maxRaw: BytesValue = Infinity;
  /** Time To Live */
  #ttl: number = Infinity;
  /** TTL as set by user */
  #ttlRaw: number | string = Infinity;
  /** TTL accuracy @default ttl/10 */
  #ttlAccuracy: number = 0;
  /** TTL accuracy as set by user */
  #ttlAccuracyRaw?: number | string = undefined;
  /** Force TTL check on every get() */
  #forceTTL: boolean = false;

  /** defaultResolver */
  #defaultResolver?: Resolver<K, V, ResolverArgs> = undefined;
  /** OnDelete callback */
  #onDeleted?: OnDeleted<K, V> = undefined;

  /** Total entries weight */
  #weight: number = 0;
  /** Temporary entries counter */
  #tempCount: number = 0;
  /** Temporary entries weight */
  #tempWeight: number = 0;

  /** Permanent entries counter */
  #permCount: number = 0;
  /** Permanent entries weight */
  #permWeight: number = 0;

  /** TTL Check Interval ID */
  #ttlInterval: NodeJS.Timeout | null = null;

  /** Current TTL tick: use to clean up expired items (performance optimization) */
  #currentTick: number = 0;

  constructor(options?: Options<K, V, ResolverArgs>) {
    if (options != null) {
      const { max, ttl, ttlAccuracy, defaultResolver, onDeleted } = options;

      if (max != null) this.max = max;
      if (ttlAccuracy != null) this.ttlAccuracy = ttlAccuracy;
      if (ttl != null) this.ttl = ttl;
      if (defaultResolver != null) this.defaultResolver = defaultResolver;
      if (onDeleted != null) this.onDeleted = onDeleted;
    }
  }

  /** Get evaluated max value as number */
  get evalMax(): number {
    return this.#max;
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
    this.#max = parsedValue;
    // this.#enforceMaxLimits(); //TODO: enforce max limits on set
  }

  get evalTTL(): number {
    return this.#ttl;
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
    this.#ttl = parsedValue;

    this.#setupTTLInterval();
  }

  get evalTTLAccuracy(): number {
    let ttlAccuracy = this.#ttlAccuracy;
    if (ttlAccuracy === 0) {
      const ttl = this.#ttl;
      ttlAccuracy =
        ttl === Infinity ? TTL_ACCURACY_DEFAULT : Math.ceil(ttl / TTL_ACCURACY_DEFAULT_FRAG);
    }
    return ttlAccuracy;
  }

  get ttlAccuracy(): number | string | undefined {
    return this.#ttlAccuracyRaw;
  }

  set ttlAccuracy(value: number | string | undefined) {
    let parsedValue = 0;
    if (value != null) {
      parsedValue = parseTimeExpression(value);
      if (parsedValue < TIME_UNIT) {
        throw new Error(`Invalid ttlAccuracy value: ${value}. Minimum is ${TIME_UNIT}ms`);
      }
    }
    this.#ttlAccuracy = parsedValue;
    this.#ttlAccuracyRaw = value;
    this.#setupTTLInterval();
  }

  #setupTTLInterval() {
    // Clear previous interval
    if (this.#ttlInterval != null) clearInterval(this.#ttlInterval);
    if (this.#ttl === Infinity) return;

    const ttlAccuracy = this.evalTTLAccuracy;
    if (ttlAccuracy === Infinity)
      throw new Error(
        `Invalid ttlAccuracy value: cannot be Infinity when ttl is set (ttl= ${this.#ttl}).`,
      );

    const intervalId = setInterval(() => {
      this.#ttlCleaner();
    }, ttlAccuracy);
    /** Unref the interval to allow the program to exit if this is the only active timer */
    intervalId.unref?.();
    this.#ttlInterval = intervalId;
  }

  #ttlCleaner() {
    let lru: LruLinkedNode<K, V> = this._next;
    if (lru === this) return; // empty cache, we don't clear time interval for performance.
    // Get accuracy & set next tick interval
    const ttlAccuracy = this.#ttlAccuracy;
    const currentTick = this.#currentTick;
    this.#currentTick += ttlAccuracy;
    // Remove expired items
    const map = this.#map;
    const expires = currentTick - this.#ttl;
    let temporaryItemsWeight = this.#tempWeight;
    let temporaryItemsCount = this.#tempCount;
    let allItemsWeight = this.#weight;
    const deletedRecords: Metadata<K, V>[] = [];
    while (lru !== this && (lru as Metadata<K, V>).lastAccessedAt <= expires) {
      const { weight, isPermanent } = lru as Metadata<K, V>;
      // Remove from map
      map.delete((lru as Metadata<K, V>).key);
      // Update stats
      --temporaryItemsCount;
      temporaryItemsWeight -= weight;
      allItemsWeight -= weight;
      // Collect deleted records for onDeleted callback
      deletedRecords.push(lru as Metadata<K, V>);
      // Next item
      lru = lru._next;
    }
    // detached expired nodes
    this._next = lru;
    lru._prev = this;
    // Update stats
    this.#tempCount = temporaryItemsCount;
    this.#tempWeight = temporaryItemsWeight;
    this.#weight = allItemsWeight;
    // Call onDeleted callbacks
    this.#onDeleted?.(deletedRecords, 'expired');
  }

  /** For(of) */
  *[Symbol.iterator](): IterableIterator<Metadata<K, V>> {
    const it = this.#map.values();
    let v = it.next();
    while (!v.done) {
      const entry = v.value;
      yield entry;
      v = it.next();
    }
  }

  //TODO: async iterator
  // async *[Symbol.asyncIterator](): AsyncIterableIterator<Metadata<K, Awaited<V>>> {
  //   const it = this.#map.values();
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
