import LRU_TTL from "..";

describe("Check options", function () {
	it("Should create cache without options", function () {
		const cache = new LRU_TTL();
		expect(cache.evalMax).toBe(Infinity);
		expect(cache.evalTtl).toBe(Infinity);
		expect(cache.evalTtlResolution).toBe(Infinity);
		expect(cache.max).toBe(Infinity);
		expect(cache.ttl).toBe(Infinity);
		expect(cache.ttlResolution).toBeUndefined();
		expect(cache.onUpsert).toBeUndefined();
	});

	it("Should create TTL cache", function () {
		const ttl = "10min";
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

	it("Should create LRU cache", function () {
		const max = "500K";
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
});
