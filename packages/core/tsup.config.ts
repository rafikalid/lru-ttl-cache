import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/extended/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  target: 'node18',
});
