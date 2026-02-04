import LRU_TTL from 'lru-ttl-cache';
import LRU_TTL_Extended from 'lru-ttl-cache/extended';
import { LRUCache } from 'lru-cache';
import QuickLRU from 'quick-lru';
import NodeCache from 'node-cache';
//@ts-ignore
import TtlCache from 'ttl-cache';
import TimedCache from 'timed-cache';
import { CacheBuilder } from './types';

export const ttlCaches: Record<string, CacheBuilder> = {
  'lru-ttl-cache': (max, ttl) => new LRU_TTL({ max, ttl }),
  'lru-ttl-cache/extended': (max, ttl) => new LRU_TTL_Extended({ max, ttl }),
  'lru-cache': (max, ttl) =>
    new LRUCache({
      max,
      ttl,
    }),

  'quick-lru': (max, ttl) =>
    new QuickLRU({
      maxSize: max,
      maxAge: ttl,
    }),
  'ttl-cache': (max, ttl) => {
    // Heap out of memory detected!
    const c = new TtlCache({
      ttl,
    });
    c.delete = c.del;
    return c;
  },
  'node-cache': (max, ttl) => {
    const c = new NodeCache({
      stdTTL: ttl,
      checkperiod: 0,
      useClones: false,
    });
    // @ts-ignore
    c.delete = c.del;
    return c as any;
  },
  'timed-cache': (max, ttl) => {
    // Out of memory detected!
    const c = new TimedCache({
      defaultTtl: ttl,
    });
    // @ts-ignore
    c.delete = c.remove;
    // @ts-ignore
    c.set = c.put;
    return c as any;
  },
};
