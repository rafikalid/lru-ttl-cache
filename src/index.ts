import MS from 'ms';
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
	value: V,
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
	_next: LinkedNode<K, V> | undefined
	_prev: LinkedNode<K, V> | undefined
}

/** Item node */
interface Item<K, V> extends LinkedNode<K, V> {
	value: V | Promise<V>
	key: K
	/** Object weight */
	weight: number
	/** last access at interval (For performance instead of timestamp) */
	at: number
	/** If the item is permanent */
	isPermanent: boolean
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
	/** TTL */
	#ttl!: number
	/** TTL resolution */
	#ttlResolution!: number
	/** On upsert callback */
	#onUpsert?: Options<K, V>["onUpsert"]
	/** Total items size */
	#size = 0;
	/** Temporary items size */
	#tempSize = 0;
	/** Permanent items size */
	#permanentSize = 0;
	/** Current interval time */
	#currentTime = 0;

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
		if (typeof ttl === 'string') ttl = MS(ttl);
		else if (typeof ttl === 'number' && ttl > 0) { }
		else throw new Error(`Cache: "ttl" expected positive number or string`);
		this.#ttl = ttl;
		//TODO adjust time interval here
	}

	/** Get ttl resolution */
	get ttlResolution() { return this.#ttlResolution }
	set ttlResolution(value: number | string) {
		if (typeof value === 'string') value = MS(value);
		else if (typeof value === 'number' && value > 0) { }
		else throw new Error(`Cache: "ttlResolution" expected positive number or string`);
		this.#ttlResolution = value;
		if (this.#ttl != null)
			this.ttl = this.#ttl; // Adjust interval timer
	}

	/** Get on upsert handler */
	get onUpsert() { return this.#onUpsert; }
	set onUpsert(handler: Options<K, V>["onUpsert"]) {
		if (typeof handler === 'function')
			this.#onUpsert = handler;
		throw new Error('Cache: Expected function for "onUpsert"');
	}

	/** Get total items in the cache */
	get length() { return this.#map.size; }

	/** Get total weight */
	get size() { return this.#size; }
	/** Get temporary items weight */
	get tempItemsSize() { return this.#tempSize; }
	/** Get permanent items size */
	get permanentItemsSize() { return this.#permanentSize; }

	/** Check if a key is in the cache */
	has(key: K) { return this.#map.has(key); }

	/** Add value to cache */
	set(key: K, value: V | Promise<V>, weight: number = 1, isPermanent: boolean = false): this {
		const item = this.#map.get(key);
		if (item == null) {
			this.#set(key, value, weight, isPermanent);
		} else {
			const weightDelta = weight - item.weight
			this.#size += weightDelta;
			//* Check if state changed (temp to permanent or vers versa)
			if (isPermanent) {
				if (item.isPermanent) {
					// Keep permanent
					this.#permanentSize += weightDelta;
				} else {
					// temporary to permanent
					this.#permanentSize += weight;
					this.#tempSize -= item.weight;
					this.#detach(item); // remove from linked list
				}
			} else if (item.isPermanent) {
				// changed from permanent to temporary
				this.#tempSize += weight;
				this.#permanentSize -= item.weight;
				this.#attach(item);
			} else {
				// Keep temporary
				this.#tempSize += weightDelta;
			}
			//* Set new values
			item.value = value;
			item.weight = weight;
			item.at = this.#currentTime; // Used for TTL
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
		if (item != null) {
			this.#refresh(item);
			return item.value;
		}
	}

	/** Get element from the cache without changing it's timeout and LRU */
	peek(key: K): V | Promise<V> | undefined {
		return this.#map.get(key)?.value;
	}

	/** Get and remove the least recently used element */
	pop(): V | Promise<V> | undefined {
		if (this._prev !== this) {
			var oldest = this._prev as Item<K, V>;
			this.#map.delete(oldest.key);// TODO change this to delete to adjust counters
			this.#detach(oldest);
			return oldest.value;
		}
		return undefined;
	}

	/** Get Least Recently Used item */
	get lru(): V | Promise<V> | undefined {
		return this._prev !== this ? (this._prev as Item<K, V>).value : undefined;
	}

	/** Get Most Recently Used item */
	get mru(): V | Promise<V> | undefined {
		return this._next !== this ? (this._next as Item<K, V>).value : undefined;
	}

	/** Upsert value */
	upsert(key: K, additionalArgs?: any) {
		//TODO
	}

	/**
	 * Delete element from the cache
	 * @return {boolean} if the item exists before being removed
	 */
	delete(key: K): boolean {
		const item = this.#map.get(key);
		if (item != null) {
			this.#map.delete(key);
			this.#detach(item);
			return true;
		}
		return false;
	}

	/** Get and delete */
	getAndDelete(key: K): V | Promise<V> | undefined {
		const item = this.#map.get(key);
		if (item != null) {
			this.#map.delete(key);
			this.#detach(item);
			return item.value;
		}
		return undefined;
	}

	/** Remove all temporary items */
	clearTemp() { }
	/** Remove all permanent items */
	clearPermanent() {
		//TODO
	}
	/** Remove all items */
	clearAll() { }

	/** Delete item from the cache */
	#delete(item: Item<K, V>) {
		this.#map.delete(item.key);
		//TODO detach from linked list and remove weight
	}

	/** Add element to the cache */
	#set(key: K, value: V | Promise<V>, weight: number, isPermanent: boolean) {

	}

	/** Detach item from linked list */
	#detach(item: Item<K, V>) { }
	/** Attach item to en head of the linked list */
	#attach(item: Item<K, V>) { }

	/** Refresh item */
	#refresh(item: Item<K, V>) {
		//TODO
	}
}