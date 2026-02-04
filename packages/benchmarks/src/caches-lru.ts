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
import { CacheBuilder } from './types';

export const lruCaches: Record<string, CacheBuilder> = {
  'lru-ttl-cache': (max) => new LRU_TTL({ max }),
  'lru-ttl-cache/extended': (max) => new LRU_TTL_Extended({ max }),
  'lru-cache': (max) => new LRUCache({ max }),
  'quick-lru': (max) => new QuickLRU({ maxSize: max }),
  lru(max) {
    const c = new lru(max);
    c.delete = c.remove; // lru doesn't have delete, alias remove to delete
    return c;
  },
  'mnemonist/lru-cache': (max) => new mnemonistLRU(max),
  'tiny-lru': (max) => TinyLru(max),
  hashlru(max) {
    const c = HashLru(max);
    //@ts-ignore
    c.delete = c.remove; // hashlru doesn't have delete, alias remove to delete
    return c as any;
  },
  'simple-lru-cache'(max) {
    const c = new SimpleCache({ maxSize: max });
    c.delete = c.del;
    return c;
  },
};
