import { performance } from 'node:perf_hooks';
import { lruCaches } from './caches-lru';
import { ttlCaches } from './caches-ttl';
import { senarios } from './senarios';
import { cacheSize, iterations, ttl, warmupIterations } from './config';
import { BenchmarkResult } from './types';

const cacheName = process.env.CACHE_NAME;
const cacheType = process.env.CACHE_TYPE as 'lru' | 'ttl' | undefined;

if (!cacheName || !cacheType) {
  console.error('CACHE_NAME and CACHE_TYPE environment variables must be set');
  process.exit(1);
}

const cacheBuilder = cacheType === 'lru' ? lruCaches[cacheName] : ttlCaches[cacheName];
if (!cacheBuilder) {
  console.error(`Cache ${cacheName} not found in ${cacheType} caches`);
  process.exit(1);
}

Object.keys(senarios).forEach(runSenario);

function runSenario(scenarioName: string) {
  const scenario = senarios[scenarioName];

  function workload() {
    const cache = cacheBuilder(cacheSize, ttl);
    scenario(cache, { max: cacheSize, ttl });
  }

  // ------------------------------
  // Warmup (JIT stabilization)
  // ------------------------------
  for (let i = 0; i < warmupIterations; i++) {
    workload();
  }

  // ------------------------------
  // Benchmark loop
  // ------------------------------
  const samples = [];

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    workload();
    samples.push(performance.now() - t0);
  }

  // ------------------------------
  // statistics
  // ------------------------------
  const n = samples.length;
  const mean = samples.reduce((a, b) => a + b, 0) / n;

  const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);

  const stdDev = Math.sqrt(variance);
  const rme = ((1.96 * stdDev) / Math.sqrt(n) / mean) * 100;

  const result: BenchmarkResult = {
    cacheName: cacheName!,
    cacheType: cacheType!,
    scenarioName,
    mean,
    variance,
    stdDev,
    rme,
    opsPerSec: 1000 / mean,
  };
  process.send!(result);
}

process.exit(0);
