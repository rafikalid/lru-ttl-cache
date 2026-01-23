import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import Extended_LRU_TTL from './index';
import { ExtendedMetadata } from './types';

describe('Extended_LRU_TTL', () => {
  let cache: Extended_LRU_TTL<string, number>;

  beforeEach(() => {
    cache = new Extended_LRU_TTL<string, number>();
  });

  afterEach(() => {
    cache.clear();
  });

  describe('Constructor and Initialization', () => {
    it('should create an empty cache', () => {
      expect(cache.size).toBe(0);
      expect(cache.weight).toBe(0);
      expect(cache.tempSize).toBe(0);
      expect(cache.tempWeight).toBe(0);
      expect(cache.permSize).toBe(0);
      expect(cache.permWeight).toBe(0);
    });

    it('should initialize with max weight', () => {
      const c = new Extended_LRU_TTL<string, number>({ max: 100 });
      expect(c.evalMax).toBe(100);
    });

    it('should initialize with TTL', () => {
      const c = new Extended_LRU_TTL<string, number>({ ttl: 1000 });
      expect(c.evalTTL).toBe(1000);
    });
  });

  describe('set() - Basic Operations', () => {
    it('should set a temporary item with default weight', () => {
      const entry = cache.set('key1', 100);
      expect(entry.key).toBe('key1');
      expect(entry.value).toBe(100);
      expect(entry.weight).toBe(1);
      expect(entry.isPermanent).toBe(false);
      expect(cache.size).toBe(1);
      expect(cache.tempSize).toBe(1);
      expect(cache.tempWeight).toBe(1);
      expect(cache.weight).toBe(1);
    });

    it('should set a temporary item with custom weight', () => {
      cache.set('key1', 100, 5);
      expect(cache.tempWeight).toBe(5);
      expect(cache.weight).toBe(5);
    });

    it('should set a permanent item', () => {
      cache.set('key1', 100, 3, true);
      expect(cache.permSize).toBe(1);
      expect(cache.permWeight).toBe(3);
      expect(cache.tempSize).toBe(0);
      expect(cache.tempWeight).toBe(0);
      expect(cache.weight).toBe(3);
    });

    it('should update existing temporary item value', () => {
      cache.set('key1', 100, 2);
      cache.set('key1', 200, 2);
      expect(cache.get('key1')).toBe(200);
      expect(cache.size).toBe(1);
      expect(cache.tempWeight).toBe(2);
    });

    it('should update weight of existing temporary item', () => {
      cache.set('key1', 100, 2);
      cache.set('key1', 100, 5);
      expect(cache.tempWeight).toBe(5);
      expect(cache.weight).toBe(5);
    });

    it('should convert temporary to permanent', () => {
      cache.set('key1', 100, 2, false);
      cache.set('key1', 100, 3, true);
      expect(cache.permSize).toBe(1);
      expect(cache.permWeight).toBe(3);
      expect(cache.tempSize).toBe(0);
      expect(cache.tempWeight).toBe(0);
    });

    it('should convert permanent to temporary', () => {
      cache.set('key1', 100, 3, true);
      cache.set('key1', 100, 2, false);
      expect(cache.permSize).toBe(0);
      expect(cache.permWeight).toBe(0);
      expect(cache.tempSize).toBe(1);
      expect(cache.tempWeight).toBe(2);
    });

    it('should throw error for invalid weight', () => {
      expect(() => cache.set('key1', 100, 0)).toThrow('Invalid weight');
      expect(() => cache.set('key1', 100, -1)).toThrow('Invalid weight');
    });
  });

  describe('setPermanent()', () => {
    it('should set permanent item with default weight', () => {
      cache.setPermanent('key1', 100);
      expect(cache.permSize).toBe(1);
      expect(cache.permWeight).toBe(1);
    });

    it('should set permanent item with custom weight', () => {
      cache.setPermanent('key1', 100, 5);
      expect(cache.permSize).toBe(1);
      expect(cache.permWeight).toBe(5);
    });
  });

  describe('get() and getMetadata()', () => {
    it('should get temporary item value', () => {
      cache.set('key1', 100);
      expect(cache.get('key1')).toBe(100);
    });

    it('should get permanent item value', () => {
      cache.set('key1', 100, 1, true);
      expect(cache.get('key1')).toBe(100);
    });

    it('should return undefined for non-existent key', () => {
      expect(cache.get('missing')).toBeUndefined();
    });

    it('should get metadata for temporary item', () => {
      cache.set('key1', 100, 3);
      const meta = cache.getMetadata('key1');
      expect(meta?.key).toBe('key1');
      expect(meta?.value).toBe(100);
      expect(meta?.weight).toBe(3);
      expect(meta?.isPermanent).toBe(false);
    });

    it('should get metadata for permanent item', () => {
      cache.set('key1', 100, 3, true);
      const meta = cache.getMetadata('key1');
      expect(meta?.isPermanent).toBe(true);
    });

    it('should update LRU position for temporary items on access', () => {
      cache.set('key1', 1, 1);
      cache.set('key2', 2, 1);
      cache.get('key1'); // Move key1 to MRU
      expect(cache.lru).toBe(2);
      expect(cache.mru).toBe(1);
    });

    it('should NOT update LRU position for permanent items on access', () => {
      cache.set('key1', 1, 1, false);
      cache.set('key2', 2, 1, true);
      cache.get('key2'); // Permanent item shouldn't move
      expect(cache.lru).toBe(1); // key1 is still LRU
    });
  });

  describe('peek() and peekMetadata()', () => {
    it('should peek without updating LRU', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);
      cache.peek('key1');
      expect(cache.lru).toBe(1); // LRU unchanged
      expect(cache.mru).toBe(2);
    });

    it('should peek metadata', () => {
      cache.set('key1', 100, 5, true);
      const meta = cache.peekMetadata('key1');
      expect(meta?.weight).toBe(5);
      expect(meta?.isPermanent).toBe(true);
    });
  });

  describe('Weight Management', () => {
    it('should track total weight correctly', () => {
      cache.set('key1', 1, 2);
      cache.set('key2', 2, 3);
      cache.set('key3', 3, 4, true);
      expect(cache.weight).toBe(9);
      expect(cache.tempWeight).toBe(5);
      expect(cache.permWeight).toBe(4);
    });

    it('should update weight when replacing item', () => {
      cache.set('key1', 100, 2);
      cache.set('key1', 200, 5);
      expect(cache.weight).toBe(5);
    });

    it('should update weight when converting temp to perm', () => {
      cache.set('key1', 100, 2, false);
      cache.set('key1', 100, 3, true);
      expect(cache.tempWeight).toBe(0);
      expect(cache.permWeight).toBe(3);
      expect(cache.weight).toBe(3);
    });
  });

  describe('LRU Eviction by Weight', () => {
    beforeEach(() => {
      cache = new Extended_LRU_TTL<string, number>({ max: 10 });
    });

    it('should evict LRU items when max weight exceeded', () => {
      cache.set('key1', 1, 3);
      cache.set('key2', 2, 4);
      cache.set('key3', 3, 5); // Total = 12, should evict key1
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.tempWeight).toBe(9);
    });

    it('should evict multiple items if necessary', () => {
      cache.set('key1', 1, 2);
      cache.set('key2', 2, 3);
      cache.set('key3', 3, 4);
      cache.set('key4', 4, 8); // Should evict key1, key2, key3
      expect(cache.size).toBe(1);
      expect(cache.has('key4')).toBe(true);
    });

    it('should NOT evict permanent items', () => {
      cache.set('key1', 1, 5, true);
      cache.set('key2', 2, 3);
      cache.set('key3', 3, 8); // Should evict key2, not key1
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
    });

    it('should emit evicted event', async () => {
      const evictedRecords: ExtendedMetadata<string, number>[] = [];
      cache.on('evicted', (records) => {
        evictedRecords.push(...records);
      });

      cache.set('key1', 1, 3);
      cache.set('key2', 2, 4);
      cache.set('key3', 3, 5);

      expect(evictedRecords).toHaveLength(1);
      expect(evictedRecords[0].key).toBe('key1');
    });
  });

  describe('delete() and pop()', () => {
    it('should delete temporary item', () => {
      cache.set('key1', 100, 3);
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
      expect(cache.tempWeight).toBe(0);
    });

    it('should delete permanent item', () => {
      cache.set('key1', 100, 3, true);
      expect(cache.delete('key1')).toBe(true);
      expect(cache.permWeight).toBe(0);
    });

    it('should return false for non-existent key', () => {
      expect(cache.delete('missing')).toBe(false);
    });

    it('should pop temporary item', () => {
      cache.set('key1', 100, 3);
      expect(cache.pop('key1')).toBe(100);
      expect(cache.has('key1')).toBe(false);
      expect(cache.tempWeight).toBe(0);
    });

    it('should pop permanent item', () => {
      cache.set('key1', 100, 3, true);
      expect(cache.pop('key1')).toBe(100);
      expect(cache.permWeight).toBe(0);
    });

    it('should popMetadata with correct stats', () => {
      cache.set('key1', 100, 5, true);
      const meta = cache.popMetadata('key1');
      expect(meta?.value).toBe(100);
      expect(meta?.weight).toBe(5);
      expect(cache.permWeight).toBe(0);
    });

    it('should emit removed event', () => {
      const removedRecords: ExtendedMetadata<string, number>[][] = [];
      cache.on('removed', (records) => {
        removedRecords.push(records);
      });

      cache.set('key1', 100);
      cache.delete('key1');

      expect(removedRecords).toHaveLength(1);
      expect(removedRecords[0][0].key).toBe('key1');
    });
  });

  describe('popLRU() and popMRU()', () => {
    it('should pop LRU temporary item', () => {
      cache.set('key1', 1, 2);
      cache.set('key2', 2, 3);
      expect(cache.popLRU()).toBe(1);
      expect(cache.tempWeight).toBe(3);
    });

    it('should pop MRU temporary item', () => {
      cache.set('key1', 1, 2);
      cache.set('key2', 2, 3);
      expect(cache.popMRU()).toBe(2);
      expect(cache.tempWeight).toBe(2);
    });

    it('should return undefined for empty cache', () => {
      expect(cache.popLRU()).toBeUndefined();
      expect(cache.popMRU()).toBeUndefined();
    });

    it('should popLRUMetadata with weight info', () => {
      cache.set('key1', 1, 5);
      const meta = cache.popLRUMetadata();
      expect(meta?.weight).toBe(5);
      expect(cache.tempWeight).toBe(0);
    });
  });

  describe('clear() Operations', () => {
    it('should clear all items', () => {
      cache.set('key1', 1, 2);
      cache.set('key2', 2, 3, true);
      const deleted = cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.weight).toBe(0);
      expect(cache.tempWeight).toBe(0);
      expect(cache.permWeight).toBe(0);
      expect(deleted.size).toBe(2);
    });

    it('should emit clearedAll event', async () => {
      const clearedMap = await new Promise<Map<string, ExtendedMetadata<string, number>>>(
        (resolve) => {
          cache.on('clearedAll', (map) => {
            resolve(map);
          });

          cache.set('key1', 1);
          cache.set('key2', 2);
          cache.clear();
        },
      );

      expect(clearedMap.size).toBe(2);
    });
  });

  describe('clearTemporaryRecords()', () => {
    it('should clear only temporary items', () => {
      cache.set('temp1', 1, 2, false);
      cache.set('temp2', 2, 3, false);
      cache.set('perm1', 3, 4, true);

      const deleted = cache.clearTemporaryRecords();

      expect(cache.size).toBe(1);
      expect(cache.tempSize).toBe(0);
      expect(cache.tempWeight).toBe(0);
      expect(cache.permSize).toBe(1);
      expect(cache.permWeight).toBe(4);
      expect(cache.weight).toBe(4);
      expect(deleted).toHaveLength(2);
    });

    it('should emit clearedTemp event', () => {
      let clearedRecords: ExtendedMetadata<string, number>[] = [];
      cache.on('clearedTemp', (records) => {
        clearedRecords = records;
      });

      cache.set('temp1', 1);
      cache.set('perm1', 2, 1, true);
      cache.clearTemporaryRecords();

      expect(clearedRecords).toHaveLength(1);
      expect(clearedRecords[0].key).toBe('temp1');
    });
  });

  describe('clearPermanentRecords()', () => {
    it('should clear only permanent items', () => {
      cache.set('temp1', 1, 2, false);
      cache.set('perm1', 2, 3, true);
      cache.set('perm2', 3, 4, true);

      const deleted = cache.clearPermanentRecords();

      expect(cache.size).toBe(1);
      expect(cache.tempSize).toBe(1);
      expect(cache.tempWeight).toBe(2);
      expect(cache.permSize).toBe(0);
      expect(cache.permWeight).toBe(0);
      expect(cache.weight).toBe(2);
      expect(deleted).toHaveLength(2);
    });

    it('should emit clearedPerm event', () => {
      let clearedRecords: ExtendedMetadata<string, number>[] = [];
      cache.on('clearedPerm', (records) => {
        clearedRecords = records;
      });

      cache.set('temp1', 1);
      cache.set('perm1', 2, 1, true);
      cache.clearPermanentRecords();

      expect(clearedRecords).toHaveLength(1);
      expect(clearedRecords[0].key).toBe('perm1');
    });
  });

  describe('TTL Expiration with Weight', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      cache = new Extended_LRU_TTL<string, number>({ ttl: 100, ttlAccuracy: 50 });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should expire temporary items and update weight', async () => {
      cache.set('key1', 1, 3);
      cache.set('key2', 2, 5);

      vi.advanceTimersByTime(150);

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.tempWeight).toBe(0);
      expect(cache.weight).toBe(0);
    });

    it('should NOT expire permanent items', async () => {
      cache.set('temp1', 1, 3, false);
      cache.set('perm1', 2, 5, true);

      vi.advanceTimersByTime(150);

      expect(cache.has('temp1')).toBe(false);
      expect(cache.has('perm1')).toBe(true);
      expect(cache.weight).toBe(5);
      expect(cache.permWeight).toBe(5);
    });

    it('should emit expired event', async () => {
      const expiredRecords: ExtendedMetadata<string, number>[] = [];
      cache.on('expired', (records) => {
        expiredRecords.push(...records);
      });

      cache.set('key1', 1, 3);

      vi.advanceTimersByTime(150);

      expect(expiredRecords).toHaveLength(1);
      expect(expiredRecords[0].key).toBe('key1');
    });
  });

  describe('onDeleted Callbacks', () => {
    it('should set onDeleted callback for item', () => {
      cache.set('key1', 100);
      const callback = vi.fn();
      cache.onDeleted('key1', callback);

      expect(cache.onDeleted('key1')).toBe(callback);
    });

    it('should call onDeleted when item is deleted', async () => {
      cache.set('key1', 100, 3);
      const callback = vi.fn();
      cache.onDeleted('key1', callback);

      cache.delete('key1');

      await new Promise<void>((resolve) => queueMicrotask(resolve));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'key1', value: 100 }),
        'removed',
      );
    });

    it('should call onDeleted when item is evicted', async () => {
      cache = new Extended_LRU_TTL<string, number>({ max: 5 });
      cache.set('key1', 100, 3);
      const callback = vi.fn();
      cache.onDeleted('key1', callback);

      cache.set('key2', 200, 5); // Evict key1

      await new Promise<void>((resolve) => queueMicrotask(resolve));
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ key: 'key1' }), 'evicted');
    });

    it('should call onDeleted when item expires', async () => {
      vi.useFakeTimers();
      cache = new Extended_LRU_TTL<string, number>({ ttl: 100, ttlAccuracy: 50 });
      cache.set('key1', 100);
      const callback = vi.fn();
      cache.onDeleted('key1', callback);

      vi.advanceTimersByTime(150);

      await new Promise<void>((resolve) => queueMicrotask(resolve));
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ key: 'key1' }), 'expired');
      vi.useRealTimers();
    });

    it('should call onDeleted when item is replaced', async () => {
      cache.set('key1', 100);
      const callback = vi.fn();
      cache.onDeleted('key1', callback);

      cache.set('key1', 200); // Replace

      await new Promise<void>((resolve) => queueMicrotask(resolve));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'key1', value: 100 }),
        'replaced',
      );
    });

    it('should call onDeleted when cache is cleared', async () => {
      cache.set('key1', 100);
      const callback = vi.fn();
      cache.onDeleted('key1', callback);

      cache.clear();

      await new Promise<void>((resolve) => queueMicrotask(resolve));
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ key: 'key1' }), 'clearedAll');
    });

    it('should call onDeleted when clearTemporaryRecords', async () => {
      cache.set('key1', 100);
      const callback = vi.fn();
      cache.onDeleted('key1', callback);

      cache.clearTemporaryRecords();

      await new Promise<void>((resolve) => queueMicrotask(resolve));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'key1' }),
        'clearedTemp',
      );
    });

    it('should call onDeleted when clearPermanentRecords', async () => {
      cache.set('key1', 100, 1, true);
      const callback = vi.fn();
      cache.onDeleted('key1', callback);

      cache.clearPermanentRecords();

      await new Promise<void>((resolve) => queueMicrotask(resolve));
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ key: 'key1' }),
        'clearedPerm',
      );
    });

    it('should remove onDeleted callback with null', () => {
      cache.set('key1', 100);
      const callback = vi.fn();
      cache.onDeleted('key1', callback);
      cache.onDeleted('key1', null);

      expect(cache.onDeleted('key1')).toBeUndefined();
    });

    it('should throw error for invalid onDeleted callback', () => {
      cache.set('key1', 100);
      expect(() => cache.onDeleted('key1', 'invalid' as any)).toThrow('must be a function');
    });

    it('should throw error for non-existent key when setting callback', () => {
      expect(() => cache.onDeleted('missing', vi.fn())).toThrow('Key not found');
    });

    it('should return undefined for non-existent key when getting callback', () => {
      expect(cache.onDeleted('missing')).toBeUndefined();
    });
  });

  describe('Event Emitter', () => {
    it('should support on() listener', () => {
      const listener = vi.fn();
      cache.on('removed', listener);

      cache.set('key1', 100);
      cache.delete('key1');

      expect(listener).toHaveBeenCalled();
    });

    it('should support once() listener', () => {
      const listener = vi.fn();
      cache.once('removed', listener);

      cache.set('key1', 100);
      cache.delete('key1');
      cache.set('key2', 200);
      cache.delete('key2');

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should support off() to remove listener', () => {
      const listener = vi.fn();
      cache.on('removed', listener);
      cache.off('removed', listener);

      cache.set('key1', 100);
      cache.delete('key1');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit replaced event with correct data', () => {
      const listener = vi.fn();
      cache.on('replaced', listener);

      cache.set('key1', 100);
      cache.set('key1', 200);

      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ key: 'key1', value: 100 }));
    });
  });

  describe('Resolver with Weight and Permanent', () => {
    it('should resolve with default weight and temporary', () => {
      const resolver = vi.fn(() => ({ value: 100 }));
      cache = new Extended_LRU_TTL<string, number>({ defaultResolver: resolver });

      cache.resolve('key1');

      expect(cache.tempWeight).toBe(1);
      expect(cache.permSize).toBe(0);
    });

    it('should resolve with custom weight', () => {
      const resolver = vi.fn(() => ({ value: 100, weight: 5 }));
      cache = new Extended_LRU_TTL<string, number>({ defaultResolver: resolver });

      cache.resolve('key1');

      expect(cache.tempWeight).toBe(5);
    });

    it('should resolve as permanent', () => {
      const resolver = vi.fn(() => ({ value: 100, weight: 3, isPermanent: true }));
      cache = new Extended_LRU_TTL<string, number>({ defaultResolver: resolver });

      cache.resolve('key1');

      expect(cache.permSize).toBe(1);
      expect(cache.permWeight).toBe(3);
      expect(cache.tempSize).toBe(0);
    });

    it('should resolve with onDeleted callback', async () => {
      const onDeleted = vi.fn();
      const resolver = vi.fn(() => ({ value: 100, onDeleted }));
      cache = new Extended_LRU_TTL<string, number>({ defaultResolver: resolver });

      cache.resolve('key1');
      cache.delete('key1');

      await new Promise<void>((resolve) => queueMicrotask(resolve));
      expect(onDeleted).toHaveBeenCalledWith(expect.objectContaining({ key: 'key1' }), 'removed');
    });

    it('should handle async resolver with weight', async () => {
      const resolver = vi.fn(async () => ({ value: 100, weight: 5 }));
      const cache = new Extended_LRU_TTL<string, Promise<number>>({ defaultResolver: resolver });

      const result = cache.resolve('key1');
      expect(result).toBeInstanceOf(Promise);

      await result;
      expect(cache.tempWeight).toBe(5);
    });
  });

  describe('Iteration', () => {
    it('should iterate over all items', () => {
      cache.set('temp1', 1, 2);
      cache.set('perm1', 2, 3, true);

      const items = Array.from(cache);
      expect(items).toHaveLength(2);
      expect(items.some((item) => item.key === 'temp1')).toBe(true);
      expect(items.some((item) => item.key === 'perm1')).toBe(true);
    });

    it('should iterate entries', () => {
      cache.set('key1', 1);
      cache.set('key2', 2);

      const entries = Array.from(cache.entries());
      expect(entries).toEqual([
        ['key1', 1],
        ['key2', 2],
      ]);
    });

    it('should iterate with metadata including weight', () => {
      cache.set('key1', 100, 5);

      const metadata = Array.from(cache.entriesMetadata());
      expect(metadata[0].weight).toBe(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle setting same value with same weight', () => {
      cache.set('key1', 100, 3);
      cache.set('key1', 100, 3);

      expect(cache.size).toBe(1);
      expect(cache.tempWeight).toBe(3);
    });

    it('should handle empty cache operations', () => {
      expect(cache.popLRU()).toBeUndefined();
      expect(cache.popMRU()).toBeUndefined();
      expect(cache.lru).toBeUndefined();
      expect(cache.mru).toBeUndefined();
    });

    it('should handle large weight values', () => {
      cache.set('key1', 100, 1000000);
      expect(cache.weight).toBe(1000000);
    });

    it('should handle fractional weights', () => {
      cache.set('key1', 100, 1.5);
      cache.set('key2', 200, 2.5);
      expect(cache.weight).toBe(4);
    });

    describe.only('should maintain consistency when converting items multiple times', () => {
      let cache: Extended_LRU_TTL<string, number>;
      beforeAll(() => {
        cache = new Extended_LRU_TTL<string, number>();
        cache.set('key1', 100, 3, false);
        cache.set('key1', 100, 4, true);
        cache.set('key1', 100, 5, false);
        cache.set('key1', 100, 6, true);
      });

      it('should have correct permanent size', () => {
        expect(cache.permSize).toBe(1);
      });
      it('should have zero temporary size', () => {
        expect(cache.tempSize).toBe(0);
      });
      it('should have correct permanent weight', () => {
        expect(cache.permWeight).toBe(6);
      });
      it('should have zero temporary weight', () => {
        expect(cache.tempWeight).toBe(0);
      });
      it('should have correct total weight', () => {
        expect(cache.weight).toBe(6);
      });
    });
  });

  describe('Mixed Permanent and Temporary Operations', () => {
    it('should correctly handle mixed items', () => {
      cache.set('temp1', 1, 2, false);
      cache.set('perm1', 2, 3, true);
      cache.set('temp2', 3, 4, false);
      cache.set('perm2', 4, 5, true);

      expect(cache.size).toBe(4);
      expect(cache.tempSize).toBe(2);
      expect(cache.permSize).toBe(2);
      expect(cache.tempWeight).toBe(6);
      expect(cache.permWeight).toBe(8);
      expect(cache.weight).toBe(14);
    });

    it('should only evict temporary items when max exceeded', () => {
      cache = new Extended_LRU_TTL<string, number>({ max: 10 });
      cache.set('temp1', 1, 3, false);
      cache.set('perm1', 2, 100, true); // Large permanent item
      cache.set('temp2', 3, 5, false);
      cache.set('temp3', 4, 8, false); // Should evict temp1 and temp2

      expect(cache.has('temp1')).toBe(false);
      expect(cache.has('temp2')).toBe(false);
      expect(cache.has('perm1')).toBe(true);
      expect(cache.has('temp3')).toBe(true);
    });

    it('should correctly get LRU/MRU for temporary items only', () => {
      cache.set('temp1', 1, 1, false);
      cache.set('perm1', 2, 1, true);
      cache.set('temp2', 3, 1, false);

      expect(cache.lru).toBe(1);
      expect(cache.mru).toBe(3);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle rapid set/delete cycles', () => {
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, i, (i % 5) + 1);
      }
      for (let i = 0; i < 50; i++) {
        cache.delete(`key${i}`);
      }

      expect(cache.size).toBe(50);
      expect(cache.weight).toBeGreaterThan(0);
    });

    it('should handle conversion between perm and temp repeatedly', () => {
      cache.set('key1', 100, 5, false);
      for (let i = 0; i < 10; i++) {
        cache.set('key1', 100, 5, i % 2 === 0);
      }

      expect(cache.size).toBe(1);
      expect(cache.weight).toBe(5);
    });

    it('should correctly update all stats during complex operations', () => {
      cache = new Extended_LRU_TTL<string, number>({ max: 20 });

      // Add items
      cache.set('t1', 1, 2, false);
      cache.set('p1', 2, 3, true);
      cache.set('t2', 3, 4, false);
      cache.set('p2', 4, 5, true);

      // Update items
      cache.set('t1', 10, 3, false);
      cache.set('p1', 20, 4, true);

      // Convert items
      cache.set('t2', 30, 5, true);
      cache.set('p2', 40, 2, false);

      // Verify stats
      expect(cache.tempSize).toBe(2);
      expect(cache.permSize).toBe(2);
      expect(cache.tempWeight).toBe(5); // t1(3) + p2(2)
      expect(cache.permWeight).toBe(9); // p1(4) + t2(5)
      expect(cache.weight).toBe(14);
    });
  });
});
