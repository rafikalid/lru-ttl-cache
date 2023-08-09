import LRU_TTL from '..';

describe('TTL cache', function () {
	let cache: LRU_TTL;
	const TTL = '1s';
	const TTL_IN_MS = 1000;

	it('Should create TTL cache', function () {
		const tempTTL = 3000;
		cache = new LRU_TTL({ ttl: tempTTL });
		expect(cache.evalTtl).toBe(tempTTL);
		expect(cache.ttl).toBe(tempTTL);
	});

	it(`Should set TTL to: ${TTL}`, function () {
		cache.ttl = TTL;
		expect(cache.evalTtl).toBe(TTL_IN_MS);
		expect(cache.ttl).toBe(TTL);
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
