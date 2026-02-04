import { fork, spawn } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { lruCaches } from './caches-lru';
import { ttlCaches } from './caches-ttl';
import { BenchmarkResult } from './types';
import printResults from './print-results';
import { CHILD_PROCESS_TTL } from './config';

const CPU_COUNT = os.availableParallelism ? os.availableParallelism() : os.cpus().length;
const CHILD_WORKER_PATH = fileURLToPath(new URL('./child-worker.js', import.meta.url));

console.log(`Running ${CPU_COUNT} isolated processes`);

const cacheList = [
  ...Object.keys(lruCaches).map((name) => ({ name, type: 'lru' as const })),
  ...Object.keys(ttlCaches).map((name) => ({ name, type: 'ttl' as const })),
];

const benchResultMapByScenario = {
  lru: new Map<string, BenchmarkResult[]>(),
  ttl: new Map<string, BenchmarkResult[]>(),
};

await Promise.all(Array.from({ length: CPU_COUNT }, runChild));

function runChild(): Promise<any> {
  const cacheDef = cacheList.pop();
  if (!cacheDef) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const { name: cacheName, type: cacheType } = cacheDef;
    console.log(`${cacheType.toUpperCase()}>> "${cacheName}" starting benchmark...`);
    const child = fork(CHILD_WORKER_PATH, [], {
      execArgv: ['--expose-gc'],
      env: {
        ...process.env,
        CACHE_NAME: cacheName,
        CACHE_TYPE: cacheType,
      },
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      timeout: CHILD_PROCESS_TTL,
    });

    child.on('message', (msg: BenchmarkResult) => {
      console.log(
        `> ${cacheType.toUpperCase()}::${msg.cacheName}> ${msg.scenarioName}: ${msg.opsPerSec.toFixed(2)} ops/sec`,
      );
      const typeMap = benchResultMapByScenario[cacheType];
      const results = typeMap.get(msg.scenarioName);
      if (results == null) typeMap.set(msg.scenarioName, [msg]);
      else results.push(msg);
    });

    child.on('error', reject);

    child.on('exit', (code) => {
      if (code) {
        return reject(new Error(`Child exited with ${code}`));
      }
      resolve(null);
    });
  })
    .then(() => runChild())
    .catch((err) => {
      console.error(`❌ Cache "${cacheDef!.name}" encountered an error:`, err);
      return runChild();
    });
}

// Aggregate and print results
printResults('lru', Array.from(benchResultMapByScenario.lru.entries()));
printResults('ttl', Array.from(benchResultMapByScenario.ttl.entries()));
