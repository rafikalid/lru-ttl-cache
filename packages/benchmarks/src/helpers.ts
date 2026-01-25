import Benchmark from "benchmark";

interface CacheSign {
  get: (k: string|number)=> void,
  set: (k: string|number, v: any)=> void,
  delete: (k: string|number)=> void
}

type CreateCache= (max: number)=> CacheSign

type Scenario = (cache: CacheSign, options: Options)=> void

export interface Options {
  max: number
}

export class benchBuilder {
  #caches: {name: string, create: CreateCache} CacheSign[];
  #scenarios: {title: string, description: string, scenario: Scenario}
  #suite: Suite

  constructor(private options: Options){}

  addCache(name: string, create: CreateCache){
    this.#caches.push({name, create});
    return this;
  }

  addScenario(title: string, description: string, scenario: Scenario){
    this.#scenarios.push({title, description, scenario});
    return this;
  }

  build(){
    // Add all scenarios on all caches
    const suite = new Benchmark.Suite('LRU Benchmark');
    this.#suite= suite;
    const caches= this.#caches;
    const scenarios= this.#scenarios;
    const {max}= this.options;
    for(let i=0, len= scenarios.length; i<len; ++i) {
      const {title, description, scenario}= scenarios[i];
      for(let j=0, len= caches.length; j<len; ++j){
        const {name, create}= caches[j];
        let memoryBefore: MemoryUsage;
        suite.add(title, ()=> {
          const cache = create(max);
          scenario(cache);
        }, {
          onStart(){
            memoryBefore = getMemoryUsage();
          },
          onComplete(event: any){
            gc();
            const memoryAfter = getMemoryUsage();
            const target = event.target;
            results.push({
              name: target.name,
              opsPerSecond: target.hz,
              rme: target.stats.rme,
              samples: target.stats.sample.length,
              mean: target.stats.mean,
              memoryBefore,
              memoryAfter,
              memoryUsed: memoryAfter.heapUsed - memoryBefore.heapUsed,
            });
          }
        });
      }
    }
  }

  run(){
    return new Promise((resolve)=> {
      const suite= this.#suite;
      if(suite == null) throw new Error('Please build first');
      suite
        .on("cycle", event => {
          const benchmark = event.target;
          console.log(`✓ ${String(benchmark)}`);
        })
        .on("complete", function () {
          console.log('\n' + '='.repeat(80));
          console.log('Benchmark Results Summary');
          console.log('='.repeat(80) + '\n');
  
          resolve(results);
        });
      suite.run({ async: true });
    })
  }
}