import { BenchmarkResult } from './types';

export function formatNumber(num: number) {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function zipfKeys(n: number, skew = 1.2) {
  const keys = Array.from({ length: n }, (_, i) => i);
  const weights = keys.map((k) => 1 / Math.pow(k + 1, skew));
  const sum = weights.reduce((a, b) => a + b, 0);
  const probs = weights.map((w) => w / sum);

  return () => {
    let r = Math.random();
    for (let i = 0; i < probs.length; i++) {
      r -= probs[i];
      if (r <= 0) return keys[i];
    }
    return keys[keys.length - 1];
  };
}

export function randomKeys(n: number) {
  return () => Math.floor(Math.random() * n);
}

const rankBadge = ['🥇', '🥈', '🥉'];

export function printResults(results: BenchmarkResult[]) {
  console.log('\n' + '='.repeat(80));
  console.log('Benchmark Results Summary');
  console.log('='.repeat(80) + '\n');
  const operations = Object.groupBy(results, (r) => r.scenarioName);
  const avgOpsPerCache = new Map<string, number>();
  for (const [scenario, ops] of Object.entries(operations)) {
    if (ops == null || ops.length === 0) continue;
    console.log(`⏱️  ${scenario}`);
    ops.sort((a, b) => b.opsPerSecond - a.opsPerSecond);
    for (let i = 0; i < ops.length; i++) {
      const r = ops[i];
      const rank = i + 1;
      const badge = rankBadge[i] ?? '  ';
      const opsSec = `${formatNumber(r.opsPerSecond)} ± ${r.rme.toFixed(2)}% Ops/sec`;
      console.log(`${badge} ${rank}. ${r.cacheName.padEnd(25)} ${opsSec.padStart(15)}`);
      avgOpsPerCache.set(r.cacheName, (avgOpsPerCache.get(r.cacheName) ?? 0) + r.opsPerSecond);
    }
    console.log('');
  }

  console.log('\n' + '='.repeat(80));
  console.log('Overall Performance Ranking');
  console.log('='.repeat(80) + '\n');
  const overallScores = Array.from(avgOpsPerCache.entries()).sort((a, b) => b[1] - a[1]);

  const cacheCount = avgOpsPerCache.size;
  overallScores.forEach(([cacheName, totalOps], index) => {
    const rank = index + 1;
    const badge = rankBadge[index] ?? '  ';
    const avgOps = totalOps / cacheCount;
    console.log(
      `${badge} ${rank}. ${cacheName.padEnd(25)} Avg: ${formatNumber(avgOps).padStart(15)} ops/sec`,
    );
  });

  console.log('\n' + '='.repeat(80));
  console.log('🏆 Winner: ' + overallScores[0][0]);
  console.log('='.repeat(80) + '\n');
}
