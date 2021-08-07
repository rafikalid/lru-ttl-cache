# lru-ttl-cache
Super fast Optimized in memory LRU and TTL cache.
Can store permanent entries too

# Why to use:
- Fast in memory cache
- Use both TTL (Time To Live) and LRU (Least Recently Used)
- Can store permanent items
- Could set an optional memory-size for each element and set a maximum size (bytes) for the whole cache
- Supports element upsert
- Do not use a "setTimeout" for each element witch increase the performance
- Uses a “Map” instead of traditional “Object”. This increase performance regardless inserts and removes
- Could use any JavaScript type as a key (String, Numbers, BigInt, Objects, …)
- Optimized for V8 engine (used by nodeJS and other backend frameworks)

## Installation
```shell
npm i -S lru-ttl-cache
```

# Usage

## Import
```javascript
import LRU_TTL from 'lru-ttl-cache';
// Or
const LRU_TTL= require('lru-ttl-cache').default;

// You can import from source too (ts file)
import LRU_TTL from 'lru-ttl-cache/src';
```

## Create new Cache
```javascript
// Create the cache
const cache= new LRU_TTL();

//or set options
// We use packages "ms" and "bytes" to parse string literals
const cache= new LRU_TTL({
	/**
	 * @Optional: max cache entries
	 * @param {number}
	 * @default Infinity
	 */
	max:	100,
	/**
	 * @Optional
	 * @Param {Number|String} maxBytes
	 * Maximum allowed bytes
	 */
	maxBytes: '5mb', // 5MB
	/**
	 * @Optional
	 * @Param {Number|string}
	 * Time to live for temp entries in milliseconds
	 */
	ttl:	'10m', // 10 minutes
	/**
	 * @Optional
	 * @param {number|string}
	 * Interval for checking TTL
	 */
	ttlInterval: 60000,
	/**
	 * @Optional
	 * Create value if not exists, @see ::upsert method
	 */
	upsert: async function(key){ /* Logic */}
});
```

## Attributes
```javascript
const cache= new LRU_TTL();

/** Get/Set max temporary entries (exlude permanent entries) */
cache.max

/** Get/Set max bytes */
cache.maxBytes

/** Get/Set TTL */
cache.ttl

/**
 * Get/Set TTL interval
 * <i> Default value is compatible with most cases.
 */
cache.ttlInverval

/** Get/Change upsert callback */
cache.upsertCb

/** Get used bytes */
cache.bytes

/** Get temporary items bytes (Exclude permanent items) */
cache.tmpBytes

/** Get total items */
cache.size

/** Get temporary items count */
cache.tmpSize
```

## Methods

### Add new entry to the cache
```javascript
const cache= new LRU_TTL();

/**
 * Add temporary item to the cache (TTL or LRU)
 * @Param MixedKey	- Any javascript type
 * @Param MixedValue - Any javascript value
 */
cache.set(MixedKey, MixedValue);

/**
 * Add Optional bytes
 * @Param {Integer} MixedValue_Size	- Size of mixedValue, used if cache is about files for example
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
cache.get(mixedKey);

/**
 * Get element from cache without updating
 * it's TLL or LRU
 * (Means not affect TTL or LRU)
 * @return value or undefined
 */
cache.peek(mixedKey);

/**
 * Get least recently used item
 * permanent items are not included
 */
cache.getLRU()

/**
 * Get least recently used item and removes it
 * Permanenet items are not included
 */
cache.pop()
```

### Check key exists
```javascript
cache.has(mixedKey)
```

### Upsert item (create it if not exist)

#### Sync mode: 
```javascript
// You need to set "upsert" callback logic when creating the cache
const cache= new LRU_TTL({
	upsert: function(key){ /* Logic */ }
});

// Or set it using ::upsertCb
cache.upsertCb= function(key){ /* Logic */};

/** Using ::get*/
var item= cache.get(mixedKey, true);

/** Using ::upsert */
var item= cache.upsert(mixedKey);
```

#### Async mode:
```javascript
// You need to set "upsert" callback logic when creating the cache
const cache= new LRU_TTL({
	upsert: async function(key){ /* Logic */ }
});

// Or set it using ::upsertCb
cache.upsertCb= async function(key){ /* Logic */};

/** Using ::get */
var item= await cache.get(mixedKey, true);

/** Using ::upsert */
var item= await cache.upsert(mixedKey);
```

### Remove item
```javascript
cache.delete(mixedKey);
```

### Clear items
```javascript
/** Remove items excluding permanents */
cache.clearTemp();

/** Remove all items */
cache.clearAll();
```

## Iterators
```javascript
/** Get all kies */
<Iterator(key)> cache.keys();

/** Get all values */
<Iterator(value)> cache.values();

/** Get all entries */
<Iterator([key, value])> cache.entries();
```

## Loops
```javascript
/** ForEach */
cache.forEach(function callback(value, key){}, optionalThisArg);

/** For ... of */
for([key, value] of cache){
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
const LRU_TTL= require('lru-ttl-cache');

const cache= new LRU_TTL({
	/**
	 * Set the TTL (time to live in milliseconds)
	 * Setting this to "Infinity" will disable the TTL behaviour of the cache
	 * @type Positive integer
	 */
	ttl: 3600000
});
```

## Use as LRU cache (Least recently used)
```javascript
const LRU_TTL= require('lru-ttl-cache');

const cache= new LRU_TTL({
	/**
	 * Set the maximum items count in the cache.
	 * When this value exceeded, the least used item will be removed
	 * Setting this to "Infinity" will disable the LRU behaviour of the cache
	 * @type Number
	 * @default Infinity
	 */
	max: 200
});
```

## Use as LRU cache with max bytes
```javascript
const LRU_TTL= require('lru-ttl-cache');

const cache= new LRU_TTL({
	/**
	 * Set the maximum memory size (in bytes) for the cache
	 * Will remove the least used elements if this value is exceeded
	 * Setting this to "Infinity" will disable this behaviour
	 * @type Number
	 * @default Infinity
	 */
	maxBytes: 2**20, // 1MB
});

// Expects a size of each element when inserting or updating it
// otherwise the size will be null
cache.set('key', value, bytes);

```

## Use cache with multiple behaviours

Just enable the required configuration.

# Credits

Khalid RAFIK

# Let's contribute
Open an issue or contact me: khalid.rfk@gmail.com

# Support
Open an issue or contact me: khalid.rfk@gmail.com

# Licence

MIT License

Copyright (c) 2021 rafikalid

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
