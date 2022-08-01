<h1 align=center> lru-ttl-cache </h1>

<p style="text-align:center">
	<img alt="version" src="https://img.shields.io/npm/v/lru-ttl-cache?label=version">
	<!-- <img alt="node-version" src="https://img.shields.io/node/v/ttl-lru-cache">
	<img alt="downloads per week" src="https://img.shields.io/npm/dw/lru-ttl-cache"> -->
	<a href="./LICENSE">
		<img alt="NPM" src="https://img.shields.io/npm/l/lru-ttl-cache">
	</a>
</p>

# What is LRU-TTL cache?
The fastest and most Optimized in memory LRU, MRU and TTL cache for Node.js, Browser and JS-based environnement.
The only cache that supports permanent items.
- LRU cache: Removes Least Recently Used items when the maximum entries or size exceeded
- TTL cache: Removes expired item (Time To Live cache)
- Permanent items: Items marked as permanent are not removed from the cache until you do it yourself.

You can combine all cache behaviors or use the one you need.

# Why to use:
- The Fastest in memory cache (@see benchmarking)
- One cache for both TTL (Time To Live) and LRU (Least Recently Used)
- Can store permanent items (Could be removed explicitly by calling ::delete)
- Could set an optional memory-size or weight for each element and set a maximum size (bytes) for the whole cache
- Supports element upsert (Create an item if it does not exist)
- Don't use a "setTimeout" for each item which increases performance
- Uses a "HashMap" instead of a plain JavaScript object. This increases performance regardless of insertions and deletions.
- Could use any JavaScript type as a key (String, Numbers, BigInt, Objects, …)
- Optimized for V8 engine (used by nodeJS and other backend frameworks)
- 0 dependencies
- 100% JavaScript implementation

# Compared to others?
- The maximum number of cache entries is 134 million. Most of others only support less than a million
- Supports any type as a key. Most of others only supports strings.
- Supports creating missing items in both synchronized and asynchronous modes.
- More use cases and utilities than others
- The fastest javascript cache (@see benchmarking)
- The lowest memory usage (@see benchmarking)

# Benchmarking (last check: July 1st 2022)

## Compared with other LRU caches
| lru-ttl-cache | 1,262 ops/sec ±0.19% | The fastest |
|---|---|---|
| lru-cache | 1,114 ops/sec ±0.19% | 13.28% slower |
| quick-lru | 1,088 ops/sec ±0.17% | 15.99% slower |
| lru | 463 ops/sec ±0.33% | 172.58% slower |

> **lru-ttl-cache** is the fastest LRU cache

## Compared with other TTL caches
| lru-ttl-cache | 2,466 ops/sec ±0.22% | The fastest |
|---|---|---|
| node-cache | 723 ops/sec ±0.35% | 241.08% slower |
| timed-cache | 660 ops/sec ±1.53% | 273.64% slower |
| ttl-cache | 562 ops/sec ±0.85% | 338.79% slower |
| memory-cache-ttl | 203 ops/sec ±0.07% | 1114.78% slower |
| node-ttl | 46.88 ops/sec ±0.35% | 5160.24% slower |

> **lru-ttl-cache** is the fastest TTL cache. Even more than 2.4 times faster than the second one on the list!

### An other library not on the list?
Tell us about the library by opening an issue, so we can add it to the benchmarking.

# Installation
```shell
# Via npm
npm install lru-ttl-cache --save

# Or via yarn
yarn add lru-ttl-cache
```

# Import
```javascript
// Using typescript or ESM
import LRU_TTL from 'lru-ttl-cache';

// Using commonJS
const LRU_TTL= require('lru-ttl-cache').default;
```

# Create new Cache

