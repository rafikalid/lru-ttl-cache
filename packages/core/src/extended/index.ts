import EventEmitter from 'node:events';
import LRU_TTL, { moveToMRU } from '../core';
import { CacheEventReason, ExtendedMetadata, ExtendedResolverResultType, OnDeleted } from './types';
import { LruLinkedNode } from '../core/types';

/**
 * Extended LRU TTL Cache
 * Supports permanent and temporary entries with separate size and weight limits
 */
export default class Extended_LRU_TTL<K, V, ResolverArgs extends any[] = []> extends LRU_TTL<
  K,
  V,
  ResolverArgs,
  ExtendedMetadata<K, V>
> {
  /** Total entries weight */
  #weight: number = 0;
  /** Temporary entries counter */
  #tempSize: number = 0;
  /** Temporary entries weight */
  #tempWeight: number = 0;

  /** Permanent entries counter */
  #permSize: number = 0;
  /** Permanent entries weight */
  #permWeight: number = 0;

  /** onDeleted map */
  onDeletedMap: Map<ExtendedMetadata<K, V>, OnDeleted<K, V>> = new Map();

  /** Event emitter for cache events */
  emitter: EventEmitter = new EventEmitter();

  /** Get the number of permanent items in the cache */
  get permSize(): number {
    return this.#permSize;
  }

  /** Get the number of temporary items in the cache */
  get tempSize(): number {
    return this.#tempSize;
  }

  /** Get the total weight of items in the cache */
  get weight(): number {
    return this.#weight;
  }

  /** Get the total weight of permanent items in the cache */
  get permWeight(): number {
    return this.#permWeight;
  }

  /** Get the total weight of temporary items in the cache */
  get tempWeight(): number {
    return this.#tempWeight;
  }

  /**
   * @override
   * Set a value in the cache with weight and permanence
   */
  set(key: K, value: V, weight = 1, isPermanent = false): ExtendedMetadata<K, V> {
    const map = this._map as Map<K, ExtendedMetadata<K, V>>;
    const now = this._currentTick;
    let entry = map.get(key);
    // Flags to update stats later
    let cacheWeight = this.#weight;
    let tempSize = this.#tempSize;
    let tempWeight = this.#tempWeight;
    let permSize = this.#permSize;
    let permWeight = this.#permWeight;

    if (entry == null) {
      entry = {
        key,
        value,
        weight,
        isPermanent,
        lastAccessedAt: now,
        addedAt: now,
        _next: this,
        _prev: this,
      };
      map.set(key, entry);
      // New entry stats update
      cacheWeight += weight;
      if (isPermanent) {
        ++permSize;
        permWeight += weight;
      } else {
        ++tempSize;
        tempWeight += weight;
      }
    } else {
      const oldIsPermanent = entry.isPermanent;
      const isPermanentUnchanged = oldIsPermanent === isPermanent;
      // Remove from current position in LRU list
      if (!oldIsPermanent) {
        entry._prev._next = entry._next;
        entry._next._prev = entry._prev;
      }
      // Update stats
      const weightDelta = weight - entry.weight;
      cacheWeight += weightDelta;
      if (isPermanentUnchanged) {
        if (isPermanent) {
          permWeight += weightDelta;
        } else {
          tempWeight += weightDelta;
        }
      } else if (oldIsPermanent) {
        --permSize;
        permWeight -= entry.weight;
        ++tempSize;
        tempWeight += weight;
      } else {
        --tempSize;
        tempWeight -= entry.weight;
        ++permSize;
        permWeight += weight;
      }
      // Add entry
      if (entry.value === value && !isPermanentUnchanged) {
        // Update existing entry
        entry.value = value;
        entry.weight = weight;
        entry.lastAccessedAt = now;
      } else {
        // Emit replaced event for old entry
        this.emit('replaced', entry);
        this.#emitDeletedRecord(entry, 'replaced');
        // Create new entry
        entry = {
          key,
          value,
          weight,
          isPermanent,
          lastAccessedAt: now,
          addedAt: now,
          _next: this,
          _prev: this,
        };
        map.set(key, entry);
      }
    }

    // Update stats
    this.#weight = cacheWeight;
    this.#tempSize = tempSize;
    this.#tempWeight = tempWeight;
    this.#permSize = permSize;
    this.#permWeight = permWeight;

    // Append to MRU position if temporary
    if (!isPermanent) {
      entry._prev = this._prev;
      entry._next = this;
      this._prev._next = entry;
      this._prev = entry;
    }

    // Enforce max limits
    if (this.#tempWeight > this._max) this._enforceMaxLimits();
    return entry;
  }

  setPermanent(key: K, value: V, weight?: number): ExtendedMetadata<K, V> {
    return this.set(key, value, weight, true);
  }

  /** @override */
  getMetadata(key: K): ExtendedMetadata<K, V> | undefined {
    const entry = this._map.get(key);
    if (entry == null) return undefined;

    const now = this._currentTick;
    // Update TTL
    entry.lastAccessedAt = now;
    // Move to MRU if temporary
    if (!entry.isPermanent) {
      // Move to MRU
      moveToMRU(this, entry);
    }
    return entry;
  }

  onDeleted(key: K): OnDeleted<K, V> | undefined;
  onDeleted(key: K, onDeleted: OnDeleted<K, V> | null): this;
  onDeleted(key: K, onDeleted?: OnDeleted<K, V> | null): this | OnDeleted<K, V> | undefined {
    const entry = this._map.get(key);
    if (entry == null) {
      if (onDeleted === undefined) {
        return undefined;
      } else if (onDeleted !== null) throw new Error(`Key not found in cache: ${key}`);
    } else if (onDeleted === undefined) {
      return this.onDeletedMap.get(entry);
    } else if (onDeleted === null) {
      this.onDeletedMap.delete(entry);
    } else {
      if (typeof onDeleted !== 'function') {
        throw new TypeError('onDeleted must be a function');
      }
      this.onDeletedMap.set(entry, onDeleted);
    }
    return this;
  }

  clear(): this {
    const deletedRecords = this._map;
    super.clear();
    // Reset stats
    this.#weight = 0;
    this.#tempSize = 0;
    this.#tempWeight = 0;
    this.#permSize = 0;
    this.#permWeight = 0;
    // Call onDeleted callbacks
    this.emit('clearedAll', deletedRecords);
    // Clear onDeleted map
    const onDeletedMap = this.onDeletedMap;
    this.onDeletedMap = new Map();
    // emit clearedAll event for each deleted record
    queueMicrotask(() => {
      onDeletedMap.forEach((onDeleted, record) => {
        onDeleted(record, 'clearedAll');
      });
    });
    return this;
  }

  /** Clear all permanent records from the cache */
  clearPermanentRecords(): this {
    const deletedRecords: ExtendedMetadata<K, V>[] = [];
    const map = this._map;
    map.forEach((entry) => {
      if (entry.isPermanent) {
        deletedRecords.push(entry);
        map.delete(entry.key);
      }
    });
    // Update stats
    this.#weight = this.#tempWeight; // only temporary items remain
    this.#permSize = 0;
    this.#permWeight = 0;
    // Call onDeleted callbacks
    this.emit('clearedPerm', deletedRecords);
    this.#emitDeletedRecords(deletedRecords, 'clearedPerm');
    return this;
  }

  /** Clear all temporary records from the cache */
  clearTemporaryRecords(): this {
    const deletedRecords: ExtendedMetadata<K, V>[] = [];
    let lru: LruLinkedNode<K, V> = this._next;
    const map = this._map;
    while (lru !== this) {
      const entry = lru as ExtendedMetadata<K, V>;
      if (!entry.isPermanent) {
        deletedRecords.push(entry);
        map.delete(entry.key);
      }
      // Break links to help GC
      entry._next = entry;
      entry._prev = entry;
      // Next item
      lru = entry._next;
    }
    // Reset linked list pointers
    this._next = this;
    this._prev = this;
    // Update stats
    this.#weight = this.#permWeight; // only permanent items remain
    this.#tempSize = 0;
    this.#tempWeight = 0;
    // Call onDeleted callbacks
    this.emit('clearedTemp', deletedRecords);
    this.#emitDeletedRecords(deletedRecords, 'clearedTemp');
    return this;
  }

  /** @override */
  protected _removeRecord(entry: ExtendedMetadata<K, V>) {
    // Remove from map
    this._map.delete(entry.key);
    const { weight } = entry;
    this.#weight -= weight;
    if (entry.isPermanent) {
      // Update permanent stats
      --this.#permSize;
      this.#permWeight -= weight;
    } else {
      // Update temporary stats
      --this.#tempSize;
      this.#tempWeight -= weight;
      // Remove from linked list
      entry._prev._next = entry._next;
      entry._next._prev = entry._prev;
    }
    // Call onDeleted callbacks
    this.emit('removed', [entry]);
    this.#emitDeletedRecord(entry, 'removed');
  }

  /** @override */
  protected _enforceMaxLimits() {
    const maxWeight = this._max;
    let temporaryItemsWeight = this.#tempWeight;
    if (temporaryItemsWeight <= maxWeight) return;
    let allItemsWeight = this.#weight;
    let temporaryItemsCount = this.#tempSize;
    const map = this._map;
    const deletedRecords: ExtendedMetadata<K, V>[] = [];
    // Remove all expired items
    let lru = this._next;
    while (temporaryItemsWeight > maxWeight) {
      if (lru === this) {
        // no more items to delete
        temporaryItemsCount = 0;
        temporaryItemsWeight = 0;
        allItemsWeight = 0;
        break;
      }
      const { weight } = lru as ExtendedMetadata<K, V>;
      // Remove from map
      map.delete((lru as ExtendedMetadata<K, V>).key);
      // Update stats
      --temporaryItemsCount;
      temporaryItemsWeight -= weight;
      allItemsWeight -= weight;
      // Collect deleted records for onDeleted callback
      deletedRecords.push(lru as ExtendedMetadata<K, V>);
      // Break links to help GC
      lru._next = lru;
      lru._prev = lru;
      // Next item
      lru = lru._next;
    }
    // detached evicted nodes
    this._next = lru;
    lru._prev = this;
    // Update stats
    this.#tempSize = temporaryItemsCount;
    this.#tempWeight = temporaryItemsWeight;
    this.#weight = allItemsWeight;
    // Call onDeleted callbacks
    this.emit('evicted', deletedRecords);
    // emit evicted event for each deleted record
    this.#emitDeletedRecords(deletedRecords, 'evicted');
  }

  /** @override */
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
    let temporaryItemsWeight = this.#tempWeight;
    let temporaryItemsCount = this.#tempSize;
    let allItemsWeight = this.#weight;
    const deletedRecords: ExtendedMetadata<K, V>[] = [];
    while (lru !== this && (lru as ExtendedMetadata<K, V>).lastAccessedAt <= expires) {
      const { weight } = lru as ExtendedMetadata<K, V>;
      // Remove from map
      map.delete((lru as ExtendedMetadata<K, V>).key);
      // Update stats
      --temporaryItemsCount;
      temporaryItemsWeight -= weight;
      allItemsWeight -= weight;
      // Collect deleted records for onDeleted callback
      deletedRecords.push(lru as ExtendedMetadata<K, V>);
      // Break links to help GC
      lru._next = lru;
      lru._prev = lru;
      // Next item
      lru = lru._next;
    }
    // detached expired nodes
    this._next = lru;
    lru._prev = this;
    // Update stats
    this.#tempSize = temporaryItemsCount;
    this.#tempWeight = temporaryItemsWeight;
    this.#weight = allItemsWeight;
    // Call onDeleted callbacks
    this.emit('expired', deletedRecords);
    this.#emitDeletedRecords(deletedRecords, 'expired');
  }

  /** Override */
  protected _setResolvedValue(
    key: K,
    { value, weight, isPermanent, onDeleted }: ExtendedResolverResultType<K, V>,
  ): ExtendedMetadata<K, V> {
    const m = this.set(key, value, weight, isPermanent);
    if (onDeleted) {
      this.onDeleted(key, onDeleted);
    }
    return m;
  }

  /** Emit events related to cache operations */
  emit(
    reason: 'expired' | 'evicted' | 'removed' | 'clearedTemp' | 'clearedPerm',
    records: ExtendedMetadata<K, V>[],
  ): void;
  emit(reason: 'replaced', deletedRecord: ExtendedMetadata<K, V>): void;
  emit(reason: 'clearedAll', deletedRecords: Map<K, ExtendedMetadata<K, V>>): void;
  emit(reason: CacheEventReason, ...args: any[]): void {
    this.emitter.emit(reason, ...args);
  }

  once(
    reason: 'expired' | 'evicted' | 'removed' | 'clearedTemp' | 'clearedPerm',
    listener: (records: ExtendedMetadata<K, V>[]) => void,
  ): void;
  once(reason: 'replaced', listener: (deletedRecord: ExtendedMetadata<K, V>) => void): void;
  once(
    reason: 'clearedAll',
    listener: (deletedRecords: Map<K, ExtendedMetadata<K, V>>) => void,
  ): void;
  once(reason: CacheEventReason, listener: (records: any) => void): void {
    this.emitter.once(reason, listener);
  }

  on(
    reason: 'expired' | 'evicted' | 'removed' | 'clearedTemp' | 'clearedPerm',
    listener: (records: ExtendedMetadata<K, V>[]) => void,
  ): void;
  on(reason: 'replaced', listener: (deletedRecord: ExtendedMetadata<K, V>) => void): void;
  on(
    reason: 'clearedAll',
    listener: (deletedRecords: Map<K, ExtendedMetadata<K, V>>) => void,
  ): void;
  on(reason: CacheEventReason, listener: (records: any) => void): void {
    this.emitter.on(reason, listener);
  }

  off(reason: CacheEventReason, listener: (records: any) => void): void {
    this.emitter.off(reason, listener);
  }

  #emitDeletedRecords(records: ExtendedMetadata<K, V>[], reason: CacheEventReason): void {
    const onDeletedMap = this.onDeletedMap;
    queueMicrotask(() => {
      records.forEach((record) => {
        const onDeleted = onDeletedMap.get(record);
        if (onDeleted) {
          onDeleted(record, reason);
          onDeletedMap.delete(record);
        }
      });
    });
  }
  #emitDeletedRecord(entry: ExtendedMetadata<K, V>, reason: CacheEventReason): void {
    const onDeleted = this.onDeletedMap.get(entry);
    if (onDeleted) {
      this.onDeletedMap.delete(entry);
      // Call old onDeleted callback
      queueMicrotask(() => {
        onDeleted(entry, reason);
      });
    }
  }
}
