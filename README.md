<h1 align=center> lru-ttl-cache </h1>

![version](https://img.shields.io/npm/v/lru-ttl-cache?label=version)
![downloads](https://img.shields.io/npm/dm/lru-ttl-cache)
![size](https://img.shields.io/npm/unpacked-size/lru-ttl-cache)
[![license](https://img.shields.io/npm/l/lru-ttl-cache)](./LICENSE)

## 🚀 Blazing Fast In-Memory LRU & TTL Cache for JavaScript

A lightweight, flexible, blazing fast, and memory-optimized in-memory cache for Node.js, Dino, browsers, ReactNative and any JavaScript-based environment.

This cache engine combines LRU, MRU, and TTL strategies with exceptional performance and minimal memory overhead-making it ideal for high-throughput applications, libraries, and SDKs.

> The **only** JavaScript cache that supports **upsert items** and **permanent items** - entries that will never be evicted unless explicitly removed.

## ✨ Features

- **LRU Cache (Least Recently Used)**  
Automatically evicts the least recently used items when maximum size or entry limits are exceeded.

- **MRU Cache (Most Recently Used)**  
Get Most Recently Used item

- **TTL Cache (Time To Live)**  
Items expire automatically after a configurable duration.

- **Permanent Items**  
Mark entries as permanent to guarantee they are never evicted by LRU or TTL policies.

- **Weighted Cache (Optional)**
  - Assign a custom size / weight to each item
  - Define a maximum total cache weight
  - Eviction respects both entry count and weight limits

- **Sync & Async Upsert (Cache Miss Resolver)**
  - Automatically upsert missing items on cache miss
  - Supports both synchronous and asynchronous resolvers
  - Enables network fetches, database calls, or any custom logic

- **Async Resolution Support**  
Designed to safely resolve concurrent async requests and prevent duplicate work during cache misses.

- **Composable Strategies**  
Use LRU, MRU, TTL, weighted limits, and permanent items independently-or combine them seamlessly.

- **Universal Key Support**  
Accepts any JavaScript value as a key:
strings, numbers, objects, symbols, functions, and more.

- **Zero Dependencies**  
No external dependencies. Small footprint. Predictable behavior.

- **Universal JavaScript Support**  
Works in Node.js, browsers, and any JS runtime.

## ⚖️ Comparison with Competitors

**Last verified:** **December 13, 2025**

| Feature / Library               | **This Cache** | `lru-cache` | `quick-lru` | `node-cache` | `memory-cache` |
| ------------------------------- | -------------- | ----------- | ----------- | ------------ | -------------- |
| LRU eviction                    | ✅              | ✅           | ✅           | ❌            | ❌              |
| MRU access                    | ✅              | ❌           | ❌           | ❌            | ❌              |
| TTL (time-based expiration)     | ✅              | ⚠️ Limited  | ❌           | ✅            | ✅              |
| Permanent (non-evictable) items | ✅              | ❌           | ❌           | ❌            | ❌              |
| Combine multiple strategies     | ✅              | ❌           | ❌           | ❌            | ❌              |
| Max entries limit               | ✅              | ✅           | ✅           | ✅            | ❌              |
| Item size / weight support      | ✅              | ⚠️ Partial  | ❌           | ❌            | ❌              |
| Max total cache weight          | ✅              | ⚠️ Partial  | ❌           | ❌            | ❌              |
| Sync cache miss upsert          | ✅              | ❌           | ❌           | ❌            | ❌              |
| Async cache miss upsert         | ✅              | ❌           | ❌           | ❌            | ❌              |
| Async resolve deduplication     | ✅              | ❌           | ❌           | ❌            | ❌              |
| Network / DB fetch support      | ✅              | ❌           | ❌           | ❌            | ❌              |
| Any JS type as key              | ✅              | ⚠️ Mostly   | ⚠️ Mostly   | ⚠️ Mostly    | ⚠️ Mostly      |
| Works in browser                | ✅              | ❌           | ❌           | ❌            | ❌              |
| Node.js support                 | ✅              | ✅           | ✅           | ✅            | ✅              |
| Zero dependencies               | ✅              | ❌           | ✅           | ❌            | ❌              |
| Memory optimized                | ✅              | ⚠️          | ⚠️          | ❌            | ❌              |
| Designed for high-throughput    | ✅              | ⚠️          | ⚠️          | ❌            | ❌              |
| Unpacked size (npm)    | ![size](https://img.shields.io/npm/unpacked-size/lru-ttl-cache?label=)              | ?          | ?          | ?            | ?              |
| Bundled size (Bundlephobia)    | ?              | ?          | ?          | ?            | ?              |

## ⚡ Benchmark

See how **blazing fast and memory-efficient** our cache is in real-world scenarios. Don’t just take our word for it-**test it yourself**!

### Try it Yourself

```bash
# Install dependencies
yarn install

# Run the benchmark
yarn benchmark
```

> This will run a suite of tests including **set/get performance**, **LRU/MRU eviction**, **TTL expiry**, and **memory footprint**.

### Benchmark

> **Test environment:** Node.js v20, V8 engine, 16GB RAM, macOS / Linux.
> **Operations:** 1 million set/get operations with mixed key types (strings, numbers, objects, symbols).

**Last verified:** **December 13, 2025**

| Operation                   | **This Cache** | `lru-cache` | `quick-lru` | `node-cache` | `memory-cache` |
| --------------------------- | -------------- | ----------- | ----------- | ------------ | -------------- |
| Set 1M entries              | ✅ ~X ms        | ~Y ms       | ~Z ms       | ~W ms        | ~V ms          |
| Get 1M entries              | ✅ ~X ms        | ~Y ms       | ~Z ms       | ~W ms        | ~V ms          |
| Eviction (LRU)              | ✅ ~X ms        | ~Y ms       | ~Z ms       | ❌            | ❌              |
| Eviction (MRU)              | ✅ ~X ms        | ❌           | ❌           | ❌            | ❌              |
| TTL expiry                  | ✅ ~X ms        | ⚠          | ❌           | ✅            | ✅              |
| Memory footprint (1M items) | ✅ ~X MB        | ~Y MB       | ~Z MB       | ~W MB        | ~V MB          |

### Full Benchmark Results

[Full Benchmark Results](./packages/benchmarks/README.md)

### Key Takeaways

* **Blazing fast lookups and inserts**: Optimized for millions of operations per second.
* **Low memory overhead**: Efficient internal representation with optional item weighting.
* **Flexible eviction strategies**: Supports **LRU**, **MRU**, **TTL**, and **permanent items**.
* **Async cache resolution**: Handles network and database fetches efficiently.
* **Works in Node.js, browsers, and serverless environments** with zero dependencies.

## 🚀 Getting Started

### Install

```bash
# Using Yarn
yarn add lru-ttl-cache

# Using npm
npm install lru-ttl-cache
```

---

### Import

```js
// ESM
import Cache from 'lru-ttl-cache';

// CommonJS
const Cache = require('lru-ttl-cache');
```

---

### Create a New Cache

```js
// Create the cache using default options
const cache = new Cache();

// Using options
const cache = new Cache({
  max: 1000,       // Optional Maximum number of entries or maximum total weight
  ttl: 5000,              // Optional TTL in milliseconds
  // ... @see full options bellow
});

// Clone another cache
const cloneCache2= Cache.from(srcCache);

// Create from a map
const cache= Cache.from(srcMap);

// Create from object
const cache= Cache.from(Object.entries(srcObject));

// Create from entries
const cache= Cache.from([ [key, value], [key2, value2], ...]);

// Create from Iterator<[key, value]>
const cache= Cache.from(srcIterator);
```

#### TypeScript

```ts
import Cache from 'lru-ttl-cache';

// Sync
const cache = new Cache<KeyType, ValueType>(OPTIONAL_OPTIONS);

// Async
const asyncCache = new Cache<KeyType, Promise<ValueType>>();

// Example
const myAwesomeUsersCache = new Cache<string|symbol, User>();
```

---

### ⚙️ Cache Options

All options are **optional**. You can create a cache with only the features you need.

* **`max`** (`number|string`, default: `Infinity`)
  Maximum number of **temporary entries** (entries not marked as permanent) **or maximum cache weight**. Least Recently Used item will be removed. Supports human-readable sizes for weight.
  **Examples:**

  ```ts
  { max: 5000 } // 5s
  { max: 8 * 10**3 } // 8000
  { max: '5M' } // 5 Million, 5k for 5000
  { max: '8MB' } // 8 * 2^20 bytes
  { max: '8MiB' } // 8 * 10^2 bytes
  ```

* **`ttl`** (`number|string`, default: `Infinity`)
  Time-to-Live for cache entries in milliseconds. Expired items are automatically removed. Supports human-readable strings.
  **Examples:**

  ```ts
  { ttl: 60*1000 }        // 1 minute
  { ttl: '2h 10s' }       // 2 hours 10 seconds
  { ttl: '5s' }           // 5 seconds
  ```

* **`ttlResolution`** (`number|string`, default: auto-calculated)
  Balances performance vs timely eviction. Items are removed **between `ttl` and `ttl + ttlResolution`**. Higher values reduce cleanup frequency at the cost of slightly delayed eviction.
  **Examples:**

  ```ts
  { ttlResolution: '60s' }
  { ttlResolution: 5000 } // 5 seconds
  ```

* **`forceTTL`** (`boolean`, default: `false`)
  By default, items are considered expired between `ttl` and `ttl + ttlResolution`. Set `forceTTL: true` to:

  * Ensure `cache.get(key)` **does not return expired items**
  * Ensure `cache.upsert(key)` re-triggers `onUpsert` if TTL has passed  
  > ⚠️ **Performance note:** Setting `forceTTL` to `true` adds **additional test overhead** and may **slightly reduce performance**, because the cache checks expiration on every access.  

* **`onUpsert`** (`function|async_function`, default: `undefined`)
  Callback to **create missing items** when calling `cache.upsert(key)`. Ideal for lazy-loading data or fetching from external sources.  
  
  Signature:

  ```ts
  (key, ...additionalArgs) => CacheValueType
  ```

  Can be async for network or database fetches.
  **Example:**

  ```ts
  const cache = new Cache({
    onUpsert: async (key) => {
      const data = await fetchFromAPI(key);
      return data;
    }
  });

  const value = await cache.upsert('some-key');
  ```

* **`onDelete`** (`function`, default: `undefined`)
  Callback triggered when an item is removed from the cache. lets you handle cleanup, logging, or side effects when items are evicted.  
  
  
  Signature:

  ```ts
  (deletedRecordsMetadata, reason: 'ttl' | 'lru' | 'delete' | 'clear' | 'clearTmp' | 'clearPermanent') => void
  // ttl: Expired
  // lru: Least recently used
  // delete: Explicity deleted using cache.delete(key)
  ```

  * **`deletedRecordsMetadata`** - List of metadata of deleted records
  * **`reason`** - why the item was removed:
    * `ttl` - record expired due to TTL
    * `lru` - record removed due to LRU eviction
	* `delete` - record deleted explicitly by calling `cache.delete(key)`

  ```ts
  const cache = new Cache({
    onDelete: (deletedRecordsMetadata, reason) => {
      console.log(`Removed records: ${deletedRecordsMetadata.map(item => item.key)}, reason=${reason}`);
    }
  });
  ```

---

### 🧩 Attributes

- **`cache.max`** (`string|number`, default: `Infinity`) Get/Set `options.max` @see options above.
- **`cache.ttl`** (`string|number`, default: `Infinity`) Get/Set `options.ttl` @see options above.
- **`cache.ttlResolution`** (`number|string`) Get/Set `options.ttlResolution` @see options above.
- **`cache.forceTTL`** (`boolean`, default: `fase`) Get/Set `options.forceTTL` @see options above.
- **`cache.onUpsert`** (`boolean`, default: `fase`) Get/Set `options.onUpsert` @see options above.
- **`cache.onDelete`** (`boolean`, default: `fase`) Get/Set `options.onDelete` @see options above.

- **`cache.size`** (`number`) Get the number of all records.
- **`cache.length`** (`number`) alias of `cache.size`.
- **`cache.tmpSize`** (`number`) Get the number of temporal records.
- **`cache.permanentSize`** (`number`) Get the number of permanent records.

- **`cache.weight`** (`number`) Get the total weight of all records.
- **`cache.tmpWeight`** (`number`) Get the weight of temporal records.
- **`cache.permanentWeight`** (`number`) Get the weight of permanent records.

- **`cache.lru`** (`ValueType`) Get the Least Recently Used record.
- **`cache.lruKey`** (`KeyType`) Get the key of the Least Recently Used record.
- **`cache.lruMetadata`** (`RecordMetadata<KeyType, ValueType>`) Get the metadata of the Least Recently Used record.

- **`cache.tmpLru`** (`ValueType`) Get the Least Recently Used temporal record.
- **`cache.tmpLruKey`** (`KeyType`) Get the key of the Least Recently Used temporal record.
- **`cache.tmpLruMetadata`** (`RecordMetadata<KeyType, ValueType>`) Get the metadata of the Least Recently Used temporal record.

- **`cache.permanentLru`** (`ValueType`) Get the Least Recently Used permanent record.
- **`cache.permanentLruKey`** (`KeyType`) Get the key of the Least Recently Used permanent record.
- **`cache.permanentLruMetadata`** (`RecordMetadata<KeyType, ValueType>`) Get the metadata of the Least Recently Used permanent record.

- **`cache.mru`** (`ValueType`) Get the Most Recently Used record.
- **`cache.mruKey`** (`KeyType`) Get the key of the Most Recently Used record.
- **`cache.mruMetadata`** (`RecordMetadata<KeyType, ValueType>`) Get the metadata of the Most Recently Used record.

- **`cache.tmpMru`** (`ValueType`) Get the Most Recently Used record.
- **`cache.tmpMruKey`** (`KeyType`) Get the key of the Most Recently Used record.
- **`cache.tmpMruMetadata`** (`RecordMetadata<KeyType, ValueType>`) Get the metadata of the Most Recently Used record.

- **`cache.permanentMru`** (`ValueType`) Get the Most Recently Used permanent record.
- **`cache.permanentMruKey`** (`KeyType`) Get the key of the Most Recently Used permanent record.
- **`cache.permanentMruMetadata`** (`RecordMetadata<KeyType, ValueType>`) Get the metadata of the Most Recently Used permanent record.

---

### 🔧 Core Methods

- **`cache.set(key: any, value: any)`** Add/Replace temporal record in the cache.
- **`cache.get(key: any)`** Get the cache record by key; returns `undefined` when missing.
- **`cache.peek(key)`** Get the cache record by key without affecting its TLL or LRU; returns `undefined` when missing.
- **`cache.has(key): boolean`** Checks if a `key` is used in the cache.
- **`cache.delete(key): boolean`** delete the giving record from the cache, returns `true` if item found, `false` if missing.
- **`cache.clear()`** Remove all records

---

### 🛠 Advanced Methods

- **`cache.set(key: any, value: any, weight: number = 1)`** Add/Replace temporal record in the cache with explicit weight.
- **`cache.setPermanent(key: any, value: any)`** Add/Replace permanent record in the cache.
- **`cache.setPermanent(key: any, value: any, weight: number = 1)`** Add/Replace permanent record in the cache with explicit weight.

- **`cache.upsert(key: any)`** Get the cache temporal record by key; uses `options.onUpsert` when missing to create one or returns `undefined`.
- **`cache.upsert(key: any, ...args)`** Use additional `args` when calling `options.onUpsert`
- **`cache.upsertPermanent(key: any)`** Get the cache permanent record by key; uses `options.onUpsert` when missing to create one or returns `undefined`.
- **`cache.upsertPermanent(key: any, ...args)`** Use additional `args` when calling `options.onUpsert`.
- **`cache.getOrInsert(key, ...optionalArgs)`** Alias of `cache.upsert(key, optionalArgs)`.

- **`cache.getMetadata(key)`** Get the cache record metadata by key; returns `undefined` when missing.
- **`cache.peekMetadata(key)`** Get the cache record metadata by key without affecting its TLL or LRU; returns `undefined` when missing.

- **`cache.pop(key)`** Delete the specified record from the cache and return it.
- **`cache.popMetadata(key): metadata|undefined`** Delete the specified record from the cache and return its metadata. Use `cache.pop(key)?.value` to remove a record and return its value.

- **`cache.popLru()`** Get LRU from the cache and delete it.
- **`cache.popLruMetadata()`** Get LRU metadata from the cache and delete it.

- **`cache.popMru()`** Get LRU from the cache and delete it.
- **`cache.popMruMetadata()`** Get LRU metadata from the cache and delete it.

- **`cache.addAll(myMap, isPermanent= false)`** Add/Replace temporal/permanent records from a `Map<key, value>`.
- **`cache.addAll(myIterator, isPermanent= false)`** Add/Replace temporal/permanent records from an `Iterator<[key, value]>`.
- **`cache.addAll([ [key, value], ...], isPermanent= false)`** Add/Replace temporal/permanent records from giving entries.

- **`cache.clearTmp()`** Remove all temporal records
- **`cache.clearPermanent()`** Remove all permanent records

---

### Iterators

- **`cache[Symbol.iterator]`**

- **`cache.entries`** (`()=> MapIterator<[K, V]>`) Return cache entries
- **`cache.tmpEntries`** (`()=> MapIterator<[K, V]>`) Return cache temporal entries
- **`cache.permanentEntries`** (`()=> MapIterator<[K, V]>`) Return cache permanent entries

- **`cache.keys`** (`()=> MapIterator<K>`) Return cache keys
- **`cache.tmpKeys()`** (`()=> MapIterator<K>`) Return cache temporal keys
- **`cache.permanentKeys()`** (`()=> MapIterator<K>`) Return cache permanent keys

- **`cache.values`** (`()=> MapIterator<V>`) Return cache keys
- **`cache.tmpValues()`** (`()=> MapIterator<V>`) Return cache temporal keys
- **`cache.permanentValues()`** (`()=> MapIterator<V>`) Return cache permanent keys

- **`cache.entriesMetadata`** (`()=> MapIterator<[K, Metadata<K, V>]>`) Return cache records metadata

---

### Loop

- **`cache.forEach`** (`cb= (value, key, cache, metadata)=> void`)
  Example:
  ```ts
  cache.forEach((value, key, _, {isPermanent})=> {
	console.log(`Record[${key}] = ${value}, isPermanent: ${isPermanent}`);
  });
  ```

- **`for ... of`**
  Example:
  ```ts
  for([key, value] of cache) {
	// Do something
  }
  ```

---

### Map Methods

> Under the hood, `Cache` is implemented as a `Map`, so all `Map` methods work seamlessly on `Cache`.

- **`Map.groupBy(srcCache)`** @see `Map.groupBy` reference.

---

### Upsert records

When calling `cache.upsert(key, ...optionalArgs)`, if the record is missing and `cache.onUpsert` is defined, it will be used to create the record, which is then stored and returned.

```ts
// Define upsert logic
cache.onUpsert = function(key, ...optionalArgs) {
  const data = createRecord(key);
  return { value: data };
};

// Use it
const value= cache.upsert(key);
```

If the cache is asynchronous:

```ts
// Define upsert logic
cache.onUpsert = async function(key, ...optionalArgs) {
  const data = await fetchFromAPI(key);
  return { value: data };
};

// Use it
const value= await cache.upsert(key);
```

Additional Metadata could be defined too

```ts
cache.onUpsert = function(key, ...optionalArgs) {
  const data = createRecord(key);
  return {
	value: data,
	weight: 1, // By default weight is 1
	isPermanent: false, // By default the record is temporal
  };
};
```

## 📣 Events & Listeners

If you need event listeners, use `CacheEmitter`.

`CacheEmitter` inherits from `Cache` and implements `EventEmitter` methods, allowing you to subscribe to cache lifecycle events.

`CacheEmitter` is slightly slower than `Cache` (see benchmarks above).

```ts
import { CacheEmitter } from 'lru-ttl-cache';

const cache= new CacheEmitter(optionalParams); // Same signature as `Cache`

cache.on('eventName', listener);
cache.once('eventName', listener);
cache.off('eventName', listener);
```
Supported events are:
- `set`
- `get`
- `upsert`
- `delete`
- `clear`

## 📘 Examples

- TTL Cache
- LRU Cache
- TTL + LRU Cache
- Weighted Cache
- Async Upsert with TTL & LRU

## 🤝 Contribute

Contributions are welcome and appreciated ❤️

### How to Contribute

1. Fork the repository
2. Create a new branch `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests and benchmarks
  ```bash
  yarn test
  yarn benchmark
  ```
5. Commit and push
6. Open a Pull Request

> Please ensure:
>  - Code is well-tested
>  - Changes are documented
>  - Performance is not degraded

## ⭐ Support the Project
If this cache helps you build faster, more reliable applications, please consider giving it a star on GitHub ⭐

Your support:
- Helps the project grow
- Encourages ongoing maintenance
- Makes it easier for others to discover the library

👉 Star us here: https://github.com/rafikalid/lru-ttl-cache

## ⚖️ License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.