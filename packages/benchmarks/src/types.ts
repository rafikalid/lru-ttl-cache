export interface BenchmarkResult {
  name: string;
  cacheName: string;
  scenarioName: string;
  opsPerSecond: number;
  rme: number; // Relative margin of error
  samples: number;
  mean: number;
}
