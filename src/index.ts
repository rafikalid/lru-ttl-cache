import MS from 'timestring';
import Bytes from 'bytes';

/** Cache Options */
export interface Options<K, V> {
	/**
	 * Max entries as Positive integer
	 * Or max weight as Positive integer
	 * Or max bytes as Positive integer or string
	 * see examples below for each implementation
	 * @default Infinity
	 */
	max?: number | string
	/**
	 * Time to live
	 * @default Infinity
	 */
	ttl?: number | string
	/**
	 * Items will be removed within the interval [ttl, ttl + ttlResolution]
	 * 1 <= ttlResolution <= ttl
	 * @default ttl/10
	 */
	ttlResolution?: number | string
	/**
	 * Upsert callback
	 * Enables to create missing elements when using
	 * "cache::upsert(key)" instead of "cache::get(key)"
	 * Could synchronous or asynchronous
	 * Could return promise
	 * @param {mixed} key - Any javascript type as a key
	 * @param {mixed} additional arguments. could be list of arguments. It's the second argument of "cache.upsert(key, additionalArgs)"
	 */
	onUpsert?: (key: K, additionalArgs?: any[]) => UpsertResult<V> | Promise<UpsertResult<V>>
}

/** Upsert result */
export interface UpsertResult<V> {
	/**
	 * Target value
	 */
	value: V | Promise<V>,
	/**
	 * The weight of the item,
	 * @default 1
	 */
	weight?: number,
	/**
	 * If the item is a temporary or permanent
	 * (means could be removed by the ttl and lru algorithm or not)
	 * @default false
	 */
	isPermanent?: boolean
}

/** Linked Node */
interface LinkedNode<K, V> {
	_next: LinkedNode<K, V>
	_prev: LinkedNode<K, V>
}

/** Item key,value */
interface ItemNode<K, V> {
	/** Target value */
	value: V | Promise<V>
	/** Target key */
	key: K
	/** Object weight */
	weight: number
	/** If the item is permanent */
	isPermanent: boolean
}

/** Item node */
interface Item<K, V> extends LinkedNode<K, V>, ItemNode<K, V> {
	/** last access at interval (For performance instead of timestamp) */
	at: number
}

const DEFAULT_OPTIONS: Options<any, any> = {
	max: Infinity,
	ttl: Infinity,
	ttlResolution: undefined,
	onUpsert: undefined
};

export default class LRU_TTL<K, V> implements LinkedNode<K, V>{
	/** Head: Most Recently Used item (newest) */
	_next: LinkedNode<K, V>;
	/** Tail: Least Recently Used item (oldest) */
	_prev: LinkedNode<K, V>;
	/** Internal hash map */
	#map: Map<K, Item<K, V>> = new Map();
	/** Max weight */
	#max!: number
	/** On upsert callback */
	#onUpsert?: Options<K, V>["onUpsert"]
	/** Temporary entires count */
	#tempLength = 0;
	/** Permanent entries count */
	#permanentLength = 0;
	/** Total items weight */
	#weight = 0;
	/** Temporary items weight */
	#tempWeight = 0;
	/** Permanent items weight */
	#permanentWeight = 0;
	/** TTL */
	#ttl!: number
	/** TTL resolution */
	#ttlResolution!: number
	/** Current interval time */
	#now = 0;
	/** Remove any item that its time is less than this value */
	#ttlExpires = -1;
	/** Timer reference */
	#timerRef?: NodeJS.Timeout = undefined;

	constructor(options: Options<K, V> = DEFAULT_OPTIONS) {
		this.max = options.max ?? Infinity;
		this.ttl = options.ttl ?? Infinity;
		this.onUpsert = options.onUpsert;
		this._next = this._prev = this;
	}

	/** Get max items or max weight */
	get max(): number { return this.#max }
	/** Set max items or max weight */
	set max(max: number | string) {
		if (typeof max === 'number') {
			if (max <= 0) throw new Error(`Cache: Illegal "max" value: ${max}`);
		} else if (typeof max === 'string') {
			max = Bytes.parse(max);
		} else throw new Error(`Cache: "max" expected positive number or string`);
		this.#max = max;
	}

	/** Get current ttl in milliseconds */
	get ttl(): number { return this.#ttl }
	/** Set ttl */
	set ttl(ttl: number | string) {
		// Check/convert ttl
		if (typeof ttl === 'string') ttl = MS(ttl, 'ms');
		if (Number.isSafeInteger(ttl) && ttl > 0 || ttl === Infinity) { }
		else throw new Error(`Cache: "ttl" expected string or positive integer`);
		this.#ttl = ttl;
		// Adjust interval
		if (this.#timerRef != null) clearInterval(this.#timerRef);
		if (Number.isFinite(ttl)) {
			// TTL resolution
			let ttlResolution = this.#ttlResolution;
			if (ttlResolution == null || ttlResolution > ttl) {
				ttlResolution = this.#ttlResolution = Math.ceil(ttl / 10);
			}
			// Adjust ttl expires
			this.#ttlExpires = this.#now - Math.floor(ttl / ttlResolution);
			// Run timer
			this.#timerRef = setInterval(this.#ttlCleaner.bind(this), ttlResolution);
			this.#timerRef.unref?.(); // Useful for Node to prevent timer from blocking app when exit
		}
	}

	/** Get ttl resolution */
	get ttlResolution() { return this.#ttlResolution }
	set ttlResolution(value: number | string) {
		if (typeof value === 'string') value = MS(value, 'ms');
		if (Number.isSafeInteger(value) && value > 0) { }
		else throw new Error(`Cache: "ttlResolution" expected positive integer or string`);
		this.#ttlResolution = value;
		if (this.#ttl != null)
			this.ttl = this.#ttl; // Adjust interval timer
	}

	/** Get on upsert handler */
	get onUpsert() { return this.#onUpsert; }
	set onUpsert(handler: Options<K, V>["onUpsert"]) {
		if (typeof handler === 'function' || handler == null)
			this.#onUpsert = handler;
		else
			throw new Error('Cache: Expected function for "onUpsert"');
	}

	/** Get total items in the cache */
	get length() { return this.#map.size; }
	/** Get total items in the cache */
	get size() { return this.#map.size; }

	/** Get total weight */
	get weight() { return this.#weight; }
	/** Get temporary items weight */
	get tempWeight() { return this.#tempWeight; }
	/** Get permanent items size */
	get permanentWeight() { return this.#permanentWeight; }

	/** Check if a key is in the cache */
	has(key: K) { return this.#map.has(key); }

	/** Add value to cache */
	set(key: K, value: V | Promise<V>, weight: number = 1, isPermanent: boolean = false): this {
		const item = this.#map.get(key);
		if (item == null) {
			this.#set(key, value, weight, isPermanent);
		} else {
			const weightDelta = weight - item.weight
			this.#weight += weightDelta;
			//* Check if state changed (temp to permanent or vers versa)
			if (isPermanent) {
				if (item.isPermanent) {
					// Keep permanent
					this.#permanentWeight += weightDelta;
				} else {
					// temporary to permanent
					this.#permanentWeight += weight;
					this.#tempWeight -= item.weight;
					--this.#tempLength;
					++this.#permanentLength;
					// Detach from linked list
					this.#detach(item);
				}
			} else if (item.isPermanent) {
				// changed from permanent to temporary
				this.#tempWeight += weight;
				this.#permanentWeight -= item.weight;
				++this.#tempLength;
				--this.#permanentLength;
				// Append to the linked list
				this.#attach(item);
			} else {
				// Keep temporary
				this.#tempWeight += weightDelta;
			}
			//* Set new values
			item.value = value;
			item.weight = weight;
			item.at = this.#now; // Used for TTL
		}
		return this;
	}
	/**
	 * Add permanent element to the cache
	 * Will persist until user removes it manually
	 */
	setPermanent(key: K, value: V | Promise<V>, weight: number = 1): this {
		return this.set(key, value, weight, true);
	}

	/** Get element from the cache */
	get(key: K): V | Promise<V> | undefined {
		const item = this.#map.get(key);
		const itemExists = item != null;
		if (itemExists) {
			// Update ttl
			item.at = this.#now;
			// Bring forward in the linked list
			const doRefreshLinkedItem = !item.isPermanent && item._prev !== this;
			if (doRefreshLinkedItem) {
				this.#detach(item);
				this.#attach(item);
			}
			return item.value;
		}
	}

	/** Get element from the cache without changing it's timeout and LRU */
	peek(key: K): V | Promise<V> | undefined {
		return this.#map.get(key)?.value;
	}

	/** Get meta data without affecting LRU and TTL */
	getMetadata(key: K): ItemNode<K, V> | undefined {
		return this.#map.get(key);
	}

	/** Get and remove the Least Recently Used element */
	popLRU(): ItemNode<K, V> | undefined {
		if (this._prev !== this) {
			const item = this._prev as Item<K, V>;
			this.#delete(item);
			return item;
		}
		return undefined;
	}

	/** Get and remove the Most Recently Used element */
	popMRU(): ItemNode<K, V> | undefined {
		if (this._prev !== this) {
			const item = this._prev as Item<K, V>;
			this.#delete(item);
			return item;
		}
		return undefined;
	}

	/** Get Least Recently Used item */
	get lru(): ItemNode<K, V> | undefined {
		return this._prev !== this ? (this._prev as Item<K, V>) : undefined;
	}

	/** Get Most Recently Used item */
	get mru(): ItemNode<K, V> | undefined {
		return this._next !== this ? (this._next as Item<K, V>) : undefined;
	}

	/** Upsert value */
	upsert(key: K, additionalArgs?: any): V | Promise<V> {
		let value = this.get(key);
		if (value != null) {
			return value;
		} else if (typeof this.#onUpsert !== 'function') {
			throw new Error('Cache: Missing "onUpsert" handler');
		} else {
			const res = this.#onUpsert(key, additionalArgs);
			if (res instanceof Promise) {
				const pendingValue = res.then((v) => {
					const valueNotChangedOrRemoved = pendingValue === this.#map.get(key)?.value;
					if (valueNotChangedOrRemoved) {
						this.set(key, v.value, v.weight ?? 1, v.isPermanent ?? false);
					}
					return v.value;
				});
				this.#set(key, pendingValue, 1, true); // Store the promise as a value until resolved
				return pendingValue;
			} else {
				this.#set(key, res.value, res.weight ?? 1, !!res.isPermanent);
				return res.value;
			}
		}
	}

	/**
	 * Delete element from the cache
	 * @return {boolean} if the item exists before being removed
	 */
	delete(key: K): boolean {
		const item = this.#map.get(key);
		if (item != null) {
			this.#delete(item);
			return true;
		}
		return false;
	}

	/** Get and delete */
	getAndDelete(key: K): V | Promise<V> | undefined {
		const item = this.#map.get(key);
		if (item != null) {
			this.#delete(item);
			return item.value;
		}
		return undefined;
	}

	/** Remove all temporary items */
	clearTemp(): this {
		if (this.#permanentWeight === 0)
			this.clearAll();
		else {
			let item = this._prev;
			const map = this.#map;
			while (item !== this) {
				map.delete((item as Item<K, V>).key);
				item = item._next;
			}
			this._prev = this._next = this; // Empty linked list
			this.#weight = this.#permanentWeight;
			this.#tempWeight = 0;
			this.#tempLength = 0;
		}
		return this;
	}
	/** Remove all permanent items */
	clearPermanent(): this {
		if (this.#tempWeight === 0) this.clearAll();
		else {
			this.#map.forEach(function (item, key, map) {
				if (item.isPermanent)
					map.delete(key);
			});
			this.#weight = this.#permanentWeight;
			this.#permanentWeight = 0;
			this.#permanentLength = 0;
		}
		return this;
	}
	/** Remove all items */
	clearAll(): this {
		this.#map.clear();
		this._prev = this._next = this;
		this.#weight = this.#permanentWeight = this.#tempWeight = 0;
		this.#permanentLength = this.#tempLength = 0;
		return this;
	}

	/** Clone cache and all it's entires */
	clone(): LRU_TTL<K, V> {
		const cloneCache = new LRU_TTL({
			max: this.#max,
			onUpsert: this.#onUpsert,
			ttl: this.#ttl,
			ttlResolution: this.#ttlResolution
		});
		// Clone Temp items
		if (this.#tempWeight > 0) {
			let prevClone = cloneCache as unknown as Item<K, V>;
			let item = this._next as Item<K, V>;
			const cloneMap = cloneCache.#map;
			while ((item as unknown) !== this) {
				const cloneItem: Item<K, V> = {
					_prev: prevClone,
					_next: cloneCache, // Placeholder
					at: item.at,
					isPermanent: item.isPermanent,
					key: item.key,
					value: item.value,
					weight: item.weight
				}
				prevClone._next = cloneItem;
				cloneMap.set(item.key, cloneItem);
				prevClone = cloneItem;
			}
			prevClone._next = cloneCache;
			cloneCache._prev = prevClone;
		}
		// Add permanent items
		if (this.#permanentWeight > 0) {
			const cloneMap = cloneCache.#map;
			this.#map.forEach(function (value, key) {
				cloneMap.set(key, value);
			});
		}
		// Weight
		cloneCache.#weight = this.#weight;
		cloneCache.#permanentWeight = this.#permanentWeight;
		cloneCache.#tempWeight = this.#tempWeight;
		cloneCache.#tempLength = this.#tempLength;
		cloneCache.#permanentLength = this.#permanentLength;
		return cloneCache;
	}

	/** Create cache from Map or IterableIterator<[K, V]> */
	static from<K, V>(data: LRU_TTL<K, V> | Map<K, V> | IterableIterator<[K, V]>): LRU_TTL<K, V> {
		const cache = data instanceof LRU_TTL ? new LRU_TTL({
			max: data.#max,
			onUpsert: data.#onUpsert,
			ttl: data.#ttl,
			ttlResolution: data.#ttlResolution
		}) : new LRU_TTL<K, V>();
		cache.addAll(data);
		return cache;
	}
	/** Append all items from Map, Cache or Iterator<K, V> */
	addAll(data: LRU_TTL<K, V> | Map<K, V> | IterableIterator<[K, V]>) {
		if (data instanceof LRU_TTL) {
			const it = data.entries();
			let p = it.next();
			while (!p.done) {
				let [key, value] = p.value;
				this.set(key, value.value, value.weight, value.isPermanent);
				p = it.next();
			}
		} else {
			if (data instanceof Map) data = data.entries();
			const it = data;
			let p = it.next();
			while (!p.done) {
				let [key, value] = p.value;
				this.set(key, value, 1, false);
				p = it.next();
			}
		}
	}

	/** Get entries */
	entries(): IterableIterator<[K, ItemNode<K, V>]> {
		return this.#map.entries();
	}

	/** Get all keys */
	keys(): IterableIterator<K> { return this.#map.keys() }

	/** Values */
	*values(): IterableIterator<V | Promise<V>> {
		var it = this.#map.values();
		var p = it.next()
		while (!p.done) {
			yield p.value.value;
		}
	}

	/** ForEach */
	forEach(cb: (value: V | Promise<V>, key: K, cache: this, metadata: ItemNode<K, V>) => void, thisArg: any) {
		var it = this.#map.values();
		var p = it.next();
		if (arguments.length === 1) thisArg = this;
		while (!p.done) {
			var e = p.value;
			cb.call(thisArg, e.value, e.key, this, e);
		}
	}

	/** For(of) */
	*[Symbol.iterator]() {
		var it = this.#map.values();
		var v = it.next();
		while (!v.done) {
			var entry = v.value
			yield [entry.key, entry.value];
		}
	}

	/**
	 * Add missing element to the cache
	 * !make sure "key" is missing on the cache before calling this method
	 */
	#set(key: K, value: V | Promise<V>, weight: number, isPermanent: boolean) {
		// Create and add to Map
		const previousHead = this._next;
		const item: Item<K, V> = {
			key, value, weight, isPermanent,
			at: this.#now,
			_next: previousHead,
			_prev: this
		};
		this.#map.set(key, item);
		this.#weight += weight;
		// check if add to linked list and adjust weight
		if (isPermanent) {
			// Adjust weight
			this.#permanentWeight += weight;
			++this.#permanentLength;
		} else {
			// Append to linked list
			previousHead._prev = item;
			this._next = item;
			// Weight
			this.#tempWeight += weight;
			++this.#tempLength;
			// Apply LRU on temp items
			let cacheMaxExceeded = this.#tempWeight > this.#max;
			if (cacheMaxExceeded) {
				const maxWeight = this.#max;
				let tempWeight = this.#tempWeight;
				const map = this.#map;
				let oldItem = this._prev as Item<K, V>;
				let totalWeight = this.#weight;
				let tempLength = this.#tempLength;
				do {
					map.delete(oldItem.key);
					const weight = oldItem.weight;
					tempWeight -= weight;
					totalWeight -= weight;
					--tempLength;
					oldItem = oldItem._prev as Item<K, V>;
					cacheMaxExceeded = (oldItem as unknown) !== this && tempWeight > maxWeight;
				} while (cacheMaxExceeded);
				// Detach all removed items
				this._prev = oldItem;
				oldItem._next = this;
				// Adjust weight
				this.#tempWeight = tempWeight;
				this.#weight = totalWeight;
				this.#tempLength = tempLength;
			}
		}
	}

	/** Detach item from linked list */
	#detach(item: Item<K, V>) {
		const previousItem = item._prev;
		const nextItem = item._next;
		previousItem._next = nextItem;
		nextItem._prev = previousItem;
	}
	/** Append item the linked list */
	#attach(item: Item<K, V>) {
		const previousHead = this._next;
		this._next = item;
		item._prev = this;
		item._next = previousHead;
		previousHead._prev = item;
	}

	/** Timer interval handler: used to clean ttl */
	#ttlCleaner() {
		if (this._prev === this) return; // No temp item found
		// Remove expired items
		++this.#now;
		const expires = ++this.#ttlExpires;
		const map = this.#map;
		let item = this._prev as Item<K, V>;

		let weight = 0;
		while ((item as unknown) !== this && item.at < expires) {
			weight += item.weight;
			map.delete(item.key);
			item = item._prev as Item<K, V>;
		}
		// Check if clear everything
		if ((item as unknown) === this) this.clearAll();
		else {
			this._prev = item;
			item._next = this;
		}
	}

	/** Delete item from the cache */
	#delete(item: Item<K, V>) {
		this.#map.delete(item.key);
		this.#detach(item);
		//Weight
		const weight = item.weight;
		this.#weight -= weight;
		if (item.isPermanent) {
			this.#permanentWeight -= weight;
			--this.#permanentLength;
		}
		else {
			this.#tempWeight -= weight;
			--this.#tempLength;
		}
	}
}