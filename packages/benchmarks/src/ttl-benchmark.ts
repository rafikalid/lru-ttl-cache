import { LRUCache } from 'lru-cache';
import { benchBuilder } from './helpers';
import QuickLRU from 'quick-lru';
import NodeCache from 'node-cache';
//@ts-ignore
import TtlCache from 'ttl-cache';
import TimedCache from 'timed-cache';
import { addCommonScenarios } from './common-scenarios';
import { printResults } from './utils';

const CACHE_SIZE = 1_000;
const CACHE_TTL = 2_000;

export async function runTtlBenchmark() {
  const builder = new benchBuilder({ max: CACHE_SIZE, ttl: CACHE_TTL });
  builder
    .addCache(
      'lru-cache',
      (max, ttl) =>
        new LRUCache({
          max,
          ttl,
        }),
    )
    .addCache(
      'quick-lru',
      (max, ttl) =>
        new QuickLRU({
          maxSize: max,
          maxAge: ttl,
        }),
    )
    .addCache('ttl-cache', (max, ttl) => {
      const c = new TtlCache({
        ttl,
      });
      c.delete = c.del;
      return c;
    })
    .addCache('node-cache', (max, ttl) => {
      const c = new NodeCache({
        stdTTL: ttl,
        checkperiod: 0,
        useClones: false,
      });
      // @ts-ignore
      c.delete = c.del;
      return c as any;
    })
    .addCache('timed-cache', (max, ttl) => {
      const c = new TimedCache({
        defaultTtl: ttl,
      });
      // @ts-ignore
      c.delete = c.remove;
      // @ts-ignore
      c.set = c.put;
      return c as any;
    })
    // .addCache('', (max, ttl)=> )
    // Senarios
    .addScenario('set value', '', (cache, { max, ttl }) => {
      cache.set(`k:${Math.random()}`, 1);
    })
    .addScenario('Bulk Insert', '', (cache, { max }) => {
      for (let i = 0; i < max; i++) {
        cache.set(`key:${i}`, `val:${i}`);
      }
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
