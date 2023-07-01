> A new faster version, well tested and with more features is coming on August 01, 2023

# lru-ttl-cache

Super fast Optimized in memory LRU and TTL cache.

-   LRU cache: Removes Least Recently Used items
-   TTL cache: Removes expired item (Time To Live cache)
-   Permanent items: Items marked as permanent are not removed from the cache until you do it yourself

You can combine all cache behaviors or use the one you need.

# Why to use:

-   Fast in memory cache
-   Use both TTL (Time To Live) and LRU (Least Recently Used)
-   Can store permanent items (Could be removed explicitly by calling ::delete)
-   Could set an optional memory-size for each element and set a maximum size (bytes) for the whole cache
-   Supports element upsert (Create an item if it does not exist)
-   Don't use a "setTimeout" for each item which increases performance
-   Uses a "HashMap" instead of a plain JavaScript object. This increases performance regardless of insertions and deletions.
-   Could use any JavaScript type as a key (String, Numbers, BigInt, Objects, …)
-   Optimized for V8 engine (used by nodeJS and other backend frameworks)
-   0 dependencies
-   100% JavaScript implementation

## Installation

```shell
npm i -S lru-ttl-cache
# or via yarn
yarn add lru-ttl-cache
```

# Usage

## Import

```javascript
import LRU_TTL from 'lru-ttl-cache';

// Or via require
const LRU_TTL = require('lru-ttl-cache').default;

// You can import from source too (ts file)
import LRU_TTL from 'lru-ttl-cache/src';
```

## Create new Cache

```javascript
// Create the cache using default options
const cache= new LRU_TTL();

// or set options
// We use packages "ms" and "bytes" to parse string literals
const cache= new LRU_TTL({
	/**
	 * @Optional max cache entries
	 * @param {number}
	 * @default Infinity
	 */
	max:	100,
	/**
	 * @Optional max bytes
	 * @Param {Number|String} maxBytes
	 * Maximum allowed bytes
	 */
	maxBytes: '5mb', // 5MB
	/**
	 * @Optional Time To Live in milliseconds (removes entry if not used after this time)
	 * @Param {Number|string}
	 * @default Infinity
	 */
	ttl:	'10m', // 10 minutes
	/**
	 * @Optional Interval for checking TTL. Required "ttl" to be set. We recommend to keep the default value.
	 * @param {number|string}
	 * @default 10s
	 */
	ttlInterval: '60s',
	/**
	 * @Optional
	 * Create value if not exists, @see ::upsert method
	 * Could be synchronous or Asynchronous or returns promise
	 */
	upsert: function(key){ /* Logic */}
	/**
	 * You can add additional arguments to upsert.
	 * See "upsert" section for details
	 */
	upsert: function(key, userAdditionalArgs?: any[]){ /* Logic */}
});
```

## Attributes

```javascript
const cache = new LRU_TTL();

/** Get/Set max temporary entries (permanent entries are not counted) */
cache.max;

/** Get/Set max bytes (permanent entries are counted) */
cache.maxBytes;

/** Get/Set Time To Live in milliseconds or as string */
cache.ttl;

/**
 * Get/Set TTL interval
 * <i> Default value is compatible with most cases.
 */
cache.ttlInverval;

/** Get/Change upsert callback */
cache.upsertCb;

/** Get used bytes */
cache.bytes;

/** Get temporary items bytes (Exclude permanent items) */
cache.tmpBytes;

/** Get total items */
cache.size;

/** Get temporary items count */
cache.tmpSize;
```

## Methods

### Add new entry to the cache

```javascript
const cache = new LRU_TTL();

/**
 * Add temporary item to the cache (TTL or LRU)
 * @Param MixedKey	- Any javascript type (string, number, object, function, ...)
 * @Param MixedValue - Any javascript type (string, number, object, function, ...)
 */
cache.set(MixedKey, MixedValue);

/**
 * Add Optional bytes
 * @Param {Integer} MixedValue_Size	- Size of mixedValue, used if the cache concerns files for example
 */
cache.set(MixedValue, MixedValue, MixedValue_Size);

/** Add permanent item (until you remove it) */
cache.set(MixedKey, MixedValue, 0 /* Optional size */, true);
// OR
cache.setPermanent(MixedKey, MixedValue);
```

### Get element from cache

```javascript
/**
 * Get element from cache
 * @return value or undefined
 */
const item = cache.get(mixedKey);

/**
 * Get element from cache without updating it's TLL or LRU
 * (Means not affect TTL or LRU)
 * @return value or undefined
 */
const item = cache.peek(mixedKey);

/**
 * Get least recently used temporary item
 * permanent items are not included
 */
const item = cache.getLRU();

/**
 * Get the least recently used temporary item and delete it
 * Permanent items are not included
 */
const item = cache.pop();
```

### Check key exists

```javascript
cache.has(mixedKey);
```

### Upsert item (create it if not exist)

#### Synchronous mode:

Get/Create item in synchronous mode
If you don't really need to use "await", use this mode. "await" is useful but it is slow even when used with synchronous functions.

```javascript
// You need to set "upsert" callback logic when creating the cache
const cache = new LRU_TTL({
	upsert: function (key) {
		let data;
		/* Write your Logic */
		return data;
	}
});

// Or set it using ::upsertCb
cache.upsertCb = function (key) {
	/* Your Logic */
};

/** Using ::upsert */
var item = cache.upsert(mixedKey);
```

#### Async mode:

```javascript
// You need to set "upsert" callback logic when creating the cache
const cache = new LRU_TTL({
	upsert: async function (key) {
		/* Return Logic */
	}
});

// Or set it using ::upsertCb
cache.upsertCb = async function (key) {
	/* Logic */
};

/** Using ::upsert */
const item = await cache.upsert(mixedKey);
```

#### Add additional arguments

You can add additional arguments to be used when creating missing items as follow:

```typescript
// You need to set "upsert" callback logic when creating the cache
const cache= new LRU_TTL({
	upsert: function(key, userAdditionalArgs: any[]){
		let data;
		/* Write your Logic */
		return data;
	}
});

// Or set it using ::upsertCb
cache.upsertCb= function(key, userAdditionalArgs?: any[]){ /* Your Logic */};

/** Arguments added after "mixedKey" will be grouped in an array and set as the second argument of "upsertCb" */
const item= cache.upsert(mixedKey, additionalArg1, additionalArg2, ...);
```

### Remove item

```javascript
cache.delete(mixedKey);
```

### Clear items

```javascript
/** Remove all temporary items */
cache.clearTemp();

/** Remove all items */
cache.clearAll();
```

## Iterators

```typescript
/** Get an iterator on keys */
<Iterator(key)> cache.keys();

/** Get an iterator on values */
<Iterator(value)> cache.values();

/** Get entries iterator */
<Iterator([key, value])> cache.entries();
```

## Loops

```javascript
/** ForEach */
cache.forEach(function callback(value, key, cache) {
	/* Loop logic */
}, optionalThisArg);

/** For ... of */
for ([key, value] of cache) {
	/* Your logic */
}
```

## Metadata

Get item metadata

```javascript
/** Get meta data of element with key: mixedKey */
const {
	value, // The cached item
	key, // the key
	bytes, // element bytes
	createdAt, // timestamp of insert (milliseconds)
	lastAccess, // timestamp of last access (milliseconds)
	isPermanent // Is a permanent or temporary item
}= catch.getMetadata(mixedKey);
```

# Examples

## Use as TTL cache (Time to live)

```javascript
const LRU_TTL = require('lru-ttl-cache');

const cache = new LRU_TTL({
	/**
	 * Set the TTL (time to live in milliseconds)
	 * Setting this to "Infinity" will disable the TTL behaviors of the cache
	 * @type Positive integer or string
	 */
	ttl: '1h'
});
```

## Use as LRU cache (Least recently used)

```javascript
const LRU_TTL = require('lru-ttl-cache');

const cache = new LRU_TTL({
	/**
	 * Set the maximum items count in the cache.
	 * When this value exceeded, the least used item will be removed
	 * Setting this to "Infinity" will disable the LRU behaviors of the cache
	 * @type Number
	 * @default Infinity
	 */
	max: 200
});
```

## Use as LRU cache with max bytes

```javascript
const LRU_TTL = require('lru-ttl-cache');

const cache = new LRU_TTL({
	/**
	 * Set the maximum memory size (in bytes) for the cache
	 * Will remove the least used elements if this value is exceeded
	 * Setting this to "Infinity" will disable this behaviors
	 * @type Number
	 * @default Infinity
	 */
	maxBytes: '5mb' // 5MB
});

// Expects a size of each element when inserting or updating it
// otherwise the size will be null
cache.set('key', value, bytes);
```

## Use cache with multiple behaviors

Just enable the required configuration.

# Credits

Khalid RAFIK

# Let's contribute

Open an issue
Create a "fork" and than a "Pull Request"
contact me: khalid.rfk@gmail.com

# Support

Open an issue or contact me: khalid.rfk@gmail.com

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
