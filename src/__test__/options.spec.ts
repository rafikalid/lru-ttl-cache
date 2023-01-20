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

	it('max setter', function () {
		const cache = new LRU_TTL();
		cache.max = '77KB';
		expect(cache.max).toBe('77KB');
		expect(cache.evalMax).toBe(77 * 2 ** 10);
		expect(() => {
			cache.max = -99;
		}).toThrow();
		expect(() => {
			cache.max = true as unknown as number;
		}).toThrow();
	});

	it('ttl setter', function () {
		const cache = new LRU_TTL();
		cache.ttl = '1h';
		expect(cache.ttl).toBe('1h');
		expect(cache.evalTtl).toBe(3600_000);

		expect(() => {
			cache.ttl = 34.345;
		}).toThrow();
	});

	it('ttlResolution setter', function () {
		const cache = new LRU_TTL();
		cache.ttlResolution = '1min';
		expect(cache.ttlResolution).toBe('1min');
		expect(cache.evalTtlResolution).toBe(60_000);

		expect(() => {
			cache.ttlResolution = 34.345;
		}).toThrow();
	});

	it('onUpsert setter', function () {
		const cache = new LRU_TTL();
		const onUpsert = function (key: string) {
			return { value: `${key}---` };
		};
		cache.onUpsert = onUpsert;
		expect(cache.onUpsert).toBe(onUpsert);

		cache.onUpsert = undefined;
		expect(cache.onUpsert).toBe(undefined);

		expect(() => {
			cache.onUpsert = 'wrong value' as unknown as undefined;
		}).toThrow();
	});

	it('onDeleted setter', function () {
		const cache = new LRU_TTL();
		const onDeleted = function (item: any, raison: any) {
			console.log(raison, item);
		};
		cache.onDeleted = onDeleted;
		expect(cache.onDeleted).toBe(onDeleted);

		cache.onDeleted = undefined;
		expect(cache.onDeleted).toBe(undefined);

		expect(() => {
			cache.onDeleted = 'wrong value' as unknown as undefined;
		}).toThrow();
	});

	it('Should return undefined for missing values', function () {
		const cache = new LRU_TTL();
		expect(cache.get('key')).toBeUndefined();
		expect(cache.popLRU()).toBeUndefined();
		expect(cache.popMRU()).toBeUndefined();
		expect(cache.delete('key')).toBeUndefined();
	});
});
