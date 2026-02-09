import { BytesValue, parseBytes } from '../utils/bytes-parser';
import { parseTimeExpression } from '../utils/time-parser';
import { Metadata, Options, Resolver, ResolverResultType } from './types';

export const TTL_ACCURACY_DEFAULT_FRAG = 5;
export const TTL_ACCURACY_DEFAULT = 1000; // 1s
export const TTL_ACCURACY_DEFAULT_MIN = 500; // ms
export const TTL_ACCURACY_MIN = 100; // ms

const TTL_FINALIZATION_REGISTRY = new FinalizationRegistry((intervalId: NodeJS.Timeout) => {
  clearInterval(intervalId);
});

export default class LRU_TTL<
  K = any,
  V = any,
  ResolverArgs extends any[] = any[],
  M extends Metadata<V> = Metadata<V>,
> extends Map<K, M> {
  /** Max count or weight */
  protected _max: number = Infinity;
  /** Max as set by user */
  #maxRaw: BytesValue = Infinity;
  /** Time To Live */
  protected _ttl: number = Infinity;
  /** TTL as set by user */
  #ttlRaw: number | string = Infinity;
  /** TTL accuracy @default ttl/10 */
  protected _ttlAccuracy: number = TTL_ACCURACY_DEFAULT;
  /** TTL accuracy as set by user */
  #ttlAccuracyRaw?: number | string = undefined;

  /** defaultResolver */
  #defaultResolver?: Resolver<K, V, ResolverArgs> = undefined;

  /** TTL Check Interval ID */
  #ttlInterval: NodeJS.Timeout | null = null;

  /** Current TTL tick: use to clean up expired items (performance optimization) */
  protected _currentTick: number = Date.now();

  constructor(options?: Options<K, V>) {
    super();
    if (options != null) {
      const { max, ttl, ttlAccuracy } = options;

      if (max != null) this.max = max;
      if (ttlAccuracy != null) this.ttlAccuracy = ttlAccuracy;
      if (ttl != null) this.ttl = ttl;
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
    if (super.size > 0) this._enforceMaxLimits();
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
    this.#initTtlAccuracy();
    this.#setupTTLInterval();
  }

  /** Get TTL accuracy as set by user as number or string */
  get ttlAccuracy(): number | string | undefined {
    return this.#ttlAccuracyRaw ?? this._ttlAccuracy;
  }

  get evalTtlAccuracy(): number {
    return this._ttlAccuracy;
  }

  /** Set the accuracy of the TTL checking interval */
  set ttlAccuracy(value: number | string | undefined) {
    this.#ttlAccuracyRaw = value;
    this.#initTtlAccuracy();
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

  /** Get the least recently used temporary record in the cache */
  get lru(): V | undefined {
    return super.values().next().value?.value;
  }

  get lruKey(): K | undefined {
    return super.keys().next().value;
  }

  get lruMetadata(): M | undefined {
    return super.values().next().value;
  }

  //@ts-ignore
  get(key: K): V | undefined {
    const metadata = super.get(key);
    if (metadata == null) return undefined;
    const value = metadata.value;
    super.delete(key);
    super.set(key, {
      value,
      lastAccessedAt: this._currentTick,
    } as M);
    return value;
  }

  peek(key: K): V | undefined {
    return super.get(key)?.value;
  }

  peekMetadata(key: K): M | undefined {
    return super.get(key);
  }

  //@ts-ignore
  set(key: K, value: V): this {
    const now = this._currentTick;
    const metadata: M = {
      value,
      lastAccessedAt: now,
    } as M;
    super.delete(key);
    super.set(key, metadata);
    if (super.size > this._max) {
      // remove LRU item if max size exceeded
      super.delete(super.keys().next().value!);
    }
    return this;
  }

  setFrom(
    src:
      | LRU_TTL<K, V, ResolverArgs, M>
      | Map<K, V>
      | Iterator<[K, V]>
      | Iterable<[K, V]>
      | [K, V][],
  ) {
    if (src instanceof LRU_TTL) {
      const dropCount = src.size - this._max;
      const entries = dropCount > 0 ? src.entries().drop(dropCount) : src.entries();
      for (const [key, value] of entries) {
        this.set(key, value.value);
      }
    } else if (src instanceof Map) {
      const dropCount = src.size - this._max;
      const entries = dropCount > 0 ? src.entries().drop(dropCount) : src.entries();
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    } else if (typeof src !== 'object' || src == null) {
      throw new Error('Invalid source type for LRU_TTL.from()');
    } else if (Reflect.has(src, Symbol.iterator)) {
      for (const entry of src as Iterable<[K, V]>) {
        if (!Array.isArray(entry) || entry.length !== 2) {
          throw new Error(
            `Invalid entry in iterable source: ${entry}, expected [key, value] tuple.`,
          );
        }
        const [key, value] = entry;
        this.set(key, value);
      }
    } else if (typeof (src as Iterator<[K, V]>).next === 'function') {
      const iterator = src as Iterator<[K, V]>;
      let result = iterator.next();
      while (!result.done) {
        const entry = result.value;
        if (!Array.isArray(entry) || entry.length !== 2) {
          throw new Error(
            `Invalid entry in iterable source: ${entry}, expected [key, value] tuple.`,
          );
        }
        const [key, value] = entry;
        this.set(key, value);
        result = iterator.next();
      }
    } else {
      throw new Error('Invalid source type for LRU_TTL.from()');
    }
    return this;
  }

  popLRU(): [K, V, M] | undefined {
    const entry = super.entries().next().value;
    if (entry == null) return undefined;
    const [lruKey, lruMetadata] = entry;
    super.delete(lruKey);
    return [lruKey, lruMetadata.value, lruMetadata];
  }

  pop(key: K): V | undefined {
    const metadata = super.get(key);
    if (metadata == null) return undefined;
    super.delete(key);
    return metadata.value;
  }

  resolve(key: K, resolver?: Resolver<K, V, ResolverArgs>, ...args: ResolverArgs): V | undefined {
    return this.resolveMetadata(key, resolver, ...args)?.value;
  }

  getOrInsert(
    key: K,
    resolver?: Resolver<K, V, ResolverArgs>,
    ...args: ResolverArgs
  ): V | undefined {
    return this.resolveMetadata(key, resolver, ...args)?.value;
  }

  resolveMetadata(
    key: K,
    resolver?: Resolver<K, V, ResolverArgs>,
    ...args: ResolverArgs
  ): M | undefined {
    const entry = super.get(key);
    if (entry != null) return entry;

    const resolverFx = resolver ?? this.#defaultResolver;
    if (typeof resolverFx !== 'function')
      throw new Error(`No resolver function provided for key: ${key}`);

    const value = resolverFx(key, ...args);
    if (value == null) {
      return undefined;
    }

    if (value instanceof Promise) {
      // When resolved, update the entry
      const pendingValue: Promise<V> = value
        .then((resolvedValue) => {
          const isPendingValueUnchanged = super.get(key)?.value === pendingValue;
          if (isPendingValueUnchanged) {
            if (resolvedValue == null) {
              this.delete(key);
            } else {
              this._setResolvedValue(key, resolvedValue as ResolverResultType<V>);
            }
          }
          return resolvedValue?.value as V;
        })
        .catch((err) => {
          this.delete(key);
          throw err;
        });

      this.set(key, pendingValue as V);
    } else {
      // Sync resolver
      this._setResolvedValue(key, value as ResolverResultType<V>);
    }
    return super.get(key)!;
  }

  protected _setResolvedValue(key: K, result: ResolverResultType<V>): void {
    this.set(key, result.value);
  }

  /**
   * Destroy the cache and clear all resources.
   * Use this to immediatly clean up intervals and references.
   * without this, the TTL interval (when using TTL) will remain active several minutes until garbage collected.
   * Optional but recommended to enhance performance and prevent memory leaks.
   * After calling this method, the cache instance should not be used anymore.
   */
  [Symbol.dispose](): void {
    this.clear();
    if (this.#ttlInterval != null) {
      clearInterval(this.#ttlInterval);
      this.#ttlInterval = null;
    }
    TTL_FINALIZATION_REGISTRY.unregister(this);
  }

  destroy(): void {
    this[Symbol.dispose]();
  }

  dispose(): void {
    this[Symbol.dispose]();
  }

  #setupTTLInterval() {
    // Clear previous interval
    if (this.#ttlInterval != null) clearInterval(this.#ttlInterval);
    if (this._ttl === Infinity) return;

    const ttlAccuracy = this._ttlAccuracy;
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
    // stop scoped caches
    TTL_FINALIZATION_REGISTRY.register(this, intervalId);
  }

  protected _ttlCleaner() {
    const now = Date.now();
    this._currentTick = now;
    const ttl = this._ttl;
    for (const [key, metadata] of super.entries()) {
      if (now - metadata.lastAccessedAt > ttl) {
        super.delete(key);
      } else {
        // Since Map is ordered, we can stop checking once we find an item that is not expired
        break;
      }
    }
  }

  protected _enforceMaxLimits() {
    const max = this._max;
    const countToRemove = super.size - max;
    const iterator = super.keys();
    for (let i = 0; i < countToRemove; i++) {
      super.delete(iterator.next().value!);
    }
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<
    [K, Omit<M, 'value'> & { value: Awaited<M['value']> }]
  > {
    type AwaitedM = Omit<M, 'value'> & { value: Awaited<M['value']> };
    // Serve resolved entries immediately, and collect pending promises
    let pendingPromises: Promise<[K, M]>[] = [];
    const mapPendingPromises = new Map<K, Promise<[K, M]>>();
    for (const [key, entry] of this) {
      const { value } = entry;
      if (value instanceof Promise) {
        const pendingPromise: Promise<[K, M]> = value.then(() => [key, super.get(key)!]);
        pendingPromises.push(pendingPromise);
        mapPendingPromises.set(key, pendingPromise);
      } else {
        yield [key, entry as AwaitedM];
      }
    }

    // Await and yield pending promises
    while (pendingPromises.length > 0) {
      const settledEntry = await Promise.race(pendingPromises);
      yield settledEntry as [K, AwaitedM];
      // Remove the settled promise from the array
      const settledPromise = mapPendingPromises.get(settledEntry[0])!;
      pendingPromises = pendingPromises.filter((p) => p !== settledPromise);
      mapPendingPromises.delete(settledEntry[0]);
    }
  }

  #initTtlAccuracy() {
    let ttlAccuracy = this.#ttlAccuracyRaw;
    let parsedValue = 0;
    if (!ttlAccuracy) {
      const ttl = this._ttl;
      parsedValue =
        ttl === Infinity
          ? TTL_ACCURACY_DEFAULT
          : Math.max(Math.ceil(ttl / TTL_ACCURACY_DEFAULT_FRAG), TTL_ACCURACY_DEFAULT_MIN);
    } else if (typeof ttlAccuracy === 'string') {
      parsedValue = parseTimeExpression(ttlAccuracy);
    } else if (typeof ttlAccuracy === 'number') {
      parsedValue = ttlAccuracy;
    } else {
      throw new Error(`Invalid ttlAccuracy type: ${typeof ttlAccuracy}`);
    }
    if (parsedValue < TTL_ACCURACY_MIN) {
      throw new Error(
        `Invalid ttlAccuracy value: ${ttlAccuracy}. Minimum is ${TTL_ACCURACY_MIN}ms`,
      );
    }
    this._ttlAccuracy = parsedValue;
  }

  /** Create a new LRU_TTL instance from various sources */
  static from<K, V, ResolverArgs extends any[], M extends Metadata<V>>(
    src:
      | LRU_TTL<K, V, ResolverArgs, M>
      | Map<K, V>
      | Iterable<[K, V]>
      | Iterator<[K, V]>
      | [K, V][],
    options?: Options<K, V>,
  ): LRU_TTL<K, V, ResolverArgs, M> {
    const cache = new LRU_TTL<K, V, ResolverArgs, M>(options);
    cache.setFrom(src);
    return cache;
  }
}
