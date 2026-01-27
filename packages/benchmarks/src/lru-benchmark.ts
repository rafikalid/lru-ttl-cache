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

import { printResults } from './utils';

import { benchBuilder } from './helpers';
import { addCommonScenarios } from './common-scenarios';

// Test data setup
const CACHE_SIZE = 1_000;

export async function runLruBenchmark() {
  const builder = new benchBuilder({ max: CACHE_SIZE, ttl: 0 });
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
    });
  // Scenarios
  addCommonScenarios(builder);
  // build
  builder.build();

  // Run
  const results = await builder.run();
  printResults(results);
  return results;
}
