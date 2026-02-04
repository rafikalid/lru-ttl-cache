import { Scenario } from './types';
import { randomKeys, zipfKeys } from './utils';

// Test data setup
const TEST_SIZE = 10_000;
const CACHE_SIZE = 1_000;
const HOT_SET = 100;
const THRASH_SET = 1_100;
const BIG_SET = 100_000;

export const senarios: Record<string, Scenario> = {
  /** Baseline: get misses only */
  'baseline:get-miss'(cache) {
    for (let i = 0; i < TEST_SIZE; i++) {
      cache.get(i);
    }
  },
  /** Hot set fits cache */
  'hot-set:100% hit'(cache) {
    for (let i = 0; i < HOT_SET; i++) cache.set(i, i);
    for (let i = 0, max = 3 * HOT_SET; i < max; i++) {
      cache.get(i % HOT_SET);
    }
  },
  /** Hot set slightly larger than cache (thrash) */
  'hot-set:thrash'(cache) {
    for (let i = 0; i < THRASH_SET; i++) cache.set(i, i);
    for (let i = 0; i < THRASH_SET; i++) {
      cache.get(i % THRASH_SET);
    }
  },
  /** Zipfian access (realistic) */
  'zipfian-access'(cache) {
    const nextKey = zipfKeys(BIG_SET);
    for (let i = 0; i < CACHE_SIZE; i++) {
      const k = nextKey();
      let v = cache.get(k);
      if (v === undefined) cache.set(k, k);
    }
  },
  /** Sequential scan (worst case) */
  'sequential-scan'(cache) {
    for (let i = 0; i < CACHE_SIZE; i++) {
      cache.get(i);
      cache.set(i, i);
    }
  },
  /** Read-heavy workload */
  'read-heavy (95/5)'(cache) {
    const nextKey = randomKeys(CACHE_SIZE);
    for (let i = 0; i < CACHE_SIZE; i++) cache.set(i, i);
    for (let i = 0; i < CACHE_SIZE; i++) {
      if (Math.random() < 0.95) {
        cache.get(nextKey());
      } else {
        cache.set(nextKey(), i);
      }
    }
  },
  /** Write-heavy workload */
  'write-heavy (50/50)'(cache) {
    const nextKey = randomKeys(BIG_SET);
    for (let i = 0; i < CACHE_SIZE; i++) {
      if (Math.random() < 0.5) {
        cache.get(nextKey());
      } else {
        cache.set(nextKey(), i);
      }
    }
  },
  /** Setting up DELETE operations benchmark */
  'set/delete'(cache) {
    for (let i = 0; i < CACHE_SIZE; i++) cache.set(i, i);
    for (let i = 0; i < CACHE_SIZE; i++) cache.delete(i);
  },
};
