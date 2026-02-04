import { BenchmarkResult } from './types';

export default function printResults(
  type: 'lru' | 'ttl',
  benchResultMap: [scenarioName: string, benches: BenchmarkResult[]][],
) {
  console.log('\n' + '='.repeat(80));
  console.log(`${type.toUpperCase()} Benchmark Results Summary`);
  console.log('='.repeat(80) + '\n');
  const rankBadge = ['🥇', '🥈', '🥉'];
  const avgOpsPerCache = new Map<string, number>();
  benchResultMap.forEach(([scenario, ops]) => {
    if (ops == null || ops.length === 0) return;
    console.log(`⏱️  ${scenario}`);
    ops.sort((a, b) => b.opsPerSec - a.opsPerSec);
    for (let i = 0; i < ops.length; i++) {
      const r = ops[i];
      const rank = i + 1;
      const badge = rankBadge[i] ?? '  ';
      const opsSec = `${formatNumber(r.opsPerSec)} ± ${r.rme.toFixed(2)}% Ops/sec`;
      console.log(`${badge} ${rank}. ${r.cacheName.padEnd(25)} ${opsSec.padStart(15)}`);
      avgOpsPerCache.set(r.cacheName, (avgOpsPerCache.get(r.cacheName) ?? 0) + r.opsPerSec);
    }
    console.log('');
  });

  console.log('\n' + '='.repeat(80));
  console.log(`${type.toUpperCase()} Overall Performance Ranking`);
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

export function formatNumber(num: number) {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}
