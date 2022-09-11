// import { describe, it } from 'mocha';
// import LRU_TTL from '.';
// import { expect } from 'chai';

// describe('LRU test', function () {
// 	const CACHE_MAX_SIZE = 10;
// 	const PERMANENT_ITEMS_COUNT = 5;
// 	var cache: LRU_TTL<any, any>;

// 	this.beforeAll(function () {
// 		cache = new LRU_TTL({
// 			max: CACHE_MAX_SIZE
// 		});
// 	});
// 	// this.beforeEach(function(){
// 	//     cache.clearAll();
// 	// });

// 	describe('Check LRU works', function () {
// 		//* Insert temp items
// 		const tempCount = (CACHE_MAX_SIZE / 2) >> 0;
// 		it(`Should insert ${tempCount} temporary entries`, function () {
// 			for (let i = 0; i < tempCount; ++i) {
// 				cache.set(`t${i}`, `value ${i}`);
// 			}
// 			expect(cache.tempLength).to.eq(tempCount);

// 		});
// 		//* Insert permanent items
// 		it(`Should insert ${PERMANENT_ITEMS_COUNT} permanent entries`, function () {
// 			for (let i = 0; i < PERMANENT_ITEMS_COUNT; ++i) {
// 				cache.set(`per${i}`, `permanent value ${i}`);
// 			}
// 			expect(cache.permanentLength).to.eq(PERMANENT_ITEMS_COUNT);
// 		});


// 		//* Insert values to the cache
// 		it('should insert tree elements', function () {
// 			for (let [k, v] of assertedValues) {
// 				cache.set(k, v);
// 			}
// 		});
// 		//* Insert permanent item
// 		const cachePermanentEntries = 1;
// 		//* Assert sizes
// 		const cacheTempSize = assertedValues.size;
// 		const cacheSize = cacheTempSize + cachePermanentEntries;
// 		it(`Cache size should be ${cacheSize}`, function () { expect(cache.size).to.eq(cacheSize); });
// 		it('Cache weight should be 3', function () { expect(cache.weight).to.eq(3); });
// 		it('Cache temp weight should be 3', function () { expect(cache.tempWeight).to.eq(3); });
// 		it('Should returns 3', function () { expect(cache.get('key2')).to.eq(2); });
// 		it('Should returns "value1"', function () {
// 			Assert.strictEqual(cache.get('key1'), 'value1');
// 		});
// 		it('Should returns obj', function () {
// 			Assert.deepStrictEqual(cache.get(3), { value: 1 });
// 		});
// 		// it('should remove items after 70 seconds', function(cb){
// 		//     setTimeout(function(){
// 		//         var error= null
// 		//         try {
// 		//             Assert.strictEqual(cache.size, 0);
// 		//         } catch (err) {
// 		//             error= err
// 		//         }
// 		//         cb(error);
// 		//     }, 70000);
// 		// });
// 	});

// 	describe('LRU', function () {
// 		it('should keep last 4 elements only', function () {
// 			cache.set('ky1', 'v');
// 			cache.set('k2', 'v');
// 			cache.set('ky3', 'v');
// 			cache.set('ky4', 'v');
// 			cache.set('ky5', 'v');
// 			cache.set('ky6', 'v');
// 			cache.set('ky7', 'v');
// 			cache.set('ky8', 'v');
// 			cache.set('ky9', 'v');
// 			Assert.strictEqual(cache.size, cache.max);
// 		});
// 	});

// 	describe('TTL', function () {
// 		it('Should delete item after 4 seconds', function (cb: Function) {
// 			this.timeout(5000);
// 			var cache = new LRU_TTL({ ttl: 3000 });
// 			cache.set('k', 1);
// 			cache.set('k2', 2);
// 			cache.set('k3', 3);
// 			cache.setPermanent('k5', 'hello world')
// 			setTimeout(function () {
// 				console.log('---k5>>', cache.get('k5'));
// 				console.log('--size: ', cache.size)
// 				cb(cache.tempWeight > 0 ? new Error('Expected one element') : null)

// 			}, 4000)
// 		});
// 	})
// })