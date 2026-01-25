import LRU_TTL from 'lru-ttl-cache';
import { LRUCache } from 'lru-cache';
import QuickLRU from 'quick-lru';
//@ts-ignore
import lru from 'lru';
import { LRUCacheWithDelete as mnemonistLRU } from 'mnemonist';
//@ts-ignore
import LRU from 'js-lru';

import Benchmark from 'benchmark';
import { MemoryUsage, BenchmarkStats } from './types';
import { formatBytes, formatNumber, getMemoryUsage, zipfKeys, randomKeys } from './utils';

import {benchBuilder} from './helpers';

// Force garbage collection if available
const gc = global.gc || (() => {});


// Test data setup
const TEST_SIZE = 10_000;
const CACHE_SIZE = 1_000;
const HOT_SET = 100;
const THRASH_SET = 1_100;
const BIG_SET = 100_000;

const builder= new benchBuilder({max: CACHE_SIZE});
builder
  // Caches
  .addCache('lru-ttl-cache', (max)=> new LRU_TTL({ max }))
  .addCache('lru-cache', (max)=> new LRUCache({ max }))
  .addCache('quick-lru', (max)=> new QuickLRU({ maxSize: max }))
  .addCache('lru', (max)=> new lru(max))
  .addCache('mnemonist/lru-cache-with-delete', (max)=> new mnemonistLRU(max))
  .addCache('js-lru', (max)=> new LRU(max))
  // Scenarios
  .addScenario('baseline:get-miss', `Baseline: get misses only. ${TEST_SIZE} entries`, (cache, {max})=> {
    for (let i = 0; i < TEST_SIZE; i++) {
      cache.get(i);
    }
  })
  .addScenario('hot-set:100% hit', `Hot set fits cache (best case, ${HOT_SET} entries)`, (cache)=>{
    for (let i = 0; i < HOT_SET; i++) cache.set(i, i);
    for (let i = 0, max=3*HOT_SET; i < max; i++) {
      cache.get(i % HOT_SET);
    }
  })
  .addScenario('hot-set:thrash', `Hot set slightly larger than cache (thrash)`, (cache)=> {
    for (let i = 0; i < THRASH_SET; i++) cache.set(i, i);
    for (let i = 0; i < THRASH_SET; i++) {
      cache.get(i % THRASH_SET);
    }
  })
  .addScenario('zipfian-access', `Zipfian access (realistic)`, (cache)=> {
    const nextKey = zipfKeys(BIG_SET);
    for (let i = 0; i < CACHE_SIZE; i++) {
      const k = nextKey();
      let v = cache.get(k);
      if (v === undefined) cache.set(k, k);
    }
  })
  .addScenario('sequential-scan', `Sequential scan (worst case)`, (cache)=> {
    for (let i = 0; i < CACHE_SIZE; i++) {
      cache.get(i);
      cache.set(i, i);
    }
  })
  .addScenario('read-heavy (95/5)', `Read-heavy workload`, (cache)=>{
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
  .addScenario('write-heavy (50/50)','Write-heavy workload', (cache)=> {
    const nextKey = randomKeys(BIG_SET);
    for (let i = 0; i < CACHE_SIZE; i++) {
      if (Math.random() < 0.5) {
        cache.get(nextKey());
      } else {
        cache.set(nextKey(), i);
      }
    }
  })
  .addScenario('set/delete', 'Setting up DELETE operations benchmark', (cache)=> {
    for (let i = 0; i < CACHE_SIZE; i++) cache.set(i, i);
    for (let i = 0; i < CACHE_SIZE; i++) cache.delete(i);
  });

// Run
const results= await builder.run();
printResults(results);

console.log('\n' + '='.repeat(80));
console.log('Overall Performance Ranking');
console.log('='.repeat(80) + '\n');

printSummary(results);