# lru-ttl-cache
Super fast in memory LRU and TTL cache

Accept any kind 

## Installation
```
npm i -S lru-ttl-cache
```

## Why to use:
- Fast in memory cache
- Use both TTL (Time To Live) and LRU (Least Recently Used) or one of theme only
- Could set an optional memory-size for each element and set a maximum size (bytes) for the whole cache
- Do not use a bunch of "setTimeout" with decrease performance and none a permanent "setInterval"
- Uses a “Map” instead of traditional “Object”. This increase performance regardless inserts and removes
- Could use any JavaScript type as a key (String, Numbers, BigInt, Objects, …) 

## Usage
```javascript
const LRU_TTL= require('lru-ttl-cache');

// Create the cache
const cache= new LRU_TTL(); // or new LRU_TTL(options)

// Add value to cache
cache.set('key', mixedValue); // MixedValue could be any javascript type
cache.set(mixedKey, mixedValue); // could use any javascript variable as a key

// Could optionally add the mixedValue size in memory.
// This enable us to remove elements based on total used memory.
// Useful when dealing with text content or files
cache.set(mixedKey, mixedValue, bytes);

// Get element from cache
cache.get('key');
cache.get(mixedKey);

// Remove element from the cache
cache.delete('key');
cache.remove(mixedKey);

// Remove all elements
cache.clear();

// Remove least used element
element= cache.pop();

// Check if the cache has a key
<Boolean> cache.has('key');
<Boolean> cache.has(mixedKey);

// Get all current kies
<Iterator(key)> cache.keys();

// Get all values
<Iterator(value)> cache.values();

// Get all entries
<Iterator([key, value])> cache.entries();

// ForEach
cache.forEach(function callback(element){});

// Change cache configuration
cache.setConfiguration(options);
```

## Options:

```javascript
const options= {
	/**
	 * Set the maximum entries in the cache for the LRU algorithm
	 * remove the least used element when this is exceeded
	 * @default  Infinity
	 */
	max: Infinity,
	/**
	 * Set the TTL (ms) of each element
	 * Removes the element if the ttl is exceeded
	 * The TTL is reset when getting ( via cache.get )
	 * or updating an element ( via cache.set )
	 * @default Infinity
	 */
	ttl: Infinity,
	/**
	 * Refresh the element when calling the cache.get method
	 * @default true
	 */
	refreshOnGet: true,
	/**
	 * Maximum cache size in bytes
	 * to use this, you need to add the size of each entrie
	 * via catch.set(key, value, bytes)
	 * @type {Number}
	 */
	maxBytes: Infinity
};
```