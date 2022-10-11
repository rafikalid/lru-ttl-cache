import LRU_TTL from '..';

describe('LRU cache', function () {
	let cache: LRU_TTL;
	const MAX = 10;

	it('Should create LRU cache', function () {
		cache = new LRU_TTL({ max: MAX });
		expect(cache.evalMax).toBe(MAX);
		expect(cache.max).toBe(MAX);
	});

	it('Should add one Item', function () {
		const item = { k: 'value' };
		const key = 'key123';
		cache.set(key, item);
		expect(cache.has(key)).toBe(true);
		expect(cache.count).toBe(1);
		expect(cache.tempCount).toBe(1);
		expect(cache.lockedCount).toBe(0);
	});
});
