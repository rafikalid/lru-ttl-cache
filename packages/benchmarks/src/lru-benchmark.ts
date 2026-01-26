import LRU_TTL from 'lru-ttl-cache';
import LRU_TTL_Extended from 'lru-ttl-cache/extended';
import { LRUCache } from 'lru-cache';
import QuickLRU from 'quick-lru';
//@ts-ignore
import lru from 'lru';
import { LRUCacheWithDelete as mnemonistLRU } from 'mnemonist';
import { lru as TinyLru } from 'tiny-lru';
//@ts-ignore
import SimpleCache from 'simple-lru-cache';
import HashLru from 'hashlru';

import { zipfKeys, randomKeys, printResults } from './utils';

import { benchBuilder } from './helpers';

// Test data setup
const TEST_SIZE = 10_000;
const CACHE_SIZE = 1_000;
const HOT_SET = 100;
const THRASH_SET = 1_100;
const BIG_SET = 100_000;

export async function runLruBenchmark() {
  const builder = new benchBuilder({ max: CACHE_SIZE });
  builder
    // Caches
    .addCache('lru-ttl-cache', (max) => new LRU_TTL({ max }))
    .addCache('lru-ttl-cache/extended', (max) => new LRU_TTL_Extended({ max }))
    .addCache('lru-cache', (max) => new LRUCache({ max }))
    .addCache('quick-lru', (max) => new QuickLRU({ maxSize: max }))
    .addCache('lru', (max) => {
      const c = new lru(max);
      c.delete = c.remove; // lru doesn't have delete, alias remove to delete
      return c;
    })
    .addCache('mnemonist/lru-cache', (max) => new mnemonistLRU(max))
    .addCache('tiny-lru', (max) => TinyLru(max))
    .addCache('hashlru', (max) => {
      const c = HashLru(max);
      //@ts-ignore
      c.delete = c.remove; // hashlru doesn't have delete, alias remove to delete
      return c as any;
    })
    .addCache('simple-lru-cache', (max) => {
      const c = new SimpleCache({ maxSize: max });
      c.delete = c.del;
      return c;
    })
    // Scenarios
    .addScenario(
      'baseline:get-miss',
      `Baseline: get misses only. ${TEST_SIZE} entries`,
      (cache, { max }) => {
        for (let i = 0; i < TEST_SIZE; i++) {
          cache.get(i);
        }
      },
    )
    .addScenario(
      'hot-set:100% hit',
      `Hot set fits cache (best case, ${HOT_SET} entries)`,
      (cache) => {
        for (let i = 0; i < HOT_SET; i++) cache.set(i, i);
        for (let i = 0, max = 3 * HOT_SET; i < max; i++) {
          cache.get(i % HOT_SET);
        }
      },
    )
    .addScenario('hot-set:thrash', `Hot set slightly larger than cache (thrash)`, (cache) => {
      for (let i = 0; i < THRASH_SET; i++) cache.set(i, i);
      for (let i = 0; i < THRASH_SET; i++) {
        cache.get(i % THRASH_SET);
      }
    })
    .addScenario('zipfian-access', `Zipfian access (realistic)`, (cache) => {
      const nextKey = zipfKeys(BIG_SET);
      for (let i = 0; i < CACHE_SIZE; i++) {
        const k = nextKey();
        let v = cache.get(k);
        if (v === undefined) cache.set(k, k);
      }
    })
    .addScenario('sequential-scan', `Sequential scan (worst case)`, (cache) => {
      for (let i = 0; i < CACHE_SIZE; i++) {
        cache.get(i);
        cache.set(i, i);
      }
    })
    .addScenario('read-heavy (95/5)', `Read-heavy workload`, (cache) => {
      const nextKey = randomKeys(CACHE_SIZE);
      for (let i = 0; i < CACHE_SIZE; i++) cache.set(i, i);
      for (let i = 0; i < CACHE_SIZE; i++) {
        if (Math.random() < 0.95) {
          cache.get(nextKey());
        } else {
          cache.set(nextKey(), i);
        }
      }
    })
    .addScenario('write-heavy (50/50)', 'Write-heavy workload', (cache) => {
      const nextKey = randomKeys(BIG_SET);
      for (let i = 0; i < CACHE_SIZE; i++) {
        if (Math.random() < 0.5) {
          cache.get(nextKey());
        } else {
          cache.set(nextKey(), i);
        }
      }
    })
    .addScenario('set/delete', 'Setting up DELETE operations benchmark', (cache) => {
      for (let i = 0; i < CACHE_SIZE; i++) cache.set(i, i);
      for (let i = 0; i < CACHE_SIZE; i++) cache.delete(i);
    });
  // build
  builder.build();

  // Run
  const results = await builder.run();
  printResults(results);
  return results;
}