## Using default options
```javascript
// Create the cache using default options
const cache= new LRU_TTL();
```
## Available options
```javascript
// We use packages "timestring" and "bytes" to parse string literals
// All options are optional
const cache= new LRU_TTL({
	/**
	 * Max cache temporary entries (entries not set as permanent)
	 * Or Max cache Weight
	 * Or Max cache Memory Size
	 * 
	 * This is an LRU parameter, means we will start removing least
	 * used item when this value exceeded.
	 * @See #examples for how to use in each case
	 * @type {number | String}
	 * @default Infinity (means LRU disabled)
	 * @example { max: 1000 } // Max entries are 1000 or max weight is 1000
	 * @example { max: '5MB' } // Max entries memory size or anything else, see examples
	 */
	max:	100,
	/**
	 * Time To Live in milliseconds
	 * Maximum age of entries before being removed from the cache
	 * @Param {Number | string}
	 * @default Infinity (means TTL disabled)
	 * @example {ttl: 60*1000} // remove items after 60000 milliseconds
	 * @example {ttl: '2h 5min' } // Remove items after 2 hours and 5 minutes
	 * @see https://www.npmjs.com/package/timestring for more options
	 */
	ttl:	'10min', // 10 minutes
	/**
	 * To enhance performance, items will be removed
	 * between "ttl" and "ttl + ttlResolution"
	 * The default value should fit most cases.
	 * If you need that the items to be removed at exactly
	 * "ttl" value, reduce this value.
	 * This could impact performance.
	 * @param {number|string}
	 * @default ttl/10
	 */
	ttlResolution: '60s',
	/**
	 * Create missing items when calling the method "cache.upsert(key)"
	 * If this handler is synchronous, the "cache.upsert" will be synchronous too
	 * If this handler is asynchronous or returns a promise, "cache.upsert" will return a promise too.
	 */
	onUpsert: function(key, additionalArgs){ /* Logic */}
});
```

# Attributes
```javascript
const cache= new LRU_TTL();

/**
 * Get {number} as the maximum entries or weight or memory-size
 * Only temporary items
 * Permanent items are not counted
 * 
 * Set {number, string} the maximum entires / weight / memory-size
 * This is an LRU parameter
 * To disable LRU behavior set this to "Infinity"
 */
cache.max

/**
 * Get/Set Time To Live in milliseconds
 * Set {number | string}
 * This a TTL parameter
 * To disable TTL behavior of the cache, set this to "Infinity"
 */
cache.ttl

/**
 * Get/Set TTL resolution
 * When TTL cache is activated, entries will removed
 * between "ttl" and "ttl+ttlResolution"
 * Default value should fit most cases
 */
cache.ttlResolution

/** Get/Change upsert fetcher function */
cache.onUpsert

/**
 * Get total entries in the cache
 * @alias cache.length
 */
cache.size

/**
 * Get total entries in the cache
 * @alias cache.size
 */
cache.length


/**
 * Get count of temporary entries
 */
cache.tempLength

/**
 * Get count of permanent entries
 */
cache.permanentLength

/**
 * Get cache weight
 */
cache.weight

/**
 * Get temporary entries weight
 */
cache.tempWeight

/**
 * Get permanent entries weight
 */
cache.permanentWeight
```

# Methods

## Add new entry to the cache
```javascript
const cache= new LRU_TTL();

/**
 * Add temporary item to the cache (TTL or LRU)
 * @Param {string|object|number|symbol|any} MixedKey - Any javascript type
 * @Param {string|object|number|symbol|any} MixedValue - Any javascript type
 */
cache.set(MixedKey, MixedValue);

/**
 * Add Optional weight
 * Could be interpreted as file-size, memory-size or any kind of factor
 * @Param {Integer} weight	- Size of mixedValue, used if the cache concerns files for example
 */
cache.set(key, value, weight);

/**
 * Add permanent entry
 * Will persist until you remove it via "cache.delete(key)"
 */
cache.set(key, value, weight=1, true);
// OR
cache.setPermanent(key, value);
// OR
cache.setPermanent(key, value, weight);
```

## Add all entries from an other Cache or a Map or an IterableIterator<[K, V]>
```javascript
const cache= new LRU_TTL();

// Add all items from a map
cache.addAll(map);

// Add all items from an other LRU-TTL-Cache
cache.addAll(otherCache);

/**
 * Add all items from an Iterator
 * @param {IterableIterator<[K, V]>} iterator
 */
cache.addAll(iterator);
```

