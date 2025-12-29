<h1 align=center> lru-ttl-cache </h1>

![version](https://img.shields.io/npm/v/lru-ttl-cache?label=version)
![downloads](https://img.shields.io/npm/dm/lru-ttl-cache)
![size](https://img.shields.io/npm/unpacked-size/lru-ttl-cache)
[![license](https://img.shields.io/npm/l/lru-ttl-cache)](./LICENSE)

## 🚀 Blazing Fast In-Memory LRU & TTL Cache for JavaScript

A lightweight, flexible, blazing fast, and memory-optimized in-memory cache for Node.js, Dino, browsers, ReactNative and any JavaScript-based environment.

This cache engine combines LRU, MRU, and TTL strategies with exceptional performance and minimal memory overhead-making it ideal for high-throughput applications, libraries, and SDKs.

> The **only** JavaScript cache that supports **resolve/create missing items** and **permanent items** - entries that will never be evicted unless explicitly removed.

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

- **Sync & Async Resolver (Cache Miss Resolver)**

  - Automatically resolve/create missing items on cache miss
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

**Last verified:** **December 16, 2025**

| Feature / Library               | **This Cache**                                                         | `lru`                                                        | `lru-cache`                                                        | `quick-lru`                                                        | `memory-cache`                                                        | `mnemonist`                                                        | `ttl`                                                        | `node-cache`                                                        | `ttl-cache`                                                        | `memory-cache-ttl`                                                        | `timed-cache`                                                        | `node-ttl`                                                        | `@isaacs/ ttlcache`                                                       | `cache`                                                        |
| ------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------- |
| LRU (Least Recently Used)       | ✅                                                                     | ✅                                                           | ✅                                                                 | ⚠️ Simulation!                                                     | ❌                                                                    | ✅                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ⚠️                                                                        | ❌                                                             |
| LRU access                      | ✅                                                                     | ❌                                                           | ❌                                                                 | ⚠️                                                                 | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ❌                                                                        | ❌                                                             |
| LRU Seek                        | ✅                                                                     | ❌                                                           | ❌                                                                 | ⚠️                                                                 | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ❌                                                                        | ❌                                                             |
| MRU access                      | ✅                                                                     | ❌                                                           | ❌                                                                 | ⚠️ Not MRU!                                                        | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ❌                                                                        | ❌                                                             |
| MRU Seek                        | ✅                                                                     | ❌                                                           | ❌                                                                 | ⚠️ Not MRU!                                                        | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ❌                                                                        | ❌                                                             |
| TTL (time-based expiration)     | ✅                                                                     | ❌                                                           | ⚠️ Limited                                                         | ✅                                                                 | ✅                                                                    | ❌                                                                 | ✅                                                           | ✅                                                                  | ✅                                                                 | ✅                                                                        | ✅                                                                   | ✅                                                                | ✅                                                                        | ✅                                                             |
| Permanent (non-evictable) items | ✅                                                                     | ❌                                                           | ❌                                                                 | ❌                                                                 | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ❌                                                                        | ❌                                                             |
| Combine multiple strategies     | ✅                                                                     | ❌                                                           | ⚠️ Limited                                                         | ✅                                                                 | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ❌                                                                        | ❌                                                             |
| Item size / weight support      | ✅                                                                     | ❌                                                           | ⚠️ Limited                                                         | ❌                                                                 | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ❌                                                                        | ❌                                                             |
| Max total cache weight          | ✅                                                                     | ❌                                                           | ✅                                                                 | ❌                                                                 | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ❌                                                                        | ❌                                                             |
| Sync cache miss resolver        | ✅                                                                     | ❌                                                           | ✅                                                                 | ❌                                                                 | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ❌                                                                        | ❌                                                             |
| Async cache miss resolver       | ✅                                                                     | ❌                                                           | ✅                                                                 | ❌                                                                 | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ❌                                                                        | ❌                                                             |
| Async resolve deduplication     | ✅                                                                     | ❌                                                           | ❓                                                                 | ❌                                                                 | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ❌                                                                        | ❌                                                             |
| Any JS type as key              | ✅                                                                     | ❌                                                           | ⚠️ Limited                                                         | ✅                                                                 | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ❌                                                                | ✅                                                                        | ❌                                                             |
| Event Emitter                   | ✅                                                                     | ❌                                                           | ❌                                                                 | ❌                                                                 | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ❌                                                                   | ⚠️ Limited                                                        | ⚠️ Limited                                                                | ❌                                                             |
| Custom record onRemove          | ✅                                                                     | ⚠️                                                           | ⚠️ Limited                                                         | ⚠️ Limited                                                         | ❌                                                                    | ❌                                                                 | ❌                                                           | ❌                                                                  | ❌                                                                 | ❌                                                                        | ✅                                                                   | ✅                                                                | ❌                                                                        | ❌                                                             |
| Zero dependencies               | ✅                                                                     | ❌                                                           | ✅                                                                 | ✅                                                                 | ✅                                                                    | ❌                                                                 | ✅                                                           | ❌                                                                  | ✅                                                                 | ❌                                                                        | ✅                                                                   | ❌                                                                | ✅                                                                        | ❌                                                             |
| Unpacked size (npm)             | ![size](https://img.shields.io/npm/unpacked-size/lru-ttl-cache?label=) | ![size](https://img.shields.io/npm/unpacked-size/lru?label=) | ![size](https://img.shields.io/npm/unpacked-size/lru-cache?label=) | ![size](https://img.shields.io/npm/unpacked-size/quick-lru?label=) | ![size](https://img.shields.io/npm/unpacked-size/memory-cache?label=) | ![size](https://img.shields.io/npm/unpacked-size/mnemonist?label=) | ![size](https://img.shields.io/npm/unpacked-size/ttl?label=) | ![size](https://img.shields.io/npm/unpacked-size/node-cache?label=) | ![size](https://img.shields.io/npm/unpacked-size/ttl-cache?label=) | ![size](https://img.shields.io/npm/unpacked-size/memory-cache-ttl?label=) | ![size](https://img.shields.io/npm/unpacked-size/timed-cache?label=) | ![size](https://img.shields.io/npm/unpacked-size/node-ttl?label=) | ![size](https://img.shields.io/npm/unpacked-size/@isaacs/ttlcache?label=) | ![size](https://img.shields.io/npm/unpacked-size/cache?label=) |
| Bundled size (Bundlephobia)     | ![size](https://img.shields.io/bundlejs/size/lru-ttl-cache?label=)     | ![size](https://img.shields.io/bundlejs/size/lru?label=)     | ![size](https://img.shields.io/bundlejs/size/lru-cache?label=)     | ![size](https://img.shields.io/bundlejs/size/quick-lru?label=)     | ![size](https://img.shields.io/bundlejs/size/memory-cache?label=)     | ![size](https://img.shields.io/bundlejs/size/mnemonist?label=)     | ![size](https://img.shields.io/bundlejs/size/ttl?label=)     | ![size](https://img.shields.io/bundlejs/size/node-cache?label=)     | ![size](https://img.shields.io/bundlejs/size/ttl-cache?label=)     | ![size](https://img.shields.io/bundlejs/size/memory-cache-ttl?label=)     | ![size](https://img.shields.io/bundlejs/size/timed-cache?label=)     | ![size](https://img.shields.io/bundlejs/size/node-ttl?label=)     | ![size](https://img.shields.io/bundlejs/size/@isaacs/ttlcache?label=)     | ![size](https://img.shields.io/bundlejs/size/cache?label=)     |

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

### LRU Benchmark

> **Test environment:** Node.js v20, V8 engine, 16GB RAM, macOS / Linux.
> **Operations:** 1 million set/get operations with mixed key types (strings, numbers, objects, symbols).

**Last verified:** **December 13, 2025**

| Operation                   | **lru-ttl-cache** | **lru-ttl-cache/emitter** | `lru-cache` | `quick-lru` | `node-cache` | `memory-cache` |
| --------------------------- | ----------------- | ------------------------- | ----------- | ----------- | ------------ | -------------- |
| Set 1M entries              | ✅ ~X ms          | ~Y ms                     | ~Z ms       | ~W ms       | ~V ms        |
| Get 1M entries              | ✅ ~X ms          | ~Y ms                     | ~Z ms       | ~W ms       | ~V ms        |
| Eviction (LRU)              | ✅ ~X ms          | ~Y ms                     | ~Z ms       | ❌          | ❌           |
| Eviction (MRU)              | ✅ ~X ms          | ❌                        | ❌          | ❌          | ❌           |
| TTL expiry                  | ✅ ~X ms          | ⚠                         | ❌          | ✅          | ✅           |
| Memory footprint (1M items) | ✅ ~X MB          | ~Y MB                     | ~Z MB       | ~W MB       | ~V MB        |

### TTL Benchmark

> **Test environment:** Node.js v20, V8 engine, 16GB RAM, macOS / Linux.
> **Operations:** 1 million set/get operations with mixed key types (strings, numbers, objects, symbols).

**Last verified:** **December 13, 2025**

| Operation                   | **This Cache** | `lru-cache` | `quick-lru` | `node-cache` | `memory-cache` |
| --------------------------- | -------------- | ----------- | ----------- | ------------ | -------------- |
| Set 1M entries              | ✅ ~X ms       | ~Y ms       | ~Z ms       | ~W ms        | ~V ms          |
| Get 1M entries              | ✅ ~X ms       | ~Y ms       | ~Z ms       | ~W ms        | ~V ms          |
| Eviction (LRU)              | ✅ ~X ms       | ~Y ms       | ~Z ms       | ❌           | ❌             |
| Eviction (MRU)              | ✅ ~X ms       | ❌          | ❌          | ❌           | ❌             |
| TTL expiry                  | ✅ ~X ms       | ⚠           | ❌          | ✅           | ✅             |
| Memory footprint (1M items) | ✅ ~X MB       | ~Y MB       | ~Z MB       | ~W MB        | ~V MB          |

### Full Benchmark Results

[Full Benchmark Results](./packages/benchmarks/README.md)

### Key Takeaways

- **Blazing fast lookups and inserts**: Optimized for millions of operations per second.
- **Low memory overhead**: Efficient internal representation with optional item weighting.
- **Flexible eviction strategies**: Supports **LRU**, **MRU**, **TTL**, and **permanent items**.
- **Async cache resolution**: Handles network and database fetches efficiently.
- **Works in Node.js, browsers, and serverless environments** with zero dependencies.

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

#### - Core Cache

```js
// ESM
import Cache from 'lru-ttl-cache';

// CommonJS
const Cache = require('lru-ttl-cache');
```

#### - Support Permanent Records

If you need to mark certain records as permanent -so they are never evicted by LRU or TTL logic unless explicitly deleted- note that this incurs a slight performance overhead (see benchmarks).

```js
// ESM
import CacheWithPermanentRecords from 'lru-ttl-cache/permanent';

// CommonJS
const CacheWithPermanentRecords = require('lru-ttl-cache/permanent');
```

#### - Support Emitting Events

If you need to track operations via event listeners, note that this is implemented as a wrapper around the cache and therefore introduces a slight overhead (see benchmarks).

```js
import CacheEmitter from 'lru-ttl-cache/emitter';

import CacheWithPermanentRecordsAndEmitter from 'lru-ttl-cache/permanent-emitter';
```

---

### Create a New Cache

```js
import Cache from 'lru-ttl-cache';
// import Cache from 'lru-ttl-cache/permanent';
// import Cache from 'lru-ttl-cache/emitter';
// import Cache from 'lru-ttl-cache/permanent-emitter';

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
const myAwesomeUsersCache = new Cache<string | symbol, User>();
```

---

### ⚙️ Cache Options

All options are **optional**. You can create a cache with only the features you need.

- **`max`** (`number|string`, default: `Infinity`)
  Maximum number of **temporary entries** (entries not marked as permanent) **or maximum cache weight**. Least Recently Used item will be removed. Supports human-readable sizes for weight.
  **Examples:**

  ```ts
  {
    max: 5000;
  } // 5s
  {
    max: 8 * 10 ** 3;
  } // 8000
  {
    max: '5M';
  } // 5 Million, 5k for 5000
  {
    max: '8MB';
  } // 8 * 2^20 bytes
  {
    max: '8MiB';
  } // 8 * 10^2 bytes
  ```

- **`ttl`** (`number|string`, default: `Infinity`)
  Time-to-Live for cache entries in milliseconds. Expired items are automatically removed. Supports human-readable strings.
  **Examples:**

  ```ts
  {
    ttl: 60 * 1000;
  } // 1 minute
  {
    ttl: '2h 10s';
  } // 2 hours 10 seconds
  {
    ttl: '5s';
  } // 5 seconds
  ```

- **`ttlAccuracy`** (`number|string`, default: auto-calculated)
  Balances performance vs timely eviction. Items are removed **between `ttl` and `ttl + ttlAccuracy`**. Higher values reduce cleanup frequency at the cost of slightly delayed eviction.
  **Examples:**

  ```ts
  {
    ttlAccuracy: '60s';
  }
  {
    ttlAccuracy: 5000;
  } // 5 seconds
  ```

- **`defaultResolver`** (`function|async_function`, default: `undefined`)
  Callback to **create missing items** when calling `cache.resolve(key)`. Ideal for lazy-loading data or fetching from external sources.

  Signature:

  ```ts
  (key, ...optionalArgs) => fetchByKeyAndArgs(key, optionalArgs);
  ```

  Can be async for network or database fetches.
  **Example:**

  ```ts
  const cache = new Cache({
    defaultResolver: async (key) => {
      const data = await fetchFromAPI(key);
      return data;
    },
  });

  const value = await cache.resolve('some-key');
  ```

- **`onDeleted`** (`function`, default: `undefined`)
  Callback triggered when an item is removed from the cache. lets you handle cleanup, logging, or side effects when items are evicted.

  Signature:

  ```ts
  (deletedRecordsMetadata, reason: DeletedReason) => void

  type DeletedReason = 'expired' | 'lru' | 'removed' | 'replaced' | 'clearedAll' | 'clearedTemp' | 'clearedPerm';
  ```

  - **`deletedRecordsMetadata`** - List of metadata of deleted records
  - **`reason`** - why the item was removed:
    - `ttl` - record expired due to TTL
    - `lru` - record removed due to LRU eviction
  - `delete` - record deleted explicitly by calling `cache.delete(key)`

  ```ts
  const cache = new Cache({
    onDeleted: (deletedRecordsMetadata, reason) => {
      console.log(
        `Removed records: ${deletedRecordsMetadata.map((item) => item.key)}, reason=${reason}`,
      );
    },
  });
  ```

## 🧩 Attributes

- **`cache.max`** (`string|number`, default: `Infinity`) Get/Set `options.max` @see options above.
- **`cache.ttl`** (`string|number`, default: `Infinity`) Get/Set `options.ttl` @see options above.
- **`cache.ttlAccuracy`** (`number|string`) Get/Set `options.ttlAccuracy` @see options above.
- **`cache.defaultResolver`** (`boolean`, default: `fase`) Get/Set `options.defaultResolver` @see options above.
- **`cache.onDeleted`** (`boolean`, default: `fase`) Get/Set `options.onDeleted` @see options above.

- **`cache.size`** (`number`) Get the number of all records.
- **`cache.length`** (`number`) alias of `cache.size`.
- **`cache.tmpSize`** (`number`) Get the number of temporal records.
- **`cache.permanentSize`** (`number`) Get the number of permanent records.

- **`cache.weight`** (`number`) Get the total weight of all records.
- **`cache.tmpWeight`** (`number`) Get the weight of temporal records.
- **`cache.permanentWeight`** (`number`) Get the weight of permanent records.

- **`cache.lru`** (`ValueType`) Get the Least Recently Used temporal record.
- **`cache.lruKey`** (`KeyType`) Get the key of the Least Recently Used temporal record.
- **`cache.lruMetadata`** (`RecordMetadata<KeyType, ValueType>`) Get the metadata of the Least Recently Used temporal record.

- **`cache.mru`** (`ValueType`) Get the Most Recently Used temporal record.
- **`cache.mruKey`** (`KeyType`) Get the key of the Most Recently Used temporal record.
- **`cache.mruMetadata`** (`RecordMetadata<KeyType, ValueType>`) Get the metadata of the Most Recently Used temporal record.

---

### 🔧 Core Methods

- **`cache.set(key: any, value: any)`** Add/Replace temporal record in the cache.
- **`cache.get(key: any)`** Get the cache record by key; returns `undefined` when missing.
- **`cache.peek(key)`** Get the cache record by key without affecting its TLL or LRU; returns `undefined` when missing.
- **`cache.has(key): boolean`** Checks if a `key` is used in the cache.
- **`cache.delete(key): boolean`** delete the giving record from the cache and return `true`, return `false` if the record doesn't exist.
- **`cache.clear()`** Remove all records

---

### 🛠 Advanced Methods

- **`cache.set(key: any, value: any, weight: number = 1)`** Add/Replace temporal record in the cache with explicit weight.
- **`cache.set(key: any, value: any, weight: number = 1, onDeleted: DeleteListnerType)`** Add/Replace temporal record in the cache with explicit weight.
- **`cache.setPermanent(key: any, value: any)`** Add/Replace permanent record in the cache.
- **`cache.setPermanent(key: any, value: any, weight: number = 1)`** Add/Replace permanent record in the cache with explicit weight.

- **`cache.resolve(key: any)`** Get the cache record by key; uses `options.defaultResolver` when missing to create one or returns `undefined`.
- **`cache.resolve(key: any, resolver, ...args)`** Use additional `args` when calling `options.defaultResolver`
- **`cache.getOrInsert`** Alias to `cache.resolve` function.
- **`cache.getOrCreate`** Alias to `cache.resolve` function.

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

- **`cache[ Symbol.iterator<Metadata<KeyType, ValueType>> ]`**
- **`cache[ Symbol.asyncIterator<Metadata<KeyType, Awaited<ValueType>>> ]`**

- **`cache.entries`** (`()=> MapIterator<[K, V]>`) Return cache entries
- **`cache.tmpEntries`** (`()=> MapIterator<[K, V]>`) Return cache temporal entries following add order.
- **`cache.tmpLruEntries`** (`()=> MapIterator<[K, V]>`) Return cache temporal entries starting by Least Recently Used.
- **`cache.tmpMruEntries`** (`()=> MapIterator<[K, V]>`) Return cache temporal entries starting by Most Recently Used.
- **`cache.permanentEntries`** (`()=> MapIterator<[K, V]>`) Return cache permanent entries

- **`cache.keys`** (`()=> MapIterator<K>`) Return cache keys
- **`cache.tmpKeys()`** (`()=> MapIterator<K>`) Return cache temporal keys following add order.
- **`cache.tmpLruKeys()`** (`()=> MapIterator<K>`) Return cache temporal keys starting by Least Recently Used.
- **`cache.tmpMruKeys()`** (`()=> MapIterator<K>`) Return cache temporal keys starting by Most Recently Used.
- **`cache.permanentKeys()`** (`()=> MapIterator<K>`) Return cache permanent keys

- **`cache.values`** (`()=> MapIterator<V>`) Return cache keys
- **`cache.tmpValues()`** (`()=> MapIterator<V>`) Return cache temporal keys following add order.
- **`cache.tmpLruValues()`** (`()=> MapIterator<V>`) Return cache temporal keys starting by Least Recently Used.
- **`cache.tmpMruValues()`** (`()=> MapIterator<V>`) Return cache temporal keys starting by Most Recently Used.
- **`cache.permanentValues()`** (`()=> MapIterator<V>`) Return cache permanent keys

- **`cache.entriesMetadata`** (`()=> MapIterator<[K, Metadata<K, V>]>`) Return cache records metadata.
- **`cache.tmpEntriesMetadata`** (`()=> MapIterator<[K, Metadata<K, V>]>`) Return cache temporal records metadata following add order.
- **`cache.tmpLruEntriesMetadata`** (`()=> MapIterator<[K, Metadata<K, V>]>`) Return cache temporal records metadata starting by Least Recently Used.
- **`cache.tmpMruEntriesMetadata`** (`()=> MapIterator<[K, Metadata<K, V>]>`) Return cache temporal records metadata starting by Most Recently Used.
- **`cache.permanentEntriesMetadata`** (`()=> MapIterator<[K, Metadata<K, V>]>`) Return cache permanent records metadata.

---

### Loop

- **`cache.forEach`** (`cb= (metadata, key, cache)=> void`)
  Example:

  ```ts
  cache.forEach((metadata, key) => {
    console.log(`Record[${key}] = ${metadata.value}, isPermanent: ${metadata.isPermanent}`);
  });
  ```

- **`for ... of`**

  ```ts
  for (metadata of cache) {
    // Do something
  }
  ```

  Example:

  ```ts
  for (const { key, value, isPermanent } of cache) {
    console.log(`- ${key}: ${value}, isPermanent: ${isPermanent}`);
  }
  ```

- **`for await ... of`**
  In case you use an async cache, each item is resolved as soon as its promise settles or if it's not a promise object.
  ```ts
  for await (const metadata of cache) {
    // Do something
  }
  ```
  Example:
  ```ts
  for ({ key, value, isPermanent } of cache) {
    console.log(`- ${key}: ${value}, isPermanent: ${isPermanent}`);
  }
  ```

---

### Map Methods

- **`Map.groupBy(srcCache)`** @see `Map.groupBy` reference.

---

### Resolve records

When calling `cache.resolve(key, resolver, ...optionalArgs)`, if the record is missing and `resolver | cache.defaultResolver` is defined, it will be used to create the record, which is then stored and returned.

```ts
// Define resolver logic
cache.defaultResolver = function (key, ...optionalArgs) {
  const data = createRecord(key);
  return { value: data };
};

// Use it
const value = cache.resolve(key);
```

If the cache is asynchronous:

```ts
// Define resolver logic
cache.defaultResolver = async function (key, ...optionalArgs) {
  const data = await fetchFromAPI(key);
  return { value: data };
};

// Use it
const value = await cache.resolve(key);
```

Additional Metadata could be defined too

```ts
cache.defaultResolver = function (key, ...optionalArgs) {
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
import CacheEmitter from 'lru-ttl-cache/emitter';

const cache = new CacheEmitter(optionalParams); // Same signature as `Cache`

cache.on('eventName', listener);
cache.once('eventName', listener);
cache.off('eventName', listener);
```

Supported events are:

- `set`
- `get`
- `resolve`
- `delete`
- `clear`

## 📘 Examples

- TTL Cache
- LRU Cache
- TTL + LRU Cache
- Weighted Cache
- Async Resolver with TTL & LRU

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
>
> - Code is well-tested
> - Changes are documented
> - Performance is not degraded

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
