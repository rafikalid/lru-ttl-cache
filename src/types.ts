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
	_before: Linked<K, V>;
	_after: Linked<K, V>;
}

/** Result could be promise or undefined */
export type Maybe<T> = T | undefined | null;

/**
 * Node
 * Contains item and its metadata
 */
export interface Node<K, V> {
	/** The stored Item */
	value: Maybe<V>;
	/** Item key */
	key: K;
	/**
	 * Item weight
	 * @default 1
	 */
	weight: number;
	/** If the item is permanent or temporal */
	locked: boolean;
	/**
	 * Date of Add
	 * using local timer instead of timestamp
	 * for performance purpose
	 * This enables you only to sort items depending
	 * on adding date.
	 */
	addedAt: number;
	/**
	 * last access
	 * using local timer instead of timestamp
	 * for performance purpose
	 */
	lastAccess: number;
}
