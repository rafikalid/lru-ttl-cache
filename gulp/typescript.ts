/**
 * Compile Typescript files
 */
import Gulp from 'gulp';
import GulpTypescript from 'gulp-typescript';
import SrcMap from 'gulp-sourcemaps';
import GulpRename from 'gulp-rename';

const { src, dest, lastRun } = Gulp;
// import {transform} from 'ts-transform-import-path-rewrite'

const isProd = process.argv.includes('--prod');

const TsProject = GulpTypescript.createProject('tsconfig.json', {
	removeComments: isProd,
	pretty: !isProd,
	target: 'ESNext',
	module: 'ESNext',
	moduleResolution: 'node'
});
const TsProjectCommonjs = GulpTypescript.createProject('tsconfig.json', {
	removeComments: isProd,
	pretty: !isProd,
	target: 'ES2015',
	module: 'CommonJS'
});

/** Compile as EsNext */
export function compileSrcEsm() {
	return src('src/**/*.ts', {
		nodir: true,
		since: lastRun(compileSrcEsm)
	})
		.pipe(SrcMap.init())
		.pipe(TsProject())
		.pipe(GulpRename({ extname: '.mjs' }))
		.pipe(SrcMap.write('.'))
		.pipe(dest('dist/module'));
}

/** Compile as Commonjs */
export function compileSrcCommonjs() {
	return src('src/**/*.ts', {
		nodir: true,
		since: lastRun(compileSrcCommonjs)
	})
		.pipe(SrcMap.init())
		.pipe(TsProjectCommonjs())
		.pipe(SrcMap.write('.'))
		.pipe(dest('dist/commonjs'));
}

/** Compile benchmarks */
export function compileBenchMark() {
	const TsProject = GulpTypescript.createProject('tsconfig.json', {
		removeComments: isProd,
		pretty: !isProd,
		target: 'ESNext',
		module: 'ESNext',
		moduleResolution: 'node',
		declarationFiles: false
	});

	return src('benchmark-src/**/*.ts', {
		nodir: true,
		since: lastRun(compileBenchMark)
	})
		.pipe(TsProject())
		.pipe(GulpRename({ extname: '.mjs' }))
		.pipe(dest('benchmark'));
}