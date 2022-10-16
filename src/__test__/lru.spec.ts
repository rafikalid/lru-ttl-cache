import LRU_TTL from '..';
import { OnDeleteRaison } from '../types';

describe('LRU cache', function () {
	let cache: LRU_TTL<string, string>;
	const MAX = 10;

	it('Should create LRU cache', function () {
		const tempMax = MAX + 20;
		cache = new LRU_TTL({ max: tempMax });
		expect(cache.evalMax).toBe(tempMax);
		expect(cache.max).toBe(tempMax);
	});

	it(`Should set max to ${MAX}`, function () {
		cache.max = MAX;
		expect(cache.evalMax).toBe(MAX);
		expect(cache.max).toBe(MAX);
	});

	it('Should add one Item', function () {
		const value = 'value123';
		const key = 'key123';
		cache.set(key, value);
		expect(cache.has(key)).toBe(true);
		expect(cache.count).toBe(1);
		expect(cache.tempCount).toBe(1);
		expect(cache.lockedCount).toBe(0);
		expect(cache.lru.value).toBe(value);
		expect(cache.mru.value).toBe(value);
		expect(cache.lru.key).toBe(key);
		expect(cache.mru.key).toBe(key);
	});

	it('Should keep MRU, LRU and Max Accurate, Not delete anything as max not exceeded', function () {
		const lru = cache.lru;
		for (let i = cache.count; i < MAX; ++i) {
			const value = `value ${i}`;
			const key = `key ${i}`;
			cache.set(key, value);
			const currentCount = i + 1;
			expect(cache.mru.value).toBe(value);
			expect(cache.lru.value).toBe(lru);
			expect(cache.count).toBe(currentCount);
			expect(cache.tempCount).toBe(currentCount);
		}
	});

	it('Should remove item as MAX Exceeded', function () {
		const deletedCb = (cache.onDeleted = jest.fn);
		for (let i = MAX, len = MAX + 10; i < len; i++) {
			const value = `v ${i}`;
			const key = `k ${i}`;
			const lru = cache.lru;
			cache.set(key, value);
			expect(deletedCb).toHaveBeenCalledWith(lru, OnDeleteRaison.LRU);
			expect(cache.mru.value).toBe(value);
			expect(cache.lru).not.toBe(lru);
			expect(cache.has(key)).toBe(true);
			expect(cache.has(lru.key!)).toBe(true);
			expect(cache.count).toBe(MAX);
			expect(cache.tempCount).toBe(MAX);
		}
	});

	it('Should set any element we get as MRU', function () {
		const key = cache.lru.key!;
		const value = cache.lru.value;
		expect(cache.mru.key).not.toBe(key);
		const item = cache.get(key);
		expect(item).toBe(value);
		expect(cache.mru.key).toBe(key);
		expect(cache.mru.value).toBe(value);
	});

	it('Should not refresh item if we use "peek"', function () {
		const key = cache.lru.key!;
		const value = cache.lru.value;
		const item = cache.peek(key);
		expect(item).toBe(value);
		expect(cache.lru.key).toBe(key);
		expect(cache.lru.value).toBe(value);
	});

	it('Should pop LRU', function () {
		const cacheCount = cache.count;
		const lru = cache.lru;
		const popLRU = cache.popLRU();
		expect(cache.lru).not.toBe(lru);
		expect(cache.count).toBe(cacheCount - 1);
		expect(cache.tempCount).toBe(cacheCount - 1);
		expect(popLRU).toBe(lru);
	});

	it('Should pop MRU', function () {
		const cacheCount = cache.count;
		const mru = cache.mru;
		const popMRU = cache.popMRU();
		expect(cache.mru).not.toBe(mru);
		expect(cache.count).toBe(cacheCount - 1);
		expect(cache.tempCount).toBe(cacheCount - 1);
		expect(popMRU).toBe(mru);
	});
});
