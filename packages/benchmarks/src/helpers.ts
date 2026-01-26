import Benchmark, { Suite } from 'benchmark';
import { BenchmarkResult } from './types';

interface CacheSign {
  get: (k: string | number) => void;
  set: (k: string | number, v: any) => void;
  delete: (k: string | number) => void;
}

type CreateCache = (max: number) => CacheSign;

type Scenario = (cache: CacheSign, options: Options) => void;

export interface Options {
  max: number;
}

export class benchBuilder {
  #caches: { name: string; create: CreateCache }[] = [];
  #scenarios: { title: string; description: string; scenario: Scenario }[] = [];
  #suite: Suite | null = null;
  #results: BenchmarkResult[] | null = null;

  constructor(private options: Options) {}

  addCache(name: string, create: CreateCache) {
    this.#caches.push({ name, create });
    return this;
  }

  addScenario(title: string, description: string, scenario: Scenario) {
    this.#scenarios.push({ title, description, scenario });
    return this;
  }

  build() {
    // Add all scenarios on all caches
    const suite = new Benchmark.Suite('LRU Benchmark');
    this.#suite = suite;
    const caches = this.#caches;
    const scenarios = this.#scenarios;
    const options = this.options;
    const results: BenchmarkResult[] = [];
    this.#results = results;
    for (let i = 0, len = scenarios.length; i < len; ++i) {
      const { title, description, scenario } = scenarios[i];
      for (let j = 0, len = caches.length; j < len; ++j) {
        const { name, create } = caches[j];
        suite.add(
          `[${name}] ${title}`,
          () => {
            const cache = create(options.max);
            scenario(cache, options);
          },
          {
            onComplete(event: any) {
              const target = event.target;
              results.push({
                name: target.name,
                cacheName: name,
                scenarioName: title,
                opsPerSecond: target.hz,
                rme: target.stats.rme,
                samples: target.stats.sample.length,
                mean: target.stats.mean,
              });
            },
          },
        );
      }
    }
  }

  run(): Promise<BenchmarkResult[]> {
    return new Promise((resolve) => {
      const suite = this.#suite;
      const results = this.#results;
      if (suite == null) throw new Error('Please build first');
      if (results == null) throw new Error('Unexpected error: results missing');
      this.#suite = null; // Prevent re-running
      suite
        .on('cycle', (event: any) => {
          const benchmark = event.target;
          console.log(`✓ ${String(benchmark)}`);
        })
        .on('complete', () => {
          resolve(results);
        });
      suite.run({ async: true });
    });
  }
}
