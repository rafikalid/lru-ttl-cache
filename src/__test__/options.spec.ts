import LRU_TTL from '..';

describe('Check options', function () {
	it('Should create cache without options', function () {
		const cache = new LRU_TTL();
		expect(cache.evalMax).toBe(Infinity);
		expect(cache.evalTtl).toBe(Infinity);
		expect(cache.evalTtlResolution).toBe(Infinity);
		expect(cache.max).toBe(Infinity);
		expect(cache.ttl).toBe(Infinity);
		expect(cache.ttlResolution).toBeUndefined();
		expect(cache.onUpsert).toBeUndefined();
	});

	it('Should create TTL cache', function () {
		const ttl = '10min';
		const expectedTTL = 10 * 60 * 1000;
		const cache = new LRU_TTL({ ttl });
		expect(cache.evalMax).toBe(Infinity);
		expect(cache.evalTtl).toBe(expectedTTL);
		expect(cache.evalTtlResolution).toBe(expectedTTL / 10);
		expect(cache.max).toBe(Infinity);
		expect(cache.ttl).toBe(ttl);
		expect(cache.ttlResolution).toBeUndefined();
		expect(cache.onUpsert).toBeUndefined();
	});

	it('Should create LRU cache', function () {
		const max = '500K';
		const evalMax = 500_000;
		const cache = new LRU_TTL({ max });
		expect(cache.evalMax).toBe(evalMax);
		expect(cache.evalTtl).toBe(Infinity);
		expect(cache.evalTtlResolution).toBe(Infinity);
		expect(cache.max).toBe(max);
		expect(cache.ttl).toBe(Infinity);
		expect(cache.ttlResolution).toBeUndefined();
		expect(cache.onUpsert).toBeUndefined();
	});

	it('Should return metadata of any item', function () {
		const cache = new LRU_TTL();
		const key = 'key';
		const value = 'value';
		cache.set(key, value);
		const metadata = cache.getMetadata(key);
		if (metadata == null) throw new Error('Expect metadata to be defined');
		expect(metadata.value).toBe(value);
		expect(metadata.key).toBe(key);
	});

	it('Should delete element', function () {
		const key = 'key3';
		const value = 'value 3';
		const count = 5;
		const cache = LRU_TTL.from([
			['key1', 'value1'],
			['key2', 'value2'],
			[key, value],
			['key4', 'value4'],
			['key5', 'value5']
		]);
		expect(cache.has(key)).toBe(true);
		expect(cache.count).toBe(count);
		const item = cache.delete(key);
		if (item == null)
			throw new Error('Expected deleted value to be defined');
		expect(item.value).toBe(value);
		expect(item.key).toBe(key);
		expect(cache.count).toBe(count - 1);
	});
});
