import { describe, it } from 'mocha';
import Assert from 'assert'
import LRU_TTL from '.';

describe('Cache Test', function () {
	var cache: LRU_TTL<any, any>;
	this.beforeAll(function () {
		cache = new LRU_TTL({
			ttl: 20000,
			max: 4
		});
	});
	// this.beforeEach(function(){
	//     cache.clearAll();
	// });

	describe('Check 1', function () {
		it('should insert tree elements', function () {
			cache.set('key1', 'value1')
				.set('key2', 2)
				.set(3, { value: 1 });
			Assert.strictEqual(cache.size, 3);
		});
		it('Should returns 3', function () {
			Assert.strictEqual(cache.get('key2'), 2);
		});
		it('Should returns "value1"', function () {
			Assert.strictEqual(cache.get('key1'), 'value1');
		});
		it('Should returns obj', function () {
			Assert.deepStrictEqual(cache.get(3), { value: 1 });
		});
		// it('should remove items after 70 seconds', function(cb){
		//     setTimeout(function(){
		//         var error= null
		//         try {
		//             Assert.strictEqual(cache.size, 0);
		//         } catch (err) {
		//             error= err
		//         }
		//         cb(error);
		//     }, 70000);
		// });
	});

	describe('LRU', function () {
		it('should keep last 4 elements only', function () {
			cache.set('ky1', 'v');
			cache.set('k2', 'v');
			cache.set('ky3', 'v');
			cache.set('ky4', 'v');
			cache.set('ky5', 'v');
			cache.set('ky6', 'v');
			cache.set('ky7', 'v');
			cache.set('ky8', 'v');
			cache.set('ky9', 'v');
			Assert.strictEqual(cache.size, cache.max);
		});
	});

	describe('TTL', function () {
		it('Should delete item after 4 seconds', function (cb: Function) {
			this.timeout(5000);
			var cache = new LRU_TTL({ ttl: 3000 });
			cache.set('k', 1);
			cache.set('k2', 2);
			cache.set('k3', 3);
			cache.setPermanent('k5', 'hello world')
			setTimeout(function () {
				console.log('---k5>>', cache.get('k5'));
				console.log('--size: ', cache.size)
				cb(cache.tempWeight > 0 ? new Error('Expected one element') : null)

			}, 4000)
		});
	})
})