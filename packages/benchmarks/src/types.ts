export interface MemoryUsage {
  heapUsed: number;
  external: number;
  arrayBuffers: number;
}

export interface BenchmarkStats {
  name: string;
  opsPerSecond: number;
  rme: number; // Relative margin of error
  samples: number;
  mean: number;
  memoryBefore: MemoryUsage;
  memoryAfter: MemoryUsage;
  memoryUsed: number;
}
