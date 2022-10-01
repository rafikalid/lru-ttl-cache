import { parseUnit, UnitValue } from "./utils/unit-parser";
import { LinkedNode, Node, Options, UpsertCb } from "./types";
import MS from "timestring";

/**
 * LRU MRU TTL Cache
 */
export default class LRU_TTL<K = any, V = any, UpsertArgs = unknown>
	implements LinkedNode<K, V>
{
	/** Tail: Least Recently Used item (oldest) */
	_after: LinkedNode<K, V> = this;
	/** Head: Most Recently Used item (newest) */
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

	/** Temporary entries count */
	#tempCount = 0;
	/** Temporary entries weight */
	#tempWeight = 0;
	/** Locked entries count */
	#lockedCount = 0;
	/** Locked entries weight */
	#lockedWeight = 0;

	/** Current timer value */
	#now = 0;
	/** Remove any: item.at < expires */
	#expires = -1;
	/** Timer interval reference */
	#timerRef: NodeJS.Timeout | undefined = undefined;

	constructor(options?: Options<K, V, UpsertArgs>) {
		if (options != null) {
			if (options.max != null) this.max = options.max;
			if (options.ttl != null) this.ttl = options.ttl;
			if (Reflect.has(options, "ttlResolution"))
				this.ttlResolution = options.ttlResolution;
			if (Reflect.has(options, "onUpsert"))
				this.onUpsert = options.onUpsert;
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
		if (typeof evalMax === "number") {
			if (evalMax <= 0)
				throw new Error(`Cache: Illegal "max" value: ${max}`);
		} else if (typeof evalMax === "string") {
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
		const value = typeof ttl === "string" ? MS(ttl, "ms") : ttl;
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
			// TTL resolution
			let ttlResolution = this.#ttlResolution;
			if (ttlResolution == null || ttlResolution > value) {
				ttlResolution = Math.ceil(value / 10);
			}
			// Adjust ttl expires
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
		return this.#ttlResolution;
	}
	/** Get ttl resolution */
	get ttlResolution() {
		return this.#ttlResolutionRaw;
	}
	set ttlResolution(value: number | string | undefined) {
		let resolutionValue: number | undefined;
		if (value == null) resolutionValue = undefined;
		else if (typeof value === "string") resolutionValue = MS(value, "ms");
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
}
