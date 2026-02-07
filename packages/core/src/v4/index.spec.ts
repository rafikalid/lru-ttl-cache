import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import LRU_TTL, {
  TTL_ACCURACY_DEFAULT,
  TTL_ACCURACY_DEFAULT_FRAG,
  TTL_ACCURACY_MIN,
} from './index';
import type { Metadata, Resolver } from './types';

describe('LRU_TTL - Constructor and Options', () => {
  it('should create an empty cache with default options', () => {
    const cache = new LRU_TTL();
    expect(cache.size).toBe(0);
    expect(cache.evalMax).toBe(Infinity);
    expect(cache.evalTTL).toBe(Infinity);
  });

  it('should create cache with max option', () => {
    const cache = new LRU_TTL({ max: 5 });
    expect(cache.evalMax).toBe(5);
    expect(cache.max).toBe(5);
  });

  it('should create cache with ttl option', () => {
    const cache = new LRU_TTL({ ttl: 1000 });
    expect(cache.evalTTL).toBe(1000);
    expect(cache.ttl).toBe(1000);
  });

  it('should create cache with ttlAccuracy option', () => {
    const cache = new LRU_TTL({ ttl: 5000, ttlAccuracy: 500 });
    expect(cache.evalTtlAccuracy).toBe(500);
  });

  it('should create cache with all options', () => {
    const cache = new LRU_TTL({ max: 10, ttl: 2000, ttlAccuracy: 200 });
    expect(cache.evalMax).toBe(10);
    expect(cache.evalTTL).toBe(2000);
    expect(cache.evalTtlAccuracy).toBe(200);
    cache.destroy();
  });

  it('should handle string max values', () => {
    const cache = new LRU_TTL({ max: '5k' });
    expect(cache.evalMax).toBe(5000);
  });

  it('should handle string ttl values', () => {
    const cache = new LRU_TTL({ ttl: '2s' });
    expect(cache.evalTTL).toBe(2000);
    cache.destroy();
  });

  it('should handle string ttlAccuracy values', () => {
    const cache = new LRU_TTL({ ttl: '5s', ttlAccuracy: '500ms' });
    expect(cache.evalTtlAccuracy).toBe(500);
    cache.destroy();
  });
});

describe('LRU_TTL v4 - Basic Operations', () => {
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
      expect(cache.size).toBe(1);
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing value', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
      expect(cache.size).toBe(1);
    });

    it('should store multiple values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.size).toBe(3);
    });

    it('should handle different data types', () => {
      const cacheAny = new LRU_TTL<string, any>();
      const obj = { a: 1, b: 2 };
      const arr = [1, 2, 3];
      const num = 42;

      cacheAny.set('obj', obj);
      cacheAny.set('arr', arr);
      cacheAny.set('num', num);

      expect(cacheAny.get('obj')).toBe(obj);
      expect(cacheAny.get('arr')).toBe(arr);
      expect(cacheAny.get('num')).toBe(num);
      cacheAny.destroy();
    });

    it('should update lastAccessedAt on get', () => {
      vi.useFakeTimers();
      cache.set('key1', 'value1');
      const metadata1 = cache.peekMetadata('key1');

      vi.advanceTimersByTime(100);
      cache.get('key1');

      const metadata2 = cache.peekMetadata('key1');
      expect(metadata2?.lastAccessedAt).toBeGreaterThan(metadata1!.lastAccessedAt);
      vi.useRealTimers();
    });

    it('should return this for chaining', () => {
      const result = cache.set('key1', 'value1');
      expect(result).toBe(cache);
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

  describe('peek and peekMetadata', () => {
    it('should return value without updating access time', () => {
      vi.useFakeTimers();
      cache.set('key1', 'value1');
      const metadata1 = cache.peekMetadata('key1');

      vi.advanceTimersByTime(100);
      const value = cache.peek('key1');

      const metadata2 = cache.peekMetadata('key1');
      expect(value).toBe('value1');
      expect(metadata2?.lastAccessedAt).toBe(metadata1?.lastAccessedAt);
      vi.useRealTimers();
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.peek('nonexistent')).toBeUndefined();
      expect(cache.peekMetadata('nonexistent')).toBeUndefined();
    });

    it('should return metadata with correct structure', () => {
      cache.set('key1', 'value1');
      const metadata = cache.peekMetadata('key1');
      expect(metadata).toHaveProperty('value');
      expect(metadata).toHaveProperty('lastAccessedAt');
      expect(metadata?.value).toBe('value1');
      expect(typeof metadata?.lastAccessedAt).toBe('number');
    });
  });

  describe('delete and clear', () => {
    it('should delete a key', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    it('should return false when deleting non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size).toBe(0);
    });
  });

  describe('pop and popLRU', () => {
    it('should pop a value and remove it from cache', () => {
      cache.set('key1', 'value1');
      const value = cache.pop('key1');
      expect(value).toBe('value1');
      expect(cache.has('key1')).toBe(false);
    });

    it('should return undefined when popping non-existent key', () => {
      expect(cache.pop('nonexistent')).toBeUndefined();
    });

    it('should pop LRU entry', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const result = cache.popLRU();
      expect(result).toBeDefined();
      expect(result![0]).toBe('key1'); // key
      expect(result![1]).toBe('value1'); // value
      expect(result![2]).toHaveProperty('value', 'value1'); // metadata
      expect(cache.size).toBe(2);
    });

    it('should return undefined when popping from empty cache', () => {
      expect(cache.popLRU()).toBeUndefined();
    });
  });
});

describe('LRU_TTL v4 - LRU Behavior', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    cache = new LRU_TTL({ max: 3 });
  });

  afterEach(() => {
    cache.clear();
  });

  it('should evict LRU item when max is exceeded', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4'); // should evict key1

    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(true);
    expect(cache.has('key3')).toBe(true);
    expect(cache.has('key4')).toBe(true);
    expect(cache.size).toBe(3);
  });

  it('should update recency on get', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    cache.get('key1'); // move key1 to MRU
    cache.set('key4', 'value4'); // should evict key2

    expect(cache.has('key1')).toBe(true);
    expect(cache.has('key2')).toBe(false);
    expect(cache.has('key3')).toBe(true);
    expect(cache.has('key4')).toBe(true);
  });

  it('should update recency on set to existing key', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    cache.set('key1', 'value1-updated'); // move key1 to MRU
    cache.set('key4', 'value4'); // should evict key2

    expect(cache.has('key1')).toBe(true);
    expect(cache.get('key1')).toBe('value1-updated');
    expect(cache.has('key2')).toBe(false);
  });

  it('should get LRU value', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    expect(cache.lru).toBe('value1');
  });

  it('should get LRU key', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    expect(cache.lruKey).toBe('key1');
  });

  it('should get LRU metadata', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    const metadata = cache.lruMetadata;
    expect(metadata?.value).toBe('value1');
    expect(metadata).toHaveProperty('lastAccessedAt');
  });

  it('should return undefined for lru on empty cache', () => {
    expect(cache.lru).toBeUndefined();
    expect(cache.lruKey).toBeUndefined();
    expect(cache.lruMetadata).toBeUndefined();
  });

  it('should enforce max when changed', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    cache.max = 2;
    expect(cache.size).toBe(2);
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(true);
    expect(cache.has('key3')).toBe(true);
  });

  it('should not evict when max is Infinity', () => {
    cache.max = Infinity;
    for (let i = 0; i < 100; i++) {
      cache.set(`key${i}`, `value${i}`);
    }
    expect(cache.size).toBe(100);
  });
});

describe('LRU_TTL v4 - Max Property', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    cache = new LRU_TTL();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should set and get max value', () => {
    cache.max = 10;
    expect(cache.max).toBe(10);
    expect(cache.evalMax).toBe(10);
  });

  it('should parse string max values', () => {
    cache.max = '5k';
    expect(cache.evalMax).toBe(5000);
    expect(cache.max).toBe('5k');
  });

  it('should throw error for invalid max values', () => {
    expect(() => {
      cache.max = 0;
    }).toThrow('Invalid max value: 0');

    expect(() => {
      cache.max = -1;
    }).toThrow('Invalid max value: -1');
  });

  it('should enforce max limits immediately when max is set', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    cache.max = 2;
    expect(cache.size).toBe(2);
  });
});

describe('LRU_TTL v4 - TTL Behavior', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cache?.destroy();
    vi.useRealTimers();
  });

  it('should expire items after TTL', async () => {
    cache = new LRU_TTL({ ttl: 1000, ttlAccuracy: 100 });
    cache.set('key1', 'value1');

    expect(cache.get('key1')).toBe('value1');

    vi.advanceTimersByTime(1100);
    await vi.runAllTimersAsync();

    expect(cache.get('key1')).toBeUndefined();
  });

  it('should refresh TTL on access', async () => {
    cache = new LRU_TTL({ ttl: 1000, ttlAccuracy: 100 });
    cache.set('key1', 'value1');

    vi.advanceTimersByTime(500);
    cache.get('key1'); // refresh

    vi.advanceTimersByTime(600);
    await vi.runAllTimersAsync();

    expect(cache.get('key1')).toBe('value1');
  });

  it('should not expire items when TTL is Infinity', async () => {
    cache = new LRU_TTL({ ttl: Infinity });
    cache.set('key1', 'value1');

    vi.advanceTimersByTime(100000);
    await vi.runAllTimersAsync();

    expect(cache.get('key1')).toBe('value1');
  });

  it('should handle multiple items with different access times', async () => {
    cache = new LRU_TTL({ ttl: 1000, ttlAccuracy: 100 });

    cache.set('key1', 'value1');
    vi.advanceTimersByTime(500);
    cache.set('key2', 'value2');

    vi.advanceTimersByTime(600);
    await vi.runAllTimersAsync();

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
  });

  it('should stop checking after finding non-expired item', async () => {
    cache = new LRU_TTL({ ttl: 1000, ttlAccuracy: 100 });

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    vi.advanceTimersByTime(500);
    cache.get('key2'); // refresh key2
    cache.get('key3'); // refresh key3

    vi.advanceTimersByTime(600);
    await vi.runAllTimersAsync();

    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(true);
    expect(cache.has('key3')).toBe(true);
  });
});

describe('LRU_TTL v4 - TTL Property', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    cache = new LRU_TTL();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should set and get ttl value', () => {
    cache.ttl = 1000;
    expect(cache.ttl).toBe(1000);
    expect(cache.evalTTL).toBe(1000);
  });

  it('should parse string ttl values', () => {
    cache.ttl = '2s';
    expect(cache.evalTTL).toBe(2000);
    expect(cache.ttl).toBe('2s');
    cache.destroy();
  });

  it('should throw error for invalid ttl values', () => {
    expect(() => {
      cache.ttl = -1;
    }).toThrow('Invalid ttl value: -1');

    expect(() => {
      cache.ttl = NaN;
    }).toThrow('Invalid ttl value: NaN');
  });

  it('should accept Infinity as ttl', () => {
    cache.ttl = Infinity;
    expect(cache.evalTTL).toBe(Infinity);
  });

  it('should initialize ttlAccuracy when ttl is set', () => {
    cache.ttl = 5000;
    expect(cache.evalTtlAccuracy).toBe(
      Math.max(Math.ceil(5000 / TTL_ACCURACY_DEFAULT_FRAG), TTL_ACCURACY_DEFAULT),
    );
    cache.destroy();
  });
});

describe('LRU_TTL v4 - TTL Accuracy', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    cache = new LRU_TTL();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should set and get ttlAccuracy value', () => {
    cache.ttl = 5000;
    cache.ttlAccuracy = 500;
    expect(cache.evalTtlAccuracy).toBe(500);
  });

  it('should parse string ttlAccuracy values', () => {
    cache.ttl = 5000;
    cache.ttlAccuracy = '500ms';
    expect(cache.evalTtlAccuracy).toBe(500);
    cache.destroy();
  });

  it('should use default ttlAccuracy when not specified', () => {
    cache.ttl = 5000;
    const expected = Math.max(Math.ceil(5000 / TTL_ACCURACY_DEFAULT_FRAG), TTL_ACCURACY_DEFAULT);
    expect(cache.evalTtlAccuracy).toBe(expected);
    cache.destroy();
  });

  it('should throw error when ttlAccuracy is below minimum', () => {
    expect(() => {
      cache.ttl = 5000;
      cache.ttlAccuracy = 50; // below TTL_ACCURACY_MIN
    }).toThrow(`Invalid ttlAccuracy value: 50. Minimum is ${TTL_ACCURACY_MIN}ms`);
  });

  it('should throw error when ttlAccuracy is Infinity with finite ttl', () => {
    cache.ttl = 5000;
    cache.ttlAccuracy = Infinity;

    expect(() => {
      cache.set('key1', 'value1'); // triggers interval setup
    }).toThrow('Invalid ttlAccuracy value: cannot be Infinity when ttl is set');
  });

  it('should return ttlAccuracy when set explicitly', () => {
    cache.ttl = 5000;
    cache.ttlAccuracy = 500;
    expect(cache.ttlAccuracy).toBe(500);
  });

  it('should return computed value when ttlAccuracy not set', () => {
    cache.ttl = 5000;
    const expected = Math.max(Math.ceil(5000 / TTL_ACCURACY_DEFAULT_FRAG), TTL_ACCURACY_DEFAULT);
    expect(cache.ttlAccuracy).toBe(expected);
    cache.destroy();
  });
});

describe('LRU_TTL v4 - Resolver and defaultResolver', () => {
  let cache: LRU_TTL<string, string | Promise<string>>;

  beforeEach(() => {
    cache = new LRU_TTL();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should set and get defaultResolver', () => {
    const resolver: Resolver<string, string, [string]> = (key, arg) => ({ value: `${key}-${arg}` });
    cache.defaultResolver = resolver;
    expect(cache.defaultResolver).toBe(resolver);
  });

  it('should throw error when defaultResolver is not a function', () => {
    expect(() => {
      cache.defaultResolver = 'not a function' as any;
    }).toThrow('defaultResolver must be a function or undefined');
  });

  it('should allow setting defaultResolver to undefined', () => {
    const resolver: Resolver<string, string, [string]> = (key) => ({ value: key });
    cache.defaultResolver = resolver;
    cache.defaultResolver = undefined;
    expect(cache.defaultResolver).toBeUndefined();
  });

  it('should resolve value using defaultResolver', () => {
    cache.defaultResolver = (key, suffix) => ({ value: `${key}-${suffix}` });
    const value = cache.resolve('key1', undefined, 'suffix');
    expect(value).toBe('key1-suffix');
    expect(cache.has('key1')).toBe(true);
  });

  it('should resolve value using inline resolver', () => {
    const resolver: Resolver<string, string, [string]> = (key, suffix) => ({
      value: `${key}-${suffix}`,
    });
    const value = cache.resolve('key1', resolver, 'inline');
    expect(value).toBe('key1-inline');
  });

  it('should return cached value without calling resolver', () => {
    cache.set('key1', 'cached-value');
    const resolver = vi.fn((key) => ({ value: key }));
    const value = cache.resolve('key1', resolver);
    expect(value).toBe('cached-value');
    expect(resolver).not.toHaveBeenCalled();
  });

  it('should throw error when no resolver is provided', () => {
    expect(() => {
      cache.resolve('key1');
    }).toThrow('No resolver function provided for key: key1');
  });

  it('should return undefined when resolver returns null', () => {
    const resolver: Resolver<string, string> = () => null;
    const value = cache.resolve('key1', resolver);
    expect(value).toBeUndefined();
    expect(cache.has('key1')).toBe(false);
  });

  it('should return undefined when resolver returns undefined', () => {
    const resolver: Resolver<string, string> = () => undefined;
    const value = cache.resolve('key1', resolver);
    expect(value).toBeUndefined();
    expect(cache.has('key1')).toBe(false);
  });

  it('should handle async resolver', async () => {
    const resolver: Resolver<string, Promise<string>> = async (key) => ({ value: `async-${key}` });
    const result = cache.resolve('key1', resolver);

    expect(result).toBeInstanceOf(Promise);
    const value = await result;
    expect(value).toBe('async-key1');
  });

  it('should handle async resolver rejection', async () => {
    const resolver: Resolver<string, Promise<string>> = async () => {
      throw new Error('Resolver error');
    };
    const result = cache.resolve('key1', resolver);

    await expect(result).rejects.toThrow('Resolver error');
    expect(cache.has('key1')).toBe(false);
  });

  it('should update cache when async resolver resolves', async () => {
    const resolver: Resolver<string, Promise<string>> = async (key) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ value: `async-${key}` }), 10);
      });
    };

    const resultPromise = cache.resolve('key1', resolver);
    expect(cache.peek('key1')).toBeInstanceOf(Promise);

    await resultPromise;
    expect(cache.peek('key1')).toBe('async-key1');
  });

  it('should delete cache entry when async resolver returns null', async () => {
    const resolver: Resolver<string, Promise<string>> = async () => null;
    const result = cache.resolve('key1', resolver);

    await result;
    expect(cache.has('key1')).toBe(false);
  });

  it('should not update if cache was modified before async resolver completes', async () => {
    const resolver: Resolver<string, Promise<string>> = async (key) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ value: `async-${key}` }), 10);
      });
    };

    cache.resolve('key1', resolver);
    cache.set('key1', 'manual-value');

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(cache.get('key1')).toBe('manual-value');
  });
});

describe('LRU_TTL v4 - getOrInsert', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    cache = new LRU_TTL();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should be an alias for resolve', () => {
    cache.defaultResolver = (key, suffix) => ({ value: `${key}-${suffix}` });
    const value = cache.getOrInsert('key1', undefined, 'test');
    expect(value).toBe('key1-test');
  });

  it('should return cached value', () => {
    cache.set('key1', 'cached');
    const value = cache.getOrInsert('key1', (k) => ({ value: 'new' }));
    expect(value).toBe('cached');
  });
});

describe('LRU_TTL v4 - resolveMetadata', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    cache = new LRU_TTL();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should return metadata for existing entry', () => {
    cache.set('key1', 'value1');
    const metadata = cache.resolveMetadata('key1', (k) => ({ value: 'new' }));
    expect(metadata?.value).toBe('value1');
    expect(metadata).toHaveProperty('lastAccessedAt');
  });

  it('should resolve and return metadata', () => {
    const resolver: Resolver<string, string, [string]> = (key, suffix) => ({
      value: `${key}-${suffix}`,
    });
    const metadata = cache.resolveMetadata('key1', resolver, 'test');
    expect(metadata?.value).toBe('key1-test');
    expect(metadata).toHaveProperty('lastAccessedAt');
  });

  it('should return undefined when resolver returns null', () => {
    const resolver: Resolver<string, string> = () => null;
    const metadata = cache.resolveMetadata('key1', resolver);
    expect(metadata).toBeUndefined();
  });
});

describe('LRU_TTL v4 - setFrom and static from', () => {
  let cache: LRU_TTL<string, string>;

  beforeEach(() => {
    cache = new LRU_TTL();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should set from another LRU_TTL instance', () => {
    const source = new LRU_TTL<string, string>();
    source.set('key1', 'value1');
    source.set('key2', 'value2');

    cache.setFrom(source);
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
    source.destroy();
  });

  it('should set from Map', () => {
    const source = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);

    cache.setFrom(source);
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
  });

  it('should set from array of tuples', () => {
    const source: [string, string][] = [
      ['key1', 'value1'],
      ['key2', 'value2'],
    ];

    cache.setFrom(source);
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
  });

  it('should set from iterable', () => {
    const source: Iterable<[string, string]> = (function* () {
      yield ['key1', 'value1'];
      yield ['key2', 'value2'];
    })();

    cache.setFrom(source);
    expect(cache.get('key1')).toBe('value1');
    expect(cache.get('key2')).toBe('value2');
  });

  it('should throw error for invalid source type', () => {
    expect(() => {
      cache.setFrom('invalid' as any);
    }).toThrow('Invalid source type for LRU_TTL.from()');
  });

  it('should create cache from Map using static from', () => {
    const source = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
    ]);

    const newCache = LRU_TTL.from(source, { max: 10 });
    expect(newCache.get('key1')).toBe('value1');
    expect(newCache.evalMax).toBe(10);
    newCache.destroy();
  });

  it('should create cache from LRU_TTL using static from', () => {
    const source = new LRU_TTL<string, string>();
    source.set('key1', 'value1');

    const newCache = LRU_TTL.from(source);
    expect(newCache.get('key1')).toBe('value1');
    source.destroy();
    newCache.destroy();
  });

  it('should return this for chaining', () => {
    const source = new Map([['key1', 'value1']]);
    const result = cache.setFrom(source);
    expect(result).toBe(cache);
  });
});

describe('LRU_TTL v4 - Async Iterator', () => {
  let cache: LRU_TTL<string, string | Promise<string>>;

  beforeEach(() => {
    cache = new LRU_TTL();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should iterate over sync entries', async () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    const entries: [string, Metadata<string>][] = [];
    for await (const entry of cache) {
      entries.push(entry);
    }

    expect(entries.length).toBe(2);
    expect(entries[0][0]).toBe('key1');
    expect(entries[0][1].value).toBe('value1');
    expect(entries[1][0]).toBe('key2');
    expect(entries[1][1].value).toBe('value2');
  });

  it('should handle async resolver entries', async () => {
    const resolver: Resolver<string, Promise<string>> = async (key) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ value: `async-${key}` }), 10);
      });
    };

    cache.set('key1', 'value1');
    cache.resolve('key2', resolver);

    const entries: [string, Metadata<string>][] = [];
    for await (const entry of cache) {
      entries.push(entry);
    }

    expect(entries.length).toBe(2);
    expect(entries.some(([k]) => k === 'key1')).toBe(true);
    expect(entries.some(([k]) => k === 'key2')).toBe(true);
  });

  it('should yield resolved entries immediately', async () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    const resolver: Resolver<string, Promise<string>> = async (key) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ value: `async-${key}` }), 100);
      });
    };
    cache.resolve('key3', resolver);

    const entries: [string, Metadata<string>][] = [];
    const iterator = cache[Symbol.asyncIterator]();

    // First entries should be immediate
    const first = await iterator.next();
    expect(first.done).toBe(false);
    expect(first.value[1].value).not.toBeInstanceOf(Promise);
  });
});

describe('LRU_TTL v4 - Destroy and Dispose', () => {
  it('should clear cache on destroy', () => {
    const cache = new LRU_TTL<string, string>();
    cache.set('key1', 'value1');
    cache.destroy();
    expect(cache.size).toBe(0);
  });

  it('should clear interval on destroy', () => {
    vi.useFakeTimers();
    const cache = new LRU_TTL<string, string>({ ttl: 1000, ttlAccuracy: 100 });
    cache.set('key1', 'value1');

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    cache.destroy();

    expect(clearIntervalSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should support Symbol.dispose', () => {
    const cache = new LRU_TTL<string, string>();
    cache.set('key1', 'value1');
    cache[Symbol.dispose]();
    expect(cache.size).toBe(0);
  });

  it('should support dispose method', () => {
    const cache = new LRU_TTL<string, string>();
    cache.set('key1', 'value1');
    cache.dispose();
    expect(cache.size).toBe(0);
  });

  it('should handle multiple destroy calls', () => {
    const cache = new LRU_TTL<string, string>();
    cache.destroy();
    expect(() => cache.destroy()).not.toThrow();
  });

  it('should unregister from finalization registry', () => {
    vi.useFakeTimers();
    const cache = new LRU_TTL<string, string>({ ttl: 1000 });
    cache.set('key1', 'value1');
    cache.destroy();
    vi.useRealTimers();
  });
});

describe('LRU_TTL v4 - Edge Cases', () => {
  let cache: LRU_TTL<string, Promise<string> | string>;

  beforeEach(() => {
    cache = new LRU_TTL();
  });

  afterEach(() => {
    cache.clear();
  });

  it('should handle setting same key multiple times', () => {
    cache.set('key1', 'value1');
    cache.set('key1', 'value2');
    cache.set('key1', 'value3');
    expect(cache.get('key1')).toBe('value3');
    expect(cache.size).toBe(1);
  });

  it('should handle empty cache operations', () => {
    expect(cache.size).toBe(0);
    expect(cache.get('key1')).toBeUndefined();
    expect(cache.peek('key1')).toBeUndefined();
    expect(cache.pop('key1')).toBeUndefined();
    expect(cache.popLRU()).toBeUndefined();
    expect(cache.lru).toBeUndefined();
  });

  it('should handle numeric keys', () => {
    const numCache = new LRU_TTL<number, string>();
    numCache.set(1, 'value1');
    numCache.set(2, 'value2');
    expect(numCache.get(1)).toBe('value1');
    expect(numCache.get(2)).toBe('value2');
    numCache.destroy();
  });

  it('should handle object keys', () => {
    const objCache = new LRU_TTL<object, string>();
    const key1 = { id: 1 };
    const key2 = { id: 2 };
    objCache.set(key1, 'value1');
    objCache.set(key2, 'value2');
    expect(objCache.get(key1)).toBe('value1');
    expect(objCache.get(key2)).toBe('value2');
    objCache.destroy();
  });

  it('should handle complex values', () => {
    const complexCache = new LRU_TTL<string, any>();
    const complexValue = {
      nested: {
        array: [1, 2, 3],
        func: () => 'test',
      },
    };
    complexCache.set('key1', complexValue);
    expect(complexCache.get('key1')).toBe(complexValue);
    complexCache.destroy();
  });

  it('should maintain insertion order', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    const keys = Array.from(cache.keys());
    expect(keys).toEqual(['key1', 'key2', 'key3']);
  });

  it('should update order on access', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    cache.get('key1'); // Move to end

    const keys = Array.from(cache.keys());
    expect(keys).toEqual(['key2', 'key3', 'key1']);
  });
});

describe('LRU_TTL v4 - Integration Tests', () => {
  it('should combine LRU and TTL behavior', async () => {
    vi.useFakeTimers();
    const cache = new LRU_TTL<string, string>({ max: 3, ttl: 1000, ttlAccuracy: 100 });

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    // Exceed max - should evict LRU
    cache.set('key4', 'value4');
    expect(cache.has('key1')).toBe(false);

    // Wait for TTL
    vi.advanceTimersByTime(1100);
    await vi.runAllTimersAsync();

    // All should be expired
    expect(cache.size).toBe(0);

    cache.destroy();
    vi.useRealTimers();
  });

  it('should work with resolver and LRU', () => {
    const cache = new LRU_TTL<string, string, [string]>({ max: 2 });
    cache.defaultResolver = (key, suffix) => ({ value: `${key}-${suffix}` });

    cache.resolve('key1', undefined, 'a');
    cache.resolve('key2', undefined, 'b');
    cache.resolve('key3', undefined, 'c'); // Should evict key1

    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(true);
    expect(cache.has('key3')).toBe(true);

    cache.destroy();
  });

  it('should handle concurrent async resolvers', async () => {
    const cache = new LRU_TTL<string, string | Promise<string>>();
    const resolver: Resolver<string, Promise<string>> = async (key) => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ value: `async-${key}` }), Math.random() * 50);
      });
    };

    const promises = [
      cache.resolve('key1', resolver),
      cache.resolve('key2', resolver),
      cache.resolve('key3', resolver),
    ];

    await Promise.all(promises);

    expect(cache.size).toBe(3);
    expect(cache.peek('key1')).toBe('async-key1');
    expect(cache.peek('key2')).toBe('async-key2');
    expect(cache.peek('key3')).toBe('async-key3');

    cache.destroy();
  });

  it('should handle rapid set and get operations', () => {
    const cache = new LRU_TTL<number, string>({ max: 100 });

    for (let i = 0; i < 1000; i++) {
      cache.set(i % 100, `value${i}`);
    }

    expect(cache.size).toBe(100);

    for (let i = 0; i < 100; i++) {
      expect(cache.has(i)).toBe(true);
    }

    cache.destroy();
  });

  it('should maintain correctness under mixed operations', () => {
    const cache = new LRU_TTL<string, number>({ max: 5 });

    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);

    cache.set('c', 3);
    cache.set('d', 4);
    cache.set('e', 5);

    expect(cache.peek('a')).toBe(1);

    cache.set('f', 6); // Should evict 'b'
    expect(cache.has('b')).toBe(false);
    expect(cache.has('a')).toBe(true);

    cache.pop('a');
    expect(cache.has('a')).toBe(false);

    const lru = cache.popLRU();
    expect(lru).toBeDefined();
    expect(cache.size).toBe(3);

    cache.destroy();
  });
});

describe('LRU_TTL v4 - Constants', () => {
  it('should export TTL_ACCURACY_DEFAULT', () => {
    expect(TTL_ACCURACY_DEFAULT).toBe(1000);
  });

  it('should export TTL_ACCURACY_DEFAULT_FRAG', () => {
    expect(TTL_ACCURACY_DEFAULT_FRAG).toBe(10);
  });

  it('should export TTL_ACCURACY_MIN', () => {
    expect(TTL_ACCURACY_MIN).toBe(100);
  });
});
