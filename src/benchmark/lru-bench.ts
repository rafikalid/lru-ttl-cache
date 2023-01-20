/* eslint-disable */
/** Benchmark */
import Benchmark from 'benchmark';
import Chalk from 'chalk';
import LRU_TTL from 'lru-ttl-cache';

import LruCache from 'lru-cache';
// @ts-ignore
import Lru from 'lru';
import QuickLru from 'quick-lru';
// import LruCacheNode from 'lru-cache-node';

//* Adjust interface
Lru.prototype.delete = Lru.prototype.remove;

//* Config
const MAX_CACHE = 100;

//* LRU Benchmark
const suite = new Benchmark.Suite('LRU Cache Benchmark');
suite
	//* LRU-CACHE
	.add('lru-cache', function () {
		_test(new LruCache({ max: MAX_CACHE }));
	})
	//* LRU-TTL-CACHE
	.add('lru-ttl-cache', function () {
		_test(new LRU_TTL({ max: MAX_CACHE }));
	})
	//* LRU
	.add('lru', function () {
		_test(new Lru(MAX_CACHE) as unknown as CacheInterface);
	})
	//* quick-lru
	.add('quick-lru', function () {
		_test(new QuickLru({ maxSize: MAX_CACHE }));
	})
	//* lru-cache-node
	// ! lru-cache-node Contains errors
	// .add('lru-cache-node', function () {
	// 	_test(new LruCacheNode(MAX_CACHE));
	// })
	//* HOOKS
	.on('start', function () {
		console.log(Chalk.bold.blue('LRU Cache Benchmark'));
	})
	.on('cycle', function (e: any) {
		console.log(e.target.toString());
	})
	.on('complete', function () {
		console.log(
			'\x1b[43m\x1b[34mThe fastest is: ',
			suite.filter('fastest').map('name').join(),
			'\x1b[0m'
		);
		process.exit(0);
	})
	.run({ async: true });

/** Test function */
function _test(cache: CacheInterface) {
	try {
		for (let i = 0; i < 20; ++i) {
			//* Add items, key as number
			for (let j = 0; j < 200; ++j) cache.set(j, 'Lorem ipsum');
			//* Add items, key as string
			for (let j = 0; j < 90; ++j) cache.set(`key${j}`, 'Lorem ipsum');
			//* Remove items
			for (let j = 7; j < 50; ++j) {
				cache.delete(j);
				cache.delete(`key${j}`);
			}
			//* Get items
			for (let j = 1; j < 15; ++j) {
				cache.get(j);
				cache.get(`key${j}`);
			}
		}
	} catch (error) {
		console.error(error);
		throw error;
	}
}

interface CacheInterface {
	get: (key: any) => unknown;
	set: (key: any, value: any) => unknown;
	delete: (key: any) => unknown;
}
