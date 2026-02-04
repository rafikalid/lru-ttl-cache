export interface CacheSignature {
  get: (k: string | number) => void;
  set: (k: string | number, v: any) => void;
  delete: (k: string | number) => void;
  destroy?: () => void;
}

export type Scenario = (cache: CacheSignature, options: Options) => void;

export type CacheBuilder = (max: number, ttl: number) => CacheSignature;

export interface Options {
  max: number;
  ttl: number;
}

export interface BenchmarkResult {
  cacheName: string;
  cacheType: 'lru' | 'ttl';
  scenarioName: string;
  mean: number;
  variance: number;
  stdDev: number;
  rme: number;
  opsPerSec: number;
}
