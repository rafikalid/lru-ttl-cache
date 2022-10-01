/** Benchmark */
import Benchmark from 'benchmark';
import Chalk from 'chalk';
import Lru_tll_cache from 'lru-ttl-model';

import NodeCache from 'node-cache';
//@ts-ignore
import TtlCache from 'ttl-cache';
//@ts-ignore
import MemoryCacheTtl from 'memory-cache-ttl';
//@ts-ignore
import TimedCache from 'timed-cache';
//@ts-ignore
import NodeTtl from 'node-ttl';

const CACHE_TTL = 600000;

//* STD interface
//@ts-ignore
NodeCache.prototype.delete = NodeCache.prototype.del;
//@ts-ignore
TtlCache.prototype.delete = TtlCache.prototype.del;
//@ts-ignore
MemoryCacheTtl.delete = MemoryCacheTtl.del;
//@ts-ignore
TimedCache.prototype.set = TimedCache.prototype.put;
//@ts-ignore
TimedCache.prototype.delete = TimedCache.prototype.remove;
//@ts-ignore
NodeTtl.prototype.set = NodeTtl.prototype.push;
//@ts-ignore
NodeTtl.prototype.delete = NodeTtl.prototype.del;

//* TTL Benchmark
const suite = new Benchmark.Suite('TTL cache Benchmark');
suite
	//*node-cache
	.add('node-cache', function () {
		_test(new NodeCache({ stdTTL: CACHE_TTL }) as unknown as CacheInterface);
	})
	//* ttl-cache
	.add('ttl-cache', function () {
		_test(new TtlCache({ ttl: CACHE_TTL }) as unknown as CacheInterface);
	})
	//* memory-cache-ttl
	.add('memory-cache-ttl', function () {
		const cache = MemoryCacheTtl;
		cache.init({ ttl: CACHE_TTL });
		_test(cache as unknown as CacheInterface);
	})
	//* timed-cache
	.add('timed-cache', function () {
		_test(new TimedCache({ defaultTtl: CACHE_TTL }) as unknown as CacheInterface);
	})
	//* node-ttl
	.add('node-ttl', function () {
		_test(new NodeTtl({ ttl: CACHE_TTL }) as unknown as CacheInterface);
	})
	//* lru-ttl-cache
	.add('lru-ttl-cache', function () {
		_test(new Lru_tll_cache({ ttl: CACHE_TTL }));
	})
	//* HOOKS
	.on('start', function () {
		console.log(Chalk.bold.blue('TTL Cache Benchmark'));
	})
	.on('cycle', function (e: any) {
		console.log(e.target.toString());
	})
	.on('complete', function () {
		console.log('\x1b[43m\x1b[34mThe fastest is: ', suite.filter('fastest').map('name').join(), "\x1b[0m");
		process.exit(0);
	})
	.run({ async: true });

/** Test function */
function _test(cache: CacheInterface) {
	try {
		for (let i = 0; i < 20; ++i) {
			//* Add items, key as number
			for (let j = 0; j < 50; ++j)
				cache.set(j, 'Lorem ipsum');
			//* Add items, key as string
			for (let j = 0; j < 50; ++j)
				cache.set(`key${j}`, 'Lorem ipsum');
			//* Remove items
			for (let j = 7; j < 30; ++j) {
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
	get: (key: any) => unknown
	set: (key: any, value: any) => unknown
	delete: (key: any) => unknown
}