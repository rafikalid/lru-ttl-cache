import { parseUnit, UnitValue } from './utils/unit-parser';
import {
	ItemMetadata,
	Linked,
	LinkedNode,
	Maybe,
	Node,
	OnDeletedCb,
	OnDeleteRaison,
	Options,
	RequireAllKeys,
	UpsertCb,
	UpsertResult
} from './types';
import MS from 'timestring';

/**
 * LRU MRU TTL Cache
 * @example const cache= new LRU_TTL({options});
 * @example const cache= new LRU_TTL<string, number>({options});
 *
 * if you use an async "upsert", mark your value as Promise
 * @example const cache= new LRU_TTL<string, Promise<number>>({options});
 */
export default class LRU_TTL<K = any, V = any, UpsertArgs = any>
	implements Linked<K, V>
{
	/**
	 * Tail: Least Recently Used item (oldest)
	 * @private
	 */
	_after: LinkedNode<K, V> = this;
	/**
	 * Head: Most Recently Used item (newest)
	 * @private
	 */
	_before: LinkedNode<K, V> = this;

	/** Internal hash map */
	#map = new Map<K, Node<K, V>>();
	/** Max count or weight */
	#max = Infinity;
	/** Max as set by user */
	#maxRaw: UnitValue = Infinity;
	/** Time To Live */
	#ttl = Infinity;
	/** TTL as set by user */
	#ttlRaw: number | string = Infinity;
	/** TTL resolution */
	#ttlResolution: number | undefined = undefined;
	/** TTL resolution */
	#ttlResolutionRaw: number | string | undefined = undefined;
	/** On upsert callback */
	#onUpsert: UpsertCb<K, V, UpsertArgs> | undefined = undefined;
	/** OnDelete callback */
	#onDeleted: OnDeletedCb<K, V> | undefined = undefined;

	/** Temporary entries count */
	#tempCount = 0;
	/** Temporary entries weight */
	#tempWeight = 0;
	/** Locked entries count */
	#lockedCount = 0;
	/** Locked entries weight */
	#lockedWeight = 0;
	/** Total weight */
	#weight = 0;

	/** Current timer value */
	#now = 0;
	/** Remove any: item.at < expires */
	#expires = -1;
	/** Timer interval reference */
	#timerRef: NodeJS.Timeout | undefined = undefined;

	/**
	 * Keep this value to "undefined"
	 * Added for performance purpose only
	 */
	readonly value = undefined;
	/**
	 * Keep this value to "undefined"
	 * Added for performance purpose only
	 */
	readonly key = undefined;

	constructor(options?: Options<K, V, UpsertArgs>) {
		if (options != null) {
			if (options.max != null) this.max = options.max;
			if (options.ttl != null) this.ttl = options.ttl;
			if (Reflect.has(options, 'ttlResolution'))
				this.ttlResolution = options.ttlResolution;
			if (Reflect.has(options, 'onUpsert'))
				this.onUpsert = options.onUpsert;
			if (Reflect.has(options, 'onDeleted'))
				this.onDeleted = options.onDeleted;
		}
	}

	/** Get evaluated max */
	get evalMax() {
		return this.#max;
	}
	/** Get max items or max weight */
	get max() {
		return this.#maxRaw;
	}
	/**
	 * Set max items or max weight
	 * @example cache.max= 700
	 * @example cache.max= '7k'
	 * @example cache.max= '7kB'
	 */
	set max(max: UnitValue) {
		let evalMax = max;
		if (typeof evalMax === 'number') {
			if (evalMax <= 0)
				throw new Error(`Cache: Illegal "max" value: ${max}`);
		} else if (typeof evalMax === 'string') {
			evalMax = parseUnit(evalMax);
		} else
			throw new Error('Cache: "max" expected positive number or string');
		this.#maxRaw = max;
		this.#max = evalMax;
	}

	/** Get evaluated max */
	get evalTtl() {
		return this.#ttl;
	}
	/** Get current ttl in milliseconds */
	get ttl() {
		return this.#ttlRaw;
	}
	/**
	 * Set ttl
	 * @example cache.ttl= 2000; means 2s
	 * @example cache.ttl= '2s';
	 * @example cache.ttl= '2h 25min';
	 */
	set ttl(ttl: number | string) {
		// Check/convert ttl
		const value = typeof ttl === 'string' ? MS(ttl, 'ms') : ttl;
		const isRightInt =
			(Number.isSafeInteger(value) && value > 0) || value === Infinity;
		if (!isRightInt) {
			throw new Error('Cache: "ttl" expected string or positive integer');
		}
		this.#ttlRaw = ttl;
		this.#ttl = value;

		// Adjust interval
		if (this.#timerRef != null) clearInterval(this.#timerRef);
		if (Number.isFinite(value)) {
			// Adjust ttl expires
			const ttlResolution = this.evalTtlResolution;
			this.#expires = this.#now - Math.floor(value / ttlResolution);
			// Run timer
			this.#timerRef = setInterval(
				() => this.#ttlCleaner(),
				ttlResolution
			);
			// "Timer.unref" Doesn't exist on browsers
			// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
			this.#timerRef.unref?.(); // Useful for Node to prevent timer from blocking app when exit
		}
	}

	/**
	 * Get effective ttl-resolution
	 */
	get evalTtlResolution() {
		// TTL resolution
		let ttlResolution = this.#ttlResolution;
		if (ttlResolution == null || ttlResolution > this.#ttl) {
			ttlResolution = Math.ceil(this.#ttl / 10);
		}

		return ttlResolution;
	}
	/** Get ttl resolution */
	get ttlResolution() {
		return this.#ttlResolutionRaw;
	}
	set ttlResolution(value: number | string | undefined) {
		let resolutionValue: number | undefined;
		if (value == null) resolutionValue = undefined;
		else if (typeof value === 'string') resolutionValue = MS(value, 'ms');
		else if (Number.isSafeInteger(value) && value > 0)
			resolutionValue = value;
		else
			throw new Error(
				'Cache: "ttlResolution" expected positive integer or string'
			);
		this.#ttlResolutionRaw = value;
		this.#ttlResolution = resolutionValue;
		if (this.#ttl !== Infinity) this.ttl = this.#ttl; // Adjust interval timer
	}

	/** Get on upsert handler */
	get onUpsert() {
		return this.#onUpsert;
	}
	set onUpsert(handler: UpsertCb<K, V, UpsertArgs> | undefined) {
		if (typeof handler === 'function' || handler == null)
			this.#onUpsert = handler;
		else throw new Error('Cache: Expected function for "onUpsert"');
	}

	/** Get OnDelete Callback */
	get onDeleted() {
		return this.#onDeleted;
	}
	set onDeleted(handler: OnDeletedCb<K, V> | undefined) {
		if (typeof handler === 'function' || handler == null)
			this.#onDeleted = handler;
		else throw new Error('Cache: Expected function for "onDeleted"');
	}

	/** Get total items in the cache */
	get size() {
		return this.#map.size;
	}
	/** Get total items in the cache */
	get count() {
		return this.#map.size;
	}
	/** Get locked items count */
	get lockedCount() {
		return this.#lockedCount;
	}
	/** Get temporary entries count */
	get tempCount() {
		return this.#tempCount;
	}
	/** Get total weight */
	get weight() {
		return this.#weight;
	}
	/** Get temporary items weight */
	get tempWeight() {
		return this.#tempWeight;
	}
	/** Get locked items weight */
	get lockedWeight() {
		return this.#lockedWeight;
	}

	/**
	 * Get Least Recently Used item metadata
	 * If the cache is empty, this will return the cache itself
	 * @example const lru_value= cache.lru.value; // undefined if the cache is empty or lru value is "undefined"
	 * @example const lru_key= cache.lru.key; // undefined if cache empty or the key is "undefined"
	 */
	get lru(): LinkedNode<K, V> {
		return this._after;
	}

	/**
	 * Get Most Recently Used item's metadata
	 * If the cache is empty, this will return the cache itself
	 * @example const mru_value= cache.mru.value;
	 * @example const mru_key= cache.mru.key;
	 */
	get mru(): LinkedNode<K, V> {
		return this._before;
	}

	/** Check if a key is in the cache */
	has(key: K) {
		return this.#map.has(key);
	}

	/**
	 * Add value to the cache
	 * @example cache.set(key, value)
	 * @example cache.set(key, value, weight)
	 * @example cache.set(key, value, weight, isLocked)
	 */
	set(key: K, value: Maybe<V>, weight = 1, isLocked = false): this {
		//* Add value
		const map = this.#map;
		const item = map.get(key);
		if (item != null) {
			//* Adjust cache weight
			const weightDelta = weight - item.weight;
			this.#weight += weightDelta;
			//* Check if state changed (temp to locked or vers versa)
			if (isLocked) {
				if (item.locked) {
					// Keep locked
					this.#lockedWeight += weightDelta;
				} else {
					// temporary to locked
					this.#lockedWeight += weight;
					this.#tempWeight -= item.weight;
					--this.#tempCount;
					++this.#lockedCount;
					// Detach from linked list
					const nextItem = item._after;
					const prevItem = item._before;
					prevItem._after = nextItem;
					nextItem._before = prevItem;
				}
			} else if (item.locked) {
				// changed from locked to temporary
				this.#tempWeight += weight;
				this.#lockedWeight -= item.weight;
				++this.#tempCount;
				--this.#lockedCount;
				// Append to the linked list
				const head = this._before;
				this._before = item;
				head._after = item;
				item._before = head;
				item._after = this;
			} else {
				// Keep temporary
				this.#tempWeight += weightDelta;
			}
			//* Set new values
			if (item.value !== value) {
				item.value = value;
				item.AddedAt = this.#now;
			}
			item.weight = weight;
			item.locked = isLocked;
			item.lastAccess = this.#now; // Used for TTL
		} else {
			// New item
			const previousHead = this._before;
			const newItem: Node<K, V> = {
				key,
				value,
				weight,
				locked: isLocked,
				AddedAt: this.#now,
				lastAccess: this.#now,
				_before: previousHead,
				_after: this
			};
			map.set(key, newItem);
			this.#weight += weight;
			if (newItem.locked) {
				this.#lockedWeight += weight;
				++this.#lockedCount;
			} else {
				// Append to linked list
				previousHead._after = newItem;
				this._before = newItem;
				// Weight
				this.#tempWeight += weight;
				++this.#tempCount;
			}
		}
		//* Apply LRU
		if (this.#tempWeight > this.#max && this._before !== this) {
			let head = this._before;
			const max = this.#max;
			let tempWeight = this.#tempWeight;
			let tempCount = this.#tempCount;
			let totalWeight = this.#weight;
			do {
				map.delete((head as Node<K, V>).key);
				const weight = head.weight;
				tempWeight -= weight;
				totalWeight -= weight;
				--tempCount;
				this.#onDeleted?.(
					head as ItemMetadata<K, V>,
					OnDeleteRaison.LRU
				);
				head = head._before;
			} while (tempWeight > max && head !== this);
			// Detach all removed items
			this._before = head;
			head._after = this;
			// Adjust weight
			this.#tempWeight = tempWeight;
			this.#weight = totalWeight;
			this.#tempCount = tempCount;
		}
		return this;
	}

	/**
	 * Add locked item to the cache
	 * Locked item will not removed until doing it manually
	 */
	setLocked(key: K, value: Maybe<V>, weight = 1): this {
		return this.set(key, value, weight, true);
	}

	/**
	 * Get element from the cache
	 * Clear TTL timer for this element to 0
	 * Set element as Most recently used item
	 */
	get(key: K): Maybe<V> {
		const item = this.#map.get(key);
		if (item != null) {
			// Update ttl
			item.lastAccess = this.#now;
			/**
			 * Check this element is not locked
			 * and not the MRU
			 */
			const doRefreshLinkedItem = !item.locked && item._after !== this;
			if (doRefreshLinkedItem) {
				// Detach from current position in linked list
				const prev = item._before;
				const next = item._after;
				prev._after = next;
				next._before = prev;
				// Move to linked list's head
				const head = this._before;
				this._before = item;
				head._after = item;
				item._before = head;
				item._after = this;
			}
			return item.value;
		}
		return undefined;
	}

	/**
	 * Get element from the cache without changing it's timeout and LRU
	 */
	peek(key: K): Maybe<V> {
		return this.#map.get(key)?.value;
	}

	/** Get meta data without affecting LRU and TTL */
	getMetadata(key: K): ItemMetadata<K, V> | undefined {
		return this.#map.get(key);
	}

	/** Get and remove the Least Recently Used element */
	popLRU(): ItemMetadata<K, V> | undefined {
		const item = this._after;
		if (item !== this) {
			const key = (item as Node<K, V>).key;
			return this.delete(key);
		}
		return undefined;
	}

	/** Get and remove the Most Recently Used element */
	popMRU(): ItemMetadata<K, V> | undefined {
		const item = this._before;
		if (item !== this) {
			const key = (item as Node<K, V>).key;
			return this.delete(key);
		}
		return undefined;
	}

	/**
	 * Delete element from the cache
	 * @return {item} if the item exists before being removed
	 */
	delete(key: K): ItemMetadata<K, V> | undefined {
		const item = this.#map.get(key);
		if (item != null) {
			// Remove from map
			this.#map.delete(item.key);
			// Remove from linked list
			const prev = item._before;
			const next = item._after;
			prev._after = next;
			next._before = prev;
			// Weight
			const weight = item.weight;
			this.#weight -= weight;
			if (item.locked) {
				this.#lockedWeight -= weight;
				--this.#lockedCount;
			} else {
				this.#tempWeight -= weight;
				--this.#tempCount;
			}
			this.#onDeleted?.(item, OnDeleteRaison.USER);
			return item;
		}
		return undefined;
	}

	/**
	 * Upsert item
	 * Use "onUpsert" to create item if missing
	 * @example cache.upsert(key);
	 * @example cache.upsert(key, additionInfo); // Add additional info if "onUpsert" expecting it
	 */
	upsert(key: K, additionalArgs: UpsertArgs): Maybe<V> {
		const value = this.get(key);
		if (value != null) return value;
		else if (typeof this.#onUpsert !== 'function')
			throw new Error('Cache: Missing "onUpsert" handler');
		else {
			const res = this.#onUpsert(key, additionalArgs);
			if (res == null) {
				this.delete(key);
				return undefined;
			} else if (res instanceof Promise) {
				const pendingValue = res.then(
					(v: UpsertResult<V> | undefined) => {
						const valueNotChanged =
							pendingValue === this.#map.get(key)?.value;
						if (valueNotChanged) {
							if (v?.value == null)
								this.delete(key); // fetching canceled
							else
								this.set(
									key,
									v.value,
									v.weight ?? 1,
									!!v.locked
								);
						}
						return v?.value;
					}
				);
				this.set(key, pendingValue as V);
				return pendingValue as Maybe<V>;
			} else {
				this.set(key, res.value, res.weight ?? 1, !!res.locked);
				return res.value;
			}
		}
	}

	/** Remove all temporary items */
	clearTemp(): this {
		if (this.#lockedCount === 0) this.clearAll();
		else {
			let item = this._after;
			const map = this.#map;
			while (item !== this) {
				map.delete((item as Node<K, V>).key);
				this.#onDeleted?.(
					item as ItemMetadata<K, V>,
					OnDeleteRaison.CLEAR
				);
				item = (item as Node<K, V>)._after;
			}
			this._after = this._before = this; // Empty linked list
			this.#weight = this.#lockedWeight; // Keep only locked weight
			this.#tempWeight = 0;
			this.#tempCount = 0;
		}
		return this;
	}
	/** Remove all locked items */
	clearLocked(): this {
		if (this.#tempCount === 0) this.clearAll();
		else {
			this.#map.forEach((item, key, map) => {
				if (item.locked) {
					map.delete(key);
					this.#onDeleted?.(
						item as ItemMetadata<K, V>,
						OnDeleteRaison.CLEAR
					);
				}
			});
			this.#weight = this.#tempWeight; // Keep only temporary items weight
			this.#lockedWeight = 0;
			this.#lockedCount = 0;
		}
		return this;
	}
	/** Remove all items */
	clearAll(): this {
		this.#map.clear();
		this._after = this._before = this; // Empty linked list
		this.#weight = this.#lockedWeight = this.#tempWeight = 0;
		this.#lockedCount = this.#tempCount = 0;
		return this;
	}

	/** Clone cache and all it's entires */
	clone(): LRU_TTL<K, V, UpsertArgs> {
		return LRU_TTL.from(this);
	}

	/** Create cache from LRU_TTL, Map or IterableIterator<[K, V]> */
	static from<K, V, UpsertArgs = unknown>(
		data: LRU_TTL<K, V, UpsertArgs> | Map<K, V> | IterableIterator<[K, V]>
	): LRU_TTL<K, V, UpsertArgs> {
		let cache: LRU_TTL<K, V, UpsertArgs>;
		if (data instanceof LRU_TTL) {
			const options: RequireAllKeys<Options<K, V, UpsertArgs>> = {
				max: data.#max,
				ttl: data.#ttl,
				ttlResolution: data.#ttlResolution,
				onUpsert: data.#onUpsert,
				onDeleted: data.#onDeleted
			};
			cache = new LRU_TTL(options);
		} else {
			cache = new LRU_TTL();
		}
		cache.addAll(data);
		return cache;
	}

	/** Append all items from Map, Cache or Iterator<K, V> */
	addAll(data: LRU_TTL<K, V> | Map<K, V> | IterableIterator<[K, V]>) {
		if (data instanceof LRU_TTL) {
			const it = data.#map.values();
			let p = it.next();
			while (!p.done) {
				const item = p.value;
				this.set(item.key, item.value, item.weight, item.locked);
				p = it.next();
			}
		} else {
			const it = data instanceof Map ? data.entries() : data;
			let p = it.next();
			while (!p.done) {
				const [key, value] = p.value;
				this.set(key, value);
				p = it.next();
			}
		}
	}
	/** Iterate on all metadata */
	metadata() {
		return this.#map.values();
	}
	/** Get entries */
	*entries(): IterableIterator<[K, Maybe<V>]> {
		const it = this.#map.values();
		const p = it.next();
		while (!p.done) {
			const item = p.value;
			yield [item.key, item.value];
		}
	}
	/** Get all keys */
	keys(): IterableIterator<K> {
		return this.#map.keys();
	}
	/** Values */
	*values(): IterableIterator<Maybe<V>> {
		const it = this.#map.values();
		const p = it.next();
		while (!p.done) {
			yield p.value.value;
		}
	}

	/** ForEach */
	forEach<ThisT = any>(
		cb: (
			value: Maybe<V>,
			key: K,
			cache: this,
			metadata: Node<K, V>
		) => void,
		thisArg: ThisT
	) {
		const it = this.#map.values();
		const p = it.next();
		const self: ThisT | this = arguments.length === 1 ? this : thisArg;
		while (!p.done) {
			const e = p.value;
			cb.call(self, e.value, e.key, this, e);
		}
	}

	/** For(of) */
	*[Symbol.iterator]() {
		const it = this.#map.values();
		const v = it.next();
		while (!v.done) {
			const entry = v.value;
			yield [entry.key, entry.value];
		}
	}

	/**
	 * Remove Expired Items using TTL
	 */
	#ttlCleaner() {
		let tail = this._after;
		if (tail === this) return; // No temp item found
		// Remove expired items
		++this.#now;
		const expires = ++this.#expires;
		const map = this.#map;

		let tempWeight = this.#tempWeight;
		let tempCount = this.#tempCount;
		while (tail !== this && (tail as Node<K, V>).lastAccess < expires) {
			tempWeight -= tail.weight;
			--tempCount;
			map.delete((tail as Node<K, V>).key);
			this.#onDeleted?.(tail as ItemMetadata<K, V>, OnDeleteRaison.TTL);
			tail = tail._after;
		}
		this.#tempWeight = tempWeight;
		this.#tempCount = tempCount;
		// detach all removed nodes
		this._after = tail;
		tail._before = this;
	}
}
