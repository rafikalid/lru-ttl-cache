import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import LRU_TTL, { TIME_UNIT } from './index';

describe('LRU_TTL - Basic Operations', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    cache = new LRU_TTL();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should set and get a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing value', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });

    it('should store multiple values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });

    it('should handle different data types', () => {
      const cacheObj = new LRU_TTL<string, any>();
      const obj = { a: 1, b: 2 };
      const arr = [1, 2, 3];
      const num = 42;

      cacheObj.set('obj', obj);
      cacheObj.set('arr', arr);
      cacheObj.set('num', num);

      expect(cacheObj.get('obj')).toBe(obj);
      expect(cacheObj.get('arr')).toBe(arr);
      expect(cacheObj.get('num')).toBe(num);
    });

    it('should return metadata from getMetadata', () => {
      cache.set('key1', 'value1');
      const metadata = cache.getMetadata('key1');
      expect(metadata).toBeDefined();
      expect(metadata?.key).toBe('key1');
      expect(metadata?.value).toBe('value1');
      expect(metadata?.addedAt).toBeDefined();
      expect(metadata?.lastAccessedAt).toBeDefined();
    });
  });

  describe('has', () => {
    it('should return true if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false if key does not exist', () => {
      expect(cache.has('key1')).toBe(false);
    });

    it('should return false after deletion', () => {
      cache.set('key1', 'value1');
      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('peek', () => {
    it('should return value without updating recency', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const peeked = cache.peek('key1');
      expect(peeked).toBe('value1');

      // key1 should still be LRU (not moved to MRU)
      expect(cache.lru).toBe('value1');
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.peek('nonexistent')).toBeUndefined();
    });

    it('should return metadata without updating recency', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const metadata = cache.peekMetadata('key1');
      expect(metadata?.value).toBe('value1');

      // key1 should still be LRU
      expect(cache.lru).toBe('value1');
    });
  });

  describe('size and count', () => {
    it('should return correct size', () => {
      expect(cache.size).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);
    });

    it('count should be deprecated alias for size', () => {
      cache.set('key1', 'value1');
      expect(cache.count).toBe(cache.size);
    });

    it('should update size after deletion', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size).toBe(2);
      cache.delete('key1');
      expect(cache.size).toBe(1);
    });

    it('should reset size after clear', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe('LRU and MRU tracking', () => {
    it('should track LRU (least recently used)', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.lru).toBe('value1');
    });

    it('should track MRU (most recently used)', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.mru).toBe('value3');
    });

    it('should update MRU after get', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.get('key1');
      expect(cache.mru).toBe('value1');
    });

    it('should return undefined for LRU/MRU when cache is empty', () => {
      expect(cache.lru).toBeUndefined();
      expect(cache.mru).toBeUndefined();
    });

    it('should return metadata for LRU and MRU', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const lruMeta = cache.lruMetadata;
      const mruMeta = cache.mruMetadata;

      expect(lruMeta?.value).toBe('value1');
      expect(mruMeta?.value).toBe('value3');
    });
  });
});

describe('LRU_TTL - LRU Enforcement', () => {
  it('should evict LRU item when max size is exceeded', () => {
    const cache = new LRU_TTL<string, string>({ max: 3 });
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');

    expect(cache.size).toBe(3);
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(true);
    expect(cache.has('key3')).toBe(true);
    expect(cache.has('key4')).toBe(true);
  });

  it('should evict multiple LRU items when needed', () => {
    const cache = new LRU_TTL<string, string>({ max: 2 });
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');

    expect(cache.size).toBe(2);
    expect(cache.has('key3')).toBe(true);
    expect(cache.has('key4')).toBe(true);
  });

  it('should not evict when within limits', () => {
    const cache = new LRU_TTL<string, string>({ max: 5 });
    for (let i = 1; i <= 3; i++) {
      cache.set(`key${i}`, `value${i}`);
    }
    expect(cache.size).toBe(3);
    for (let i = 1; i <= 3; i++) {
      expect(cache.has(`key${i}`)).toBe(true);
    }
  });

  it('should update LRU position on get', () => {
    const cache = new LRU_TTL<string, string>({ max: 2 });
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    // Access key1, making it MRU
    cache.get('key1');

    // Add new item, key2 should be evicted as it's now LRU
    cache.set('key3', 'value3');

    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key2')).toBe(false);
    expect(cache.has('key3')).toBe(true);
  });

  it('should handle Infinity max without eviction', () => {
    const cache = new LRU_TTL<string, string>({ max: Infinity });
    for (let i = 0; i < 100; i++) {
      cache.set(`key${i}`, `value${i}`);
    }
    expect(cache.size).toBe(100);
  });

  it('should accept string-based max values', () => {
    const cache = new LRU_TTL<string, string>({ max: '10' });
    expect(cache.evalMax).toBe(10);
  });

  it('should throw on invalid max value', () => {
    expect(() => {
      new LRU_TTL({ max: 0 });
    }).toThrow();

    expect(() => {
      new LRU_TTL({ max: -1 });
    }).toThrow();
  });
});

describe('LRU_TTL - Delete and Pop Operations', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    cache = new LRU_TTL();
  });

  describe('delete', () => {
    it('should delete an existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    it('should return false for non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should reduce size after deletion', () => {
      cache.set('key1', 'value1');
      expect(cache.size).toBe(1);
      cache.delete('key1');
      expect(cache.size).toBe(0);
    });
  });

  describe('pop', () => {
    it('should pop and return value by key', () => {
      cache.set('key1', 'value1');
      const value = cache.pop('key1');
      expect(value).toBe('value1');
      expect(cache.has('key1')).toBe(false);
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.pop('nonexistent')).toBeUndefined();
    });

    it('should return metadata when popping metadata', () => {
      cache.set('key1', 'value1');
      const metadata = cache.popMetadata('key1');
      expect(metadata?.value).toBe('value1');
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('popLRU and popMRU', () => {
    it('should pop and return LRU item', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const value = cache.popLRU();
      expect(value).toBe('value1');
      expect(cache.has('key1')).toBe(false);
    });

    it('should pop and return MRU item', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const value = cache.popMRU();
      expect(value).toBe('value2');
      expect(cache.has('key2')).toBe(false);
    });

    it('should return undefined when popping from empty cache', () => {
      expect(cache.popLRU()).toBeUndefined();
      expect(cache.popMRU()).toBeUndefined();
    });

    it('should pop metadata versions', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const lruMeta = cache.popLRUMetadata();
      expect(lruMeta?.value).toBe('value1');

      const mruMeta = cache.popMRUMetadata();
      expect(mruMeta?.value).toBe('value2');

      expect(cache.size).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all items', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(false);
    });

    it('should return deleted records', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const deleted = cache.clear();

      expect(deleted instanceof Map).toBe(true);
      expect(deleted.size).toBe(2);
    });
  });
});

describe('LRU_TTL - TTL (Time To Live)', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    cache = new LRU_TTL({ ttl: 50 });
  });

  afterEach(() => {
    cache.clear();
  });

  it('should expire items after TTL', async () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // TTL cleanup runs asynchronously, force it
    expect(cache.has('key1')).toBe(false);
  });

  it('should accept string-based TTL values', () => {
    const cache2 = new LRU_TTL({ ttl: '100ms' });
    expect(cache2.evalTTL).toBe(100);
  });

  it('should throw on invalid TTL', () => {
    expect(() => {
      new LRU_TTL({ ttl: -100 });
    }).toThrow();
  });

  it('should handle Infinity TTL', () => {
    const cache2 = new LRU_TTL({ ttl: Infinity });
    expect(cache2.evalTTL).toBe(Infinity);
  });

  it('should update lastAccessedAt on get', async () => {
    cache.set('key1', 'value1');
    const meta1 = cache.peekMetadata('key1');
    const firstAccess = meta1?.lastAccessedAt ?? 0;

    await new Promise((resolve) => setTimeout(resolve, 20));

    cache.get('key1');
    const meta2 = cache.peekMetadata('key1');
    const secondAccess = meta2?.lastAccessedAt ?? 0;

    expect(secondAccess).toBeGreaterThanOrEqual(firstAccess);
  });

  it('should not expire with Infinity TTL', async () => {
    const cache2 = new LRU_TTL<string, string>({ ttl: Infinity });
    cache2.set('key1', 'value1');

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(cache2.has('key1')).toBe(true);
  });

  it('should set TTL dynamically', async () => {
    const cache2 = new LRU_TTL<string, string>();
    cache2.set('key1', 'value1');

    cache2.ttl = 50;
    expect(cache2.evalTTL).toBe(50);
    expect(cache2.evalTtlAccuracy).toBe(TIME_UNIT);
    expect(cache2.has('key1')).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(cache2.has('key1')).toBe(false);
  });
});

describe('LRU_TTL - TTL Accuracy', () => {
  it('should use default TTL accuracy', () => {
    const cache = new LRU_TTL({ ttl: 1000 });
    // Default: ttl / 10
    expect(cache.evalTtlAccuracy).toBe(100);
  });

  it('should clamp TTL accuracy to minimum', () => {
    expect(() => {
      new LRU_TTL({ ttl: 1000, ttlAccuracy: 5 });
    }).toThrow();
  });

  it('should accept string-based TTL accuracy', () => {
    const cache = new LRU_TTL({ ttl: 1000, ttlAccuracy: '100ms' });
    expect(cache.evalTtlAccuracy).toBe(100);
  });

  it('should allow setting TTL accuracy after construction', () => {
    const cache = new LRU_TTL({ ttl: 1000 });
    cache.ttlAccuracy = '50ms';
    expect(cache.evalTtlAccuracy).toBe(50);
  });
});

describe('LRU_TTL - Resolvers', () => {
  it('should resolve missing keys with resolver', () => {
    const resolver = (key: string) => ({ value: `resolved_${key}` });
    const cache = new LRU_TTL<string, string>({
      defaultResolver: resolver as any,
    });

    const result = cache.resolve('key1');
    expect(result).toBe('resolved_key1');
    expect(cache.has('key1')).toBe(true);
  });

  it('should use provided resolver over default', () => {
    const defaultResolver = (key: string) => ({ value: `default_${key}` });
    const customResolver = (key: string) => ({ value: `custom_${key}` });

    const cache = new LRU_TTL<string, string>({
      defaultResolver: defaultResolver as any,
    });

    const result = cache.resolve('key1', customResolver as any);
    expect(result).toBe('custom_key1');
  });

  it('should throw when no resolver provided', () => {
    const cache = new LRU_TTL<string, string>();
    expect(() => {
      cache.resolve('key1');
    }).toThrow();
  });

  it('should handle null resolver result', () => {
    const resolver = () => null;
    const cache = new LRU_TTL<string, string>({
      defaultResolver: resolver as any,
    });

    const result = cache.resolve('key1');
    expect(result).toBeUndefined();
  });

  it('should support resolver arguments', () => {
    const resolver = (key: string, suffix: string) => ({ value: `${key}_${suffix}` });
    const cache = new LRU_TTL<string, string>();

    const result = cache.resolve('key1', resolver as any, 'custom');
    expect(result).toBe('key1_custom');
  });

  it('should use getOrInsert as alias for resolveMetadata', () => {
    const resolver = (key: string) => ({ value: `resolved_${key}` });
    const cache = new LRU_TTL<string, string>({
      defaultResolver: resolver as any,
    });

    const result = cache.getOrInsert('key1');
    expect(result).toBe('resolved_key1');
  });

  it('should handle Promise resolvers', async () => {
    const resolver = (key: string) => {
      return Promise.resolve({ value: `async_${key}` });
    };
    const cache = new LRU_TTL<string, string | Promise<string>>({
      defaultResolver: resolver,
    });

    cache.resolveMetadata('key1');
    expect(cache.has('key1')).toBe(true);

    // Value is initially a pending promise
    const metadata = cache.peekMetadata('key1');
    expect(metadata?.value instanceof Promise).toBe(true);

    // Wait for resolution
    await new Promise((resolve) => setTimeout(resolve, 10));
    await (metadata?.value as Promise<string>);

    const finalValue = cache.get('key1');
    expect(finalValue).toBe('async_key1');
  });

  it('should delete entry if Promise resolver returns null', async () => {
    const resolver = (key: string) => Promise.resolve(null);
    const cache = new LRU_TTL<string, string>({
      defaultResolver: resolver as any,
    });

    cache.resolveMetadata('key1');
    expect(cache.has('key1')).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(cache.has('key1')).toBe(false);
  });

  it('should handle Promise resolver errors', async () => {
    const resolver = () => Promise.reject(new Error('resolver error'));
    const cache = new LRU_TTL<string, Promise<string>>({
      defaultResolver: resolver,
    });

    const resultP = cache.resolveMetadata('key1');
    expect(cache.has('key1')).toBe(true);
    await expect(resultP?.value).rejects.toThrow('resolver error');

    expect(cache.has('key1')).toBe(false);
  });
});

describe('LRU_TTL - Initialization', () => {
  it('should initialize from entries array', () => {
    const entries: [string, string][] = [
      ['key1', 'value1'],
      ['key2', 'value2'],
    ];
    const cache = new LRU_TTL({ entries });

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
  });

  it('should initialize from Map', () => {
    const map = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);
    const cache = new LRU_TTL({ entries: map });

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
  });

  it('should initialize from another LRU_TTL', () => {
    const cache1 = new LRU_TTL<string, string>();
    cache1.set('key1', 'value1');
    cache1.set('key2', 'value2');

    const cache2 = new LRU_TTL({ entries: cache1 });

    expect(cache2.get('key1')).toBe('value1');
    expect(cache2.get('key2')).toBe('value2');
  });

  it('should initialize with options', () => {
    const cache = new LRU_TTL({
      max: 10,
      ttl: 1000,
      ttlAccuracy: 100,
    });

    expect(cache.evalMax).toBe(10);
    expect(cache.evalTTL).toBe(1000);
    expect(cache.evalTtlAccuracy).toBe(100);
  });
});

describe('LRU_TTL - setFrom', () => {
  it('should set from array of entries', () => {
    const cache = new LRU_TTL<string, string>();
    cache.setFrom([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
  });

  it('should set from Map', () => {
    const cache = new LRU_TTL<string, string>();
    const map = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);
    cache.setFrom(map);

    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
  });

  it('should set from another LRU_TTL', () => {
    const cache1 = new LRU_TTL<string, string>();
    cache1.set('key1', 'value1');

    const cache2 = new LRU_TTL<string, string>();
    cache2.setFrom(cache1);

    expect(cache2.get('key1')).toBe('value1');
  });

  it('should throw on invalid source', () => {
    const cache = new LRU_TTL<string, string>();
    expect(() => {
      cache.setFrom({ key: 'value' } as any);
    }).toThrow();
  });

  it('should return cache instance for chaining', () => {
    const cache = new LRU_TTL<string, string>();
    const result = cache.setFrom([['key1', 'value1']]);
    expect(result).toBe(cache);
  });
});

describe('LRU_TTL - Iterators', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    cache = new LRU_TTL();
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
  });

  describe('for...of with [Symbol.iterator]', () => {
    it('should iterate over entries', () => {
      const values: string[] = [];
      for (const entry of cache) {
        values.push(entry.value);
      }
      expect(values).toContain('value1');
      expect(values).toContain('value2');
      expect(values).toContain('value3');
      expect(values.length).toBe(3);
    });
  });

  describe('entries()', () => {
    it('should return key-value pairs', () => {
      const entries = Array.from(cache.entries());
      expect(entries.length).toBe(3);
      expect(entries).toContainEqual(['key1', 'value1']);
      expect(entries).toContainEqual(['key2', 'value2']);
      expect(entries).toContainEqual(['key3', 'value3']);
    });
  });

  describe('keys()', () => {
    it('should return all keys', () => {
      const keys = Array.from(cache.keys());
      expect(keys.length).toBe(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });

  describe('values()', () => {
    it('should return all values', () => {
      const values = Array.from(cache.values());
      expect(values.length).toBe(3);
      expect(values).toContain('value1');
      expect(values).toContain('value2');
      expect(values).toContain('value3');
    });
  });

  describe('entriesMetadata()', () => {
    it('should return metadata for all entries', () => {
      const entries = Array.from(cache.entriesMetadata());
      expect(entries.length).toBe(3);
      expect(entries[0].value).toBeDefined();
      expect(entries[0].key).toBeDefined();
    });
  });

  describe('forEach()', () => {
    it('should iterate with callback', () => {
      const values: string[] = [];
      cache.forEach((value) => {
        values.push(value);
      });
      expect(values.length).toBe(3);
      expect(values).toContain('value1');
    });

    it('should provide key and metadata in callback', () => {
      const keys: string[] = [];
      const metadataCount = { count: 0 };

      cache.forEach((value, key, cacheRef, metadata) => {
        keys.push(key);
        if (metadata) metadataCount.count++;
      });

      expect(keys.length).toBe(3);
      expect(metadataCount.count).toBe(3);
    });

    it('should support thisArg', () => {
      const context = { values: [] as string[] };
      cache.forEach(function (value) {
        this.values.push(value);
      }, context);

      expect(context.values.length).toBe(3);
    });
  });

  describe('groupBy()', () => {
    it('should group entries by key', () => {
      cache.clear();
      cache.set('a1', 'value1');
      cache.set('a2', 'value2');
      cache.set('b1', 'value3');

      const grouped = cache.groupBy((value, key) => key.charAt(0));

      expect(grouped.has('a')).toBe(true);
      expect(grouped.has('b')).toBe(true);
      expect(grouped.get('a')).toHaveLength(2);
      expect(grouped.get('b')).toHaveLength(1);
    });

    it('should support thisArg', () => {
      const context = { prefix: 'val' };

      const grouped = cache.groupBy(function (value) {
        return value.startsWith(this.prefix);
      }, context);

      expect(grouped.size).toBe(1);
    });
  });

  describe('[Symbol.asyncIterator]', () => {
    it('should iterate over entries asynchronously', async () => {
      const values: string[] = [];
      for await (const entry of cache) {
        values.push(entry.value);
      }
      expect(values.length).toBe(3);
    });

    it('should handle Promise values', async () => {
      cache.clear();
      cache.set('key1', Promise.resolve('value1') as any);
      cache.set('key2', 'value2');

      const values: string[] = [];
      for await (const entry of cache) {
        values.push(entry.value);
      }

      expect(values).toContain('value1');
      expect(values).toContain('value2');
    });
  });
});

describe('LRU_TTL - Static Methods', () => {
  it('should create cache from array', () => {
    const cache = LRU_TTL.from([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);

    expect(cache.get('key1')).toBe('value1');
    expect(cache.size).toBe(2);
  });

  it('should create cache from Map', () => {
    const map = new Map([['key1', 'value1']]);
    const cache = LRU_TTL.from(map);

    expect(cache.get('key1')).toBe('value1');
  });

  it('should create cache with options', () => {
    const cache = LRU_TTL.from([['key1', 'value1']], { max: 10, ttl: 1000 });

    expect(cache.evalMax).toBe(10);
    expect(cache.evalTTL).toBe(1000);
  });
});

describe('LRU_TTL - Edge Cases', () => {
  it('should handle empty cache operations', () => {
    const cache = new LRU_TTL<string, string>();

    expect(cache.size).toBe(0);
    expect(cache.lru).toBeUndefined();
    expect(cache.mru).toBeUndefined();
    expect(cache.popLRU()).toBeUndefined();
    expect(cache.popMRU()).toBeUndefined();
  });

  it('should handle single item cache', () => {
    const cache = new LRU_TTL<string, string>();
    cache.set('key1', 'value1');

    expect(cache.lru).toBe('value1');
    expect(cache.mru).toBe('value1');
    expect(cache.size).toBe(1);
  });

  it('should handle same key updates', () => {
    const cache = new LRU_TTL<string, string>();
    cache.set('key1', 'value1');
    cache.set('key1', 'value2');
    cache.set('key1', 'value3');

    expect(cache.size).toBe(1);
    expect(cache.get('key1')).toBe('value3');
  });

  it('should handle rapid add/remove cycles', () => {
    const cache = new LRU_TTL<string, string>({ max: 2 });

    for (let i = 0; i < 10; i++) {
      cache.set(`key${i}`, `value${i}`);
    }

    expect(cache.size).toBe(2);
  });

  it('should handle null and undefined values', () => {
    const cache = new LRU_TTL<string, any>();

    cache.set('nullKey', null);
    cache.set('undefinedKey', undefined);

    expect(cache.get('nullKey')).toBe(null);
    expect(cache.get('undefinedKey')).toBeUndefined();
  });

  it('should handle numeric keys', () => {
    const cache = new LRU_TTL<number, string>();
    cache.set(1, 'value1');
    cache.set(2, 'value2');

    expect(cache.get(1)).toBe('value1');
    expect(cache.has(2)).toBe(true);
  });

  it('should handle object keys', () => {
    const cache = new LRU_TTL<object, string>();
    const key1 = { id: 1 };
    const key2 = { id: 2 };

    cache.set(key1, 'value1');
    cache.set(key2, 'value2');

    expect(cache.get(key1)).toBe('value1');
    expect(cache.has(key2)).toBe(true);
  });

  it('should handle Symbol keys', () => {
    const cache = new LRU_TTL<symbol, string>();
    const sym1 = Symbol('key1');
    const sym2 = Symbol('key2');

    cache.set(sym1, 'value1');
    cache.set(sym2, 'value2');

    expect(cache.get(sym1)).toBe('value1');
    expect(cache.size).toBe(2);
  });
});

describe('LRU_TTL - Properties', () => {
  it('should validate and set max property', () => {
    const cache = new LRU_TTL<string, string>();

    cache.max = 100;
    expect(cache.evalMax).toBe(100);

    cache.max = '1K';
    expect(cache.evalMax).toBe(1000);
  });

  it('should validate and set ttl property', () => {
    const cache = new LRU_TTL<string, string>();

    cache.ttl = 5000;
    expect(cache.evalTTL).toBe(5000);

    cache.ttl = '5s';
    expect(cache.evalTTL).toBe(5000);
  });

  it('should validate and set defaultResolver', () => {
    const cache = new LRU_TTL<string, string>();
    const resolver = (key: string) => ({ value: key });

    cache.defaultResolver = resolver as any;
    expect(cache.defaultResolver).toBe(resolver);

    cache.defaultResolver = undefined;
    expect(cache.defaultResolver).toBeUndefined();
  });

  it('should throw on invalid defaultResolver', () => {
    const cache = new LRU_TTL<string, string>();

    expect(() => {
      cache.defaultResolver = 'not a function' as any;
    }).toThrow();
  });
});
