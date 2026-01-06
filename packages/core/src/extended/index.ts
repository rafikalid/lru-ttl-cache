import EventEmitter from 'node:events';
import LRU_TTL, { moveToMRU } from '../core';
import { ExtendedMetadata } from './types';
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

  #events: EventEmitter = new EventEmitter();

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
  set(key: K, value: V, weight = 1, isPermanent = false): this {
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
        this.emit('replaced', entry);
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
    return this;
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
    return this;
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
  }

  /** Emit events related to cache operations */
  emit(
    reason: 'expired' | 'evicted' | 'removed' | 'clearedTemp' | 'clearedPerm',
    records: ExtendedMetadata<K, V>[],
  ): void;
  emit(reason: 'replaced', deletedRecord: ExtendedMetadata<K, V>): void;
  emit(reason: 'clearedAll', deletedRecords: Map<K, ExtendedMetadata<K, V>>): void;
  emit(reason: string, records: unknown): void {
    this.#events.emit(reason, records);
  }
}
