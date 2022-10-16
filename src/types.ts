import type LRU_TTL from 'cache';
import { UnitValue } from 'utils/unit-parser';

/**
 * Set interface items as required but can have undefined
 */
export type RequireAllKeys<T> = OrUndefined<Required<T>>;

type OrUndefined<T> = {
	[k in keyof T]: T[k] | undefined;
};

/**
 * Cache Options
 */
export interface Options<K, V, UpsertArgs = unknown> {
	/**
	 * Max entries as Positive integer
	 * Or max weight as Positive integer
	 * Or max bytes as Positive integer or string
	 * see examples below for each implementation
	 * @example { max: 500 } means 500 entries or 500 bytes or 500 of any unite of your logic
	 * @example { max: "50k" } means 50_000 @see documentation
	 * @example { max: "50MB" } means 50MBytes @see documentation
	 * @example { max: "50MB" } means 50MBits @see documentation
	 * @example { max: Infinity } means disable LRU/MRU behaviour of the cache
	 * @default Infinity
	 */
	max?: UnitValue;

	/**
	 * Time to live after last access
	 * Any item that is not accessed before this date will be removed
	 * @example { ttl: 3000 } means remove after 3000ms
	 * @example { ttl: '2h' }
	 * @example { ttl: '2h 25min 66s' }
	 * @default Infinity
	 */
	ttl?: number | string;

	/**
	 * For performance purpose,
	 * Items will be removed within the interval [ttl, ttl + ttlResolution]
	 * 1ms <= ttlResolution <= ttl
	 * @default max(ttl/10,1s)
	 */
	ttlResolution?: number | string;

	/**
	 * Upsert callback
	 * Enables to create missing elements when using
	 * "cache::upsert(key)" instead of "cache::get(key)"
	 * Could be synchronous or asynchronous
	 * Could return promise
	 * @param {mixed} key - Any javascript type as a key
	 * @optional @param {mixed} additionalArgs. In case you need it, it's the second argument of "cache.upsert(key, additionalArgs)"
	 */
	onUpsert?: UpsertCb<K, V, UpsertArgs>;

	/**
	 * This function is called whenever an item is removed
	 */
	onDeleted?: OnDeletedCb<K, V>;
}

/**
 * Upsert callback
 * Enables to create missing elements when using
 * "cache::upsert(key)" instead of "cache::get(key)"
 * Could be synchronous or asynchronous
 * Could return promise
 * @param {mixed} key - Any javascript type as a key
 * @optional @param {mixed} additionalArgs. In case you need it, it's the second argument of "cache.upsert(key, additionalArgs)"
 */
export type UpsertCb<K, V, UpsertArgs = unknown> = (
	key: K,
	additionalArgs?: UpsertArgs
) => Maybe<UpsertResult<V>>;

/** OnDeleted: deletion raison */
export enum OnDeleteRaison {
	/** Deleted due to TTL */
	TTL,
	/** Deleted due to LRU */
	LRU,
	/** Deleted by user */
	USER,
	/** Cache clear */
	CLEAR
}

/** OnDelete: CallBack */
export type OnDeletedCb<K, V> = (
	metadata: ItemMetadata<K, V>,
	raison: OnDeleteRaison
) => void;

/** Result could be promise or undefined */
export type Maybe<T> = T | undefined | null;

/** Upsert result */
export interface UpsertResult<V> {
	/**
	 * Item value
	 */
	value: Maybe<V>;
	/**
	 * The weight of the item,
	 * @default 1
	 */
	weight?: number;
	/**
	 * Prevent removing the item
	 * Keep in the cache until removed manually
	 * (means could be removed by the ttl or lru algorithm or not)
	 * @default false
	 */
	locked?: boolean;
}

/**
 * Linked list logic
 * i1: The least recently used item
 * in: The most recently used item
 *
 * ┌────────────┐ _after   _before ┌────┐ _after   _before ┌────┐ _after   _before ┌────────────┐
 * │ cache Tail	├──────────────────┤ i1 ├───────···────────┤ in ├──────────────────┤ Cache Head │
 * └────────────┘                  └────┘                  └────┘                  └────────────┘
 */
export interface Linked<K, V> {
	_before: LinkedNode<K, V>;
	_after: LinkedNode<K, V>;
}

export type LinkedNode<K, V> = LRU_TTL<K, V> | Node<K, V>;

/**
 * Item Node metadata
 */
export interface ItemMetadata<K, V> {
	/** Item value */
	value: Maybe<V>;
	/** Item key */
	key: K;
	/** Item weight */
	weight: number;
	/** If the item is permanent */
	locked: boolean;
	/**
	 * Date of Add
	 * using local timer instead of timestamp
	 * for performance purpose
	 * This enables you only to sort items depending
	 * on adding date.
	 */
	AddedAt: number;
	/**
	 * last access
	 * using local timer instead of timestamp
	 * for performance purpose
	 */
	lastAccess: number;
}
/**
 * Temporary or Locked Item Node
 */
export interface Node<K, V> extends ItemMetadata<K, V>, Linked<K, V> {}
