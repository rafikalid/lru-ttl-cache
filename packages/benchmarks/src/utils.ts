import { MemoryUsage } from './types';

// Helper function to measure memory usage
export function getMemoryUsage(): MemoryUsage {
  const mem = process.memoryUsage();
  return {
    heapUsed: mem.heapUsed,
    external: mem.external,
    arrayBuffers: mem.arrayBuffers || 0,
  };
}

// Helper function to format bytes
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatNumber(num: number) {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function zipfKeys(n, skew = 1.2) {
const keys = Array.from({ length: n }, (_, i) => i);
const weights = keys.map(k => 1 / Math.pow(k + 1, skew));
const sum = weights.reduce((a, b) => a + b, 0);
const probs = weights.map(w => w / sum);


return () => {
let r = Math.random();
for (let i = 0; i < probs.length; i++) {
r -= probs[i];
if (r <= 0) return keys[i];
}
return keys[keys.length - 1];
};
}


export function randomKeys(n) {
return () => Math.floor(Math.random() * n);
}

export function printResults(results: BenchmarkStats[]) {
  // Group results by operation type
  const operations = ['SET', 'GET', 'MIXED', 'DELETE'];

  operations.forEach((operation) => {
    const opResults = results.filter((r) => r.name.includes(operation));
    if (opResults.length === 0) return;

    console.log(`\n${operation} Operations:`);
    console.log('-'.repeat(80));

    // Sort by ops/sec descending
    opResults.sort((a, b) => b.opsPerSecond - a.opsPerSecond);

    const fastest = opResults[0];

    opResults.forEach((result, index) => {
      const libraryName = result.name.split(' - ')[0];
      const rank = index + 1;
      const badge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
      const percentage = ((result.opsPerSecond / fastest.opsPerSecond) * 100).toFixed(1);

      console.log(
        `${badge} ${rank}. ${libraryName.padEnd(25)} ${formatNumber(result.opsPerSecond).padStart(15)} ops/sec (${percentage}% of fastest)`,
      );
      console.log(
        `     ±${result.rme.toFixed(2)}% | ${result.samples} samples | Memory: ${formatBytes(Math.abs(result.memoryUsed))}`,
      );
    });
  });

  export function printSummary(results: BenchmarkStats[]) {
    const libraries = Array.from(new Set(results.map((r) => r.name.split(' - ')[0])));
  const overallScores = libraries.map((lib) => {
    const libResults = results.filter((r) => r.name.startsWith(lib));
    const avgOps = libResults.reduce((sum, r) => sum + r.opsPerSecond, 0) / libResults.length;
    const totalMemory = libResults.reduce((sum, r) => sum + Math.abs(r.memoryUsed), 0);

    return {
      library: lib,
      avgOpsPerSecond: avgOps,
      totalMemory: totalMemory,
      score: avgOps / 1000 - totalMemory / (1024 * 1024), // Simple scoring formula
    };
  });

  overallScores.sort((a, b) => b.avgOpsPerSecond - a.avgOpsPerSecond);

  overallScores.forEach((score, index) => {
    const rank = index + 1;
    const badge = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '  ';
    console.log(
      `${badge} ${rank}. ${score.library.padEnd(25)} Avg: ${formatNumber(score.avgOpsPerSecond).padStart(15)} ops/sec | Memory: ${formatBytes(score.totalMemory)}`,
    );
  });

  console.log('\n' + '='.repeat(80));
  console.log('🏆 Winner: ' + overallScores[0].library);
  console.log('='.repeat(80) + '\n');
  }