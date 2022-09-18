import LRU_TTL from 'lru-ttl-model';

describe('Add remove Items', function(){
	let cache: LRU_TTL<any, any>;
	const TTL= '1h';
	const MAX= 100;

	
	beforeEach(function(){
		cache= new LRU_TTL({
			ttl: TTL,
			max: MAX
		});
	})

	it('Should add items and than clear only temporary items', function(){
		for(let i=0; i<10; ++i){
			cache.set(i, i);
		}
		cache.setPermanent('p1', 'v1')
		cache.setPermanent('p2', 'v2')
		cache.setPermanent('p2', 'v2')

		expect(cache.size).toBe(12);
		expect(cache.tempLength).toBe(10);
		expect(cache.permanentLength).toBe(2);

		cache.clearTemp();

		expect(cache.size).toBe(2);
		expect(cache.tempLength).toBe(0);
		expect(cache.permanentLength).toBe(2);
	})

	it('Should add items and than clear only permanent items', function(){
		for(let i=0; i<10; ++i){
			cache.set(i, i);
		}
		cache.setPermanent('p1', 'v1')
		cache.setPermanent('p2', 'v2')
		cache.setPermanent('p2', 'v2')

		expect(cache.size).toBe(12);
		expect(cache.tempLength).toBe(10);
		expect(cache.permanentLength).toBe(2);

		cache.clearPermanent();

		expect(cache.size).toBe(10);
		expect(cache.tempLength).toBe(10);
		expect(cache.permanentLength).toBe(0);
	})

	it('Should add items and than clear all', function(){
		for(let i=0; i<10; ++i){
			cache.set(i, i);
		}
		cache.setPermanent('p1', 'v1')
		cache.setPermanent('p2', 'v2')
		cache.setPermanent('p2', 'v2')

		expect(cache.size).toBe(12);
		expect(cache.tempLength).toBe(10);
		expect(cache.permanentLength).toBe(2);

		cache.clearAll();

		expect(cache.size).toBe(0);
		expect(cache.tempLength).toBe(0);
		expect(cache.permanentLength).toBe(0);
	})
})