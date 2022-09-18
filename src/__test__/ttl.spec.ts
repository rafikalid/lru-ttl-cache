import LRU_TTL from 'lru-ttl-model';
import delay from 'delay';

describe('TTL tests',function(){
	let cache: LRU_TTL<any, any>;
	const TTL= 2000;
	const TMP_VALUE= {a: 1};
	const TMP_VALUE_KEY= 'key';
	const PER_VALUE= {a: 2};
	const PER_VALUE_KEY= 'perkey';

	
	beforeAll(function(){
		cache= new LRU_TTL({
			ttl: TTL,
		});
	})

	it(`Should create and use TTL cache`, function(){
		expect(cache.ttl).toBe(TTL);
		expect(cache.length).toBe(0);
		expect(cache.tempLength).toBe(0);
		expect(cache.permanentLength).toBe(0);
	});

	it('Sould add one temporary element for 2s and one permanent element', async function(){
		cache.set(TMP_VALUE_KEY, TMP_VALUE);
		cache.setPermanent(PER_VALUE_KEY, PER_VALUE);

		expect(cache.length).toBe(2);
		expect(cache.size).toBe(2);
		expect(cache.tempLength).toBe(1);
		expect(cache.permanentLength).toBe(1);

		expect(cache.has(TMP_VALUE_KEY)).toBe(true);
		expect(cache.get(TMP_VALUE_KEY)).toBe(TMP_VALUE);
		expect(cache.has(PER_VALUE_KEY)).toBe(true);
		expect(cache.get(PER_VALUE_KEY)).toBe(PER_VALUE);

		await delay(3000);

		expect(cache.length).toBe(1);
		expect(cache.size).toBe(1);
		expect(cache.tempLength).toBe(0);
		expect(cache.permanentLength).toBe(1);

		expect(cache.has(TMP_VALUE_KEY)).toBe(false);
		expect(cache.get(TMP_VALUE_KEY)).toBe(undefined);
		expect(cache.has(PER_VALUE_KEY)).toBe(true);
		expect(cache.get(PER_VALUE_KEY)).toBe(PER_VALUE);
	})
})