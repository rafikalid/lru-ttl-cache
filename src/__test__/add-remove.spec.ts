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

	it('shoud add 2 and remove one item', function(){
		cache.set('key1', 'value1');
		cache.set('key2', 'value2');
		cache.set('key2', 'value2');

		expect(cache.size).toBe(2);

		cache.delete('key2');
		expect(cache.size).toBe(1);
	});

})