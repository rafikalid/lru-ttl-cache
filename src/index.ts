import MS from 'ms';
import Bytes from 'bytes';
/**
 * LRU & TTL fast in-memory cache
 * Promise supported
 * Upsert supported
 * Permanent items supported
 */

/** Options */
export interface ConstOptions<K, V> {
    /** Max entries @default Infinity */
    max?: number
    /** Max bytes @default Infinity */
    maxBytes?: number | string
    /** Time to live @default Infinity */
    ttl?: number | string
    /** TTL check interval. @default 60s */
    ttlInterval?: number | string
    /** Upsert callback: enables to create missing elements */
    upsert?: ((key: K, additionalArgs?: any[]) => UpsertResult<V> | Promise<UpsertResult<V>>) | undefined
    /** onEvict callback: enables to handle element eviction */
    onEvict: (metadata: Metadata<K, V>) => void
}

/** Upsert result */
export interface UpsertResult<V> {
    value: V,
    bytes?: number,
    isPermanent?: boolean
}

/** NodeChain */
interface NodeChain {
    /** Previous element */
    _prev?: NodeChain,
    /** Next element */
    _next?: NodeChain
}

/** Node interface for LRU */
interface Node<K, V> extends NodeChain {
    value: V | Promise<V>
    key: K
    /** Object size */
    bytes: number
    /** Created timestamp */
    createdAt: number
    /** Last access */
    lastAccess: number
    /** Is permanent node */
    isPermanent: Boolean
}

export interface Metadata<K, V> {
    value: V | Promise<V>
    key: K
    /** Created timestamp */
    createdAt: number
    /** Last access */
    lastAccess: number
    /** Is permanent node */
    isPermanent: Boolean
}

type NodeReadOnly<K, V> = Readonly<Node<K, V>>

/** Main interface */
export default class LRU_TTL<K, V> implements NodeChain {
    private _map: Map<K, Node<K, V>> = new Map<K, Node<K, V>>();
    /** Max temp elements */
    private _max: number
    private _maxBytes: number // max bytes for temp entries
    /** TLL */
    private _ttl: number
    private _ttlInterval: number
    private _ttlP?: NodeJS.Timeout = undefined;
    private _upsert?: ConstOptions<K, V>["upsert"]
    private _onEvict?: ConstOptions<K, V>["onEvict"]

    /** Temp elements count */
    private _tmpSize: number = 0;
    /** Total bytes inside the cache */
    private _totalBytes: number = 0
    /** Temp entries bytes */
    private _tmpBytes: number = 0
    /** Last used element */
    _next: NodeChain = this
    /** Least used element */
    _prev: NodeChain = this

    constructor(options?: ConstOptions<K, V>) {
        // Set config
        if (options) {
            // max entries
            this._max = options.max == null ? Infinity : options.max;
            // max bytes
            var a: string | number | undefined = options.maxBytes;
            this._maxBytes = a == null ? Infinity : typeof a === 'number' ? a : Bytes.parse(a);
            // TTL
            a = options.ttl;
            this._ttl = a == null ? Infinity : typeof a === 'number' ? a : MS(a);
            // TTL interval
            a = options.ttlInterval;
            this._ttlInterval = a == null ? Infinity : typeof a === 'number' ? a : MS(a);
            this._upsert = options.upsert;
            this._onEvict = options.onEvict;
        } else {
            this._max = Infinity;
            this._maxBytes = Infinity;
            this._ttl = Infinity;
            this._ttlInterval = 60000;
        }
        // fix ttl interval
        if (this.ttlInterval > this.ttl)
            this.ttlInterval = this.ttl;
        // init chain
        this._prev = this._next = this;
    }

    /** Set max */
    get max() { return this._max }
    set max(max: number) {
        this._max = max
    }

    get maxBytes() { return this._maxBytes }
    set maxBytes(maxBytes: number | string) {
        this._maxBytes = typeof maxBytes === 'number' ? maxBytes : Bytes.parse(maxBytes);
    }

    get ttl() { return this._ttl }
    set ttl(ttl: number | string) {
        this._ttl = typeof ttl === 'number' ? ttl : MS(ttl);
    }

    get ttlInterval() { return this._ttlInterval }
    set ttlInterval(ttlInterval: number | string) {
        this._ttlInterval = typeof ttlInterval === 'number' ? ttlInterval : MS(ttlInterval);
        // fix ttl interval
        if (this.ttlInterval > this.ttl)
            this.ttlInterval = this.ttl;
        // reload cleaner
        if (this._ttlP) {
            clearInterval(this._ttlP);
            const interv = setInterval(this._ttlClean.bind(this), this._ttlInterval);
            this._ttlP = interv;
            interv.unref?.();
        }
    }

    get upsertCb() { return this._upsert }
    set upsertCb(cb: ConstOptions<K, V>["upsert"]) { this._upsert = cb; }

    /** Get total bytes */
    get bytes() { return this._totalBytes }
    /** Temp entries bytes */
    get tmpBytes() { return this._tmpBytes }

    /** Get cache size */
    get size(): number { return this._map.size }

    /** Get temp elements count */
    get tmpSize(): number { return this._tmpSize }

    /** Check if cache has key */
    has(key: K) { return this._map.has(key) }

    /** Set value */
    set(key: K, value: V | Promise<V>, bytes: number = 0, isPermanent = false): this {
        var item;
        if (item = this._map.get(key)) {
            if (item.value === value && item.bytes === bytes && item.isPermanent === isPermanent) {
                item.lastAccess = Date.now();
                return this
            }
            this._delete(item);
        }
        this._set(key, value, bytes, isPermanent);
        return this;
    }

    /** Add permanent element to the cache (will persist until user removes it manually) */
    setPermanent(key: K, value: V, bytes: number = 0): this {
        return this.set(key, value, bytes, true);
    }

    /** @private Insert new item */
    private _set(key: K, value: V | Promise<V>, bytes: number, isPermanent: boolean): Node<K, V> {
        var now = Date.now();
        var ele: Node<K, V> = {
            key, value, bytes,
            createdAt: now,
            lastAccess: now,
            isPermanent: isPermanent,
            _prev: undefined,
            _next: undefined
        }
        // add to map
        this._map.set(key, ele);
        // Flags
        this._totalBytes += bytes;
        // add to chain
        if (!isPermanent) {
            var p = this._next;
            p._prev = ele;
            ele._next = p;
            ele._prev = this;
            this._next = ele;
            // Flags
            this._tmpSize++; // inc tmp counter
            this._tmpBytes += bytes;
            // remove last permanent element
            if (this._tmpSize > this._max)
                this._delete(this._prev as Node<K, V>) // Remove least used element
            // remove until maxBytes
            while (this._tmpBytes > this._maxBytes && this._prev != this) {
                this._delete(this._prev as Node<K, V>);
            }
            // Run TTL
            if (!this._ttlP)
                this._ttlP = setInterval(this._ttlClean.bind(this), this._ttlInterval)
        }
        return ele;
    }

    /** Get element from the cache */
    get(key: K, upsert?: boolean, additionalUpsertCbArgs?: any[]): V | Promise<V> | undefined {
        var ele: Node<K, V> | undefined;
        var p: NodeChain;
        var p2: NodeChain;
        if (ele = this._map.get(key)) {
            ele.lastAccess = Date.now();
            if (!ele.isPermanent && ele._prev !== this) {
                // Remove from chain
                p = ele._next!;
                p2 = ele._prev!;
                p2!._next = p
                p._prev = p2
                // bring forward
                p = this._next
                p._prev = ele
                ele._next = p;
                ele._prev = this;
                this._next = ele
            }
            return ele.value;
        } else if (upsert) {
            if (typeof this._upsert !== 'function')
                throw new Error('Missing upsert callback!');
            var upsertResult = this._upsert(key, additionalUpsertCbArgs);
            if (upsertResult instanceof Promise) {
                ele = this._set(key, upsertResult.then(({ value }) => value), 0, true);
                return upsertResult.then((r: UpsertResult<V>) => {
                    // Check object not modified
                    if (ele === this._map.get(key)) {
                        this._delete(ele!);
                        this._set(key, r.value, r.bytes || 0, !!r.isPermanent);
                    }
                    return r.value;
                });
            }
            else {
                this._set(key, upsertResult.value, upsertResult.bytes || 0, !!upsertResult.isPermanent);
                return upsertResult.value;
            }
        }
        else return undefined;
    }
    /** Get element from the cache without changing it's timeout and LRU */
    peek(key: K): V | Promise<V> | undefined {
        return this._map.get(key)?.value;
    }

    /** Get and remove Least used element */
    pop(): V | Promise<V> | undefined {
        if (this._prev !== this) {
            var oldest = this._prev as Node<K, V>;
            this._delete(oldest);
            return oldest.value;
        }
        return undefined;
    }

    /** Get least recently used item */
    getLRU() {
        return this._prev !== this ? (this._prev as Node<K, V>).value : undefined
    }

    /** Upsert element in the cache */
    upsert(
        /** Cache key */
        key: K,
        /** Additional args for upsert callback */
        ...args: any[]
    ): V | Promise<V> {
        return this.get(key, true, args)!;
    }

    /** Delete element from the cache */
    delete(key: K): this {
        var el;
        if (el = this._map.get(key))
            this._delete(el);
        return this;
    }

    /** @private remove element from cache */
    private _delete(ele: Node<K, V>) {
        // remove from map
        this._map.delete(ele.key);
        // remove from chain
        var bytes = ele.bytes;
        if (!ele.isPermanent) {
            var p = ele._next!;
            var p2 = ele._prev!;
            p._prev = p2;
            p2._next = p;
            // adjust cache bytes
            this._tmpBytes -= bytes;
            this._tmpSize--;
        }
        // Adjust total bytes
        this._totalBytes -= bytes;
    }

    /** Clear all the cache excluding permanent items */
    clearTemp() {
        var el = this._prev as NodeChain;
        var map = this._map;
        // @ts-ignore
        while (el !== this) {
            map.delete((el as Node<K, V>).key);
            el = el._next!;
        }
        this._next = this._prev = this;
        this._totalBytes -= this._tmpBytes;
        this._tmpBytes = 0;
        this._tmpSize = 0;
    }

    /** Clear all items in the cache including permanent items */
    clearAll() {
        this._next = this._prev = this;
        this._map.clear();
        this._tmpBytes = this._tmpSize = this._totalBytes = 0;
    }

    /** Get entries */
    *entries(): IterableIterator<[K, V | Promise<V>]> {
        var it = this._map.entries();
        var p = it.next();
        var v;
        while (!p.done) {
            v = p.value;
            yield [v[0], v[1].value];
            p = it.next();
        }
    }

    /** Get all keys */
    keys(): IterableIterator<K> { return this._map.keys() }

    /** Values */
    *values(): IterableIterator<V | Promise<V>> {
        var it = this._map.values();
        var p = it.next()
        while (!p.done) {
            yield p.value.value;
        }
    }

    /** ForEach */
    forEach(cb: (value: V | Promise<V>, key: K, cache: this) => void, thisArg: any) {
        var it = this._map.values();
        var p = it.next()
        if (arguments.length === 1) thisArg = this;
        while (!p.done) {
            var e = p.value;
            cb.call(thisArg, e.value, e.key, this);
        }
    }

    /** TTL CLean */
    _ttlClean() {
        // Find last node to keep
        var expires = Date.now() - this._ttl;
        var p = this._prev as Node<K, V>;
        var bytes = 0;
        var map = this._map;
        while ((p as NodeChain) !== this && p.lastAccess < expires) {
            bytes += p.bytes;
            map.delete(p.key);
            if(this._onEvict !== undefined) {
                this._onEvict(p as Metadata<K,V>)
            }
            p = p._prev as Node<K, V>;
        }
        // Remove other nodes
        if ((p as NodeChain) === this) {
            // Remove all nodes
            this._prev = this._next = this
            this._totalBytes -= bytes;
            if (this._totalBytes < 0) this._totalBytes = 0
            this._tmpBytes = this._tmpSize = 0;
            // Break ttl
            clearInterval(this._ttlP!);
            this._ttlP = undefined;
        } else {
            this._prev = p;
            p._next = this;
        }
    }

    /** For(of) */
    *[Symbol.iterator]() {
        var it = this._map.values();
        var v = it.next();
        while (!v.done) {
            var entry = v.value
            yield [entry.key, entry.value];
        }
    }

    /** Get element metadata */
    getMetadata(key: K): NodeReadOnly<K, V> | undefined {
        const el = this._map.get(key);
        return el == null ? el : { ...el };
    }
}