## Create a cache from an other Cache or Map or Iterator
```javascript
/**
 * Create a cache and copy all entries from "srcCache" to it
 * (If you need to maintain LRU and TTL of each entry, use
 * "const cache= srcCache.clone()" instead)
 */
const cache= LRU_TTL.from(srcCache);

/**
 * Create a cache and copy all entries from a Map<K, V> to it
 */
const cache= LRU_TTL.from(sourceMap);

/**
 * Create a cache and copy all entries from an IterableIterator<[K, V]> to it
 */
const cache= LRU_TTL.from(iterator);
```

## Get element from cache
```javascript
/**
 * Get element from cache
 * @param {string|object|number|symbol|any} mixedKey - any javascript type as the key
 * @return value or undefined if entry is missing
 */
const item= cache.get(mixedKey);

/**
 * Get element from cache
 * without affecting its TLL or LRU
 * (Means will not affect TTL or LRU)
 * @return value or undefined if entry is missing
 */
const item= cache.peek(mixedKey);

/**
 * Get item metadata
 * without affecting its LRU or TTL
 */
const {key, value, weight, isPermanent}= cache.getMetaData(key);

/**
 * Get least recently used temporary item
 * permanent items are not included
 */
const item= cache.lru.value;
// Or get all metadata
const {key, value, weight, isPermanent}= cache.lru;

/**
 * Get most recently used temporary item
 * permanent items are not included
 */
const item= cache.mru.value;
// Or get all metadata
const {key, value, weight, isPermanent}= cache.mru;

/**
 * Get the least recently used temporary item and delete it
 * Permanent items are not included
 */
const item= cache.popLRU().value;
// Or get all metadata
const {key, value, weight, isPermanent}= cache.popLRU();

/**
 * Get the most recently used temporary item and delete it
 * Permanent items are not included
 */
const item= cache.popMRU().value;
// Or get all metadata
const {key, value, weight, isPermanent}= cache.popMRU();
```

## Check if a key exists
```javascript
const doesKeyExists= cache.has(key); // returns true or false
```

## Upsert item (create it if does'nt exist)

### Synchronous mode: 
Get/Create item in synchronous mode
If you don't really need to use "await", use this mode. "await" is useful but it is slow even when used with synchronous functions.

```javascript
// You need to define "onUpsert" fetch logic when creating the cache
const cache= new LRU_TTL({
	onUpsert: function(key, optionalAdditionalArgs){
		let data;
		/* Write your Logic here */

		/**
		 * @return {entry metadata} or undefined if fetching canceled
		 */
		return {
			value: data, // entry value
			/**
			 * Entry weight. Used with LRU cache
			 * @default 1
			 */
			weight: 1,
			/**
			 * If this entry is permanent or temporary.
			 * @default false
			 */
			isPermanent: false,
		};
	}
});

// Or set it using ::onUpsert
cache.onUpsert= function(key, optionalAdditionalArgs){ /* Your Logic */};

/**
 * And than use "cache.upsert" instead of "cache.get"
 */
const item= cache.upsert(mixedKey);

/**
 * Additional arguments could be added as follow
 */
const item= cache.upsert(mixedKey, additionalArgumentsOnCreate);
```

### Async mode:
```javascript
// Define "onUpsert" fetch logic when creating the cache
// as asynchronous function or return a promise
const cache= new LRU_TTL({
	upsert: async function(key, optionalArgs){ /* Return Logic */ }
});

// Or set it using ::onUpsert
cache.onUpsert= async function(key, optionalArgs){ /* Logic */};

/**
 * And than use "cache.upsert" instead of "cache.get"
 */
const item= await cache.upsert(mixedKey);

/**
 * Additional arguments could be added as follow
 */
const item= await cache.upsert(mixedKey, additionalArgumentsOnCreate);
```

## Remove item
```javascript
/**
 * Delete entry by key
 * @return true if key exists
 */
const wasExist= cache.delete(mixedKey);

/**
 * Get and delete entry by key
 * @return deleted item or undefined if missing
 */
const item= cache.getAndDelete(mixedKey);
```

## Clear items
```javascript
/**
 * Remove all temporary items
 */
cache.clearTemp();

/**
 * Remove all permanent items
 */
cache.clearPermanent();

/**
 * Remove all items
 */
cache.clearAll();
```

## Clone cache
```javascript
/**
 * Clone cache
 */
const clonedCache= cache.clone();
```

# Iterators
```typescript
/** Get an iterator on keys */
const keyIterator: Iterator(key)= cache.keys();

/** Get an iterator on values */
const valueIterator: Iterator(value)= cache.values();

/** Get entries iterator */
const entryIterator: Iterator([key, {
	value,
	key,
	weight,
	isPermanent
}])> = cache.entries();
```

# Loops

## ForEach
```javascript
/**
 * @param {any} value - entry value
 * @param {any} key - entry key
 * @param {this} cache - the cache it self
 * @param {metadata} metadata - entry metadata = {key, value, weight, isPermanent}
 */
const callback= function(value, key, cache, metadata){
	/* Loop logic */
}

cache.forEach(callback, optionalThisArg);
```

## For ... of
```javascript
for([key, value] of cache){
	/* Your logic */
}
```

# Examples

## Use as TTL cache only (Time to live)
```javascript
const LRU_TTL= require('lru-ttl-cache');

const cache= new LRU_TTL({
	/**
	 * Set the TTL (time to live in milliseconds)
	 * Setting this to "Infinity" will disable the TTL behaviors of the cache
	 * @type Positive integer or string
	 */
	ttl: '1h'
});
```

## Use as LRU cache with maximum entries (Least recently used)
```javascript
const LRU_TTL= require('lru-ttl-cache');

const cache= new LRU_TTL({
	/**
	 * Set the maximum items count in the cache.
	 * When this value exceeded, the least used temporary item will be removed
	 * Setting this to "Infinity" will disable the LRU behaviors of the cache
	 * @type Number
	 * @default Infinity
	 */
	max: 200
});
```

## Use as LRU cache with max bytes or weight
```javascript
const LRU_TTL= require('lru-ttl-cache');

const cache= new LRU_TTL({
	/**
	 * Set the maximum memory size (in bytes) for the cache
	 * Could be number or string
	 */
	max: '5mb', // 5MB
});

// And than use the optional "weight" when setting entries
cache.set(key, value, bytes_or_weight);

// For "upsert" set the optional "weight" when returning value in "onUpsert"
cache.onUpsert= function(key, additionalArgs){
	//Logic
	return {
		value,
		/**
		 * The weight meaning depends on your logic
		 * Could be fileSize, MemorySize, or any factor
		 * you need
		 */
		weight
	}
}
```

## Use cache with multiple behaviors

Just enable the required configuration.
You can set TTL and LRU on the same time.
```javascript
const LRU_TTL= require('lru-ttl-cache');

const cache= new LRU_TTL({
	max: 5000, // Keep only most used 500
	ttl: '1h' // remove any unused entry since 1 hour
});
```

```javascript
const LRU_TTL= require('lru-ttl-cache');

const cache= new LRU_TTL({
	// Keep only most used entries
	// as the total size is less than 5MB
	max: '10MB',
	// remove any unused entry since 1 day and 5 hour
	ttl: '1d 5h'
	// Accept an error of 10 minutes for the ttl
	ttlResolution: '10min'
});
```

# Help us
Please add a "star" to this project on github above. This means you find the project useful.

# Let's contribute
Please report any found issue. We will fix it immediately.  
You can contribute to the code and add features by creating a "fork" and than a "Pull Request".  
Write tutorial on forums and link to this page

# Support
Fell free to call me on khalid.rfk@gmail.com if you any questions.  
Or open an issue.

# Credits

Khalid RAFIK

# License

MIT License

Copyright (c) 2021 khalid RAFIK

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
