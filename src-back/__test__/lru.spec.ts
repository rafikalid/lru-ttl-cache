import LRU_TTL from 'lru-ttl-model';

describe('LRU tests',function(){
	let cache: LRU_TTL<any, any>;
	const MAX_SIZE= 5;
	const TMP_VALUE= {a: 1};
	const TMP_VALUE_KEY= 'key';
	const PER_VALUE= {a: 2};
	const PER_VALUE_KEY= 'perkey';

	
	beforeAll(function(){
		cache= new LRU_TTL({
			max: MAX_SIZE,
		});
	})

	it(`Should create and use LRU cache with ${MAX_SIZE} elements max`, function(){
		expect(cache.max).toBe(MAX_SIZE);
		expect(cache.length).toBe(0);
		expect(cache.tempLength).toBe(0);
		expect(cache.permanentLength).toBe(0);
	});

	it('Sould add one temporary element', function(){
		cache.set(TMP_VALUE_KEY, TMP_VALUE);
		expect(cache.length).toBe(1);
		expect(cache.size).toBe(1);
		expect(cache.tempLength).toBe(1);
		expect(cache.permanentLength).toBe(0);
		expect(cache.has(TMP_VALUE_KEY)).toBe(true);
		expect(cache.get(TMP_VALUE_KEY)).toBe(TMP_VALUE);
	})

	it('Sould add one permanent element', function(){
		cache.setPermanent(PER_VALUE_KEY, PER_VALUE);
		expect(cache.length).toBe(2);
		expect(cache.size).toBe(2);
		expect(cache.tempLength).toBe(1);
		expect(cache.permanentLength).toBe(1);
		expect(cache.has(PER_VALUE_KEY)).toBe(true);
		expect(cache.get(PER_VALUE_KEY)).toBe(PER_VALUE);
	})

	it(`It should keep only ${MAX_SIZE} temporary elements`, function(){
		for(let i=-1; i<MAX_SIZE; ++i){
			cache.set(i, i);
		}

		expect(cache.length).toBe(MAX_SIZE + 1);
		expect(cache.tempLength).toBe(MAX_SIZE);
		expect(cache.get(TMP_VALUE_KEY)).toBe(undefined);
		expect(cache.has(TMP_VALUE_KEY)).toBe(false);
	})

	it('Should keep permanent element', function(){
		expect(cache.permanentLength).toBe(1);
		expect(cache.has(PER_VALUE_KEY)).toBe(true);
		expect(cache.get(PER_VALUE_KEY)).toBe(PER_VALUE);
	})

	it('Should keep returning last added item', function(){
		
	})
})
