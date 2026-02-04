import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/child-worker.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node18',
});
