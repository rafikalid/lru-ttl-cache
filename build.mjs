import * as esbuild from 'esbuild';
import pkg from './package.json' assert {type: 'json'};

const result= esbuild.build({
	entryPoints: ['src/index.ts'],
	bundle: true,
	packages: 'external',
	platform: 'node',
	minify: true,
	sourcemap: true,
	outdir: 'dist',
	banner: {
		js: `/** LRU-TTL-CACHE ${pkg.version} */`
	},
	color: true,
	logLevel: 'error'
});

console.log(result);