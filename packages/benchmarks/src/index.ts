import { runBenchmarks } from './lru-benchmark.js';

async function main() {
  console.log('Starting LRU Cache Library Benchmarks...\n');
  console.log('Note: Run with --expose-gc flag for accurate memory measurements');
  console.log('Example: node --expose-gc src/index.ts\n');

  try {
    const results = await runBenchmarks();
    console.log('\n✅ Benchmarks completed successfully!');
    console.log(`Total tests run: ${results.length}`);
  } catch (error) {
    console.error('❌ Error running benchmarks:', error);
    process.exit(1);
  }
}

main();
