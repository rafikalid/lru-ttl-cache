import Gulp from 'gulp';
import { compileBenchMark, compileSrcCommonjs, compileSrcEsm } from './typescript';

const { watch, series } = Gulp;

const argv = process.argv;
const doWatch = argv.includes('--watch');
const isProd = argv.includes('--prod');
const compileBenchmarking = argv.includes('--benchmark');

/** Watch modified files */
function watchCb(cb: Function) {
	if (doWatch) {
		watch('src/**/*.ts', compileSrcEsm);
	}
	cb();
}

const tasks = [compileSrcEsm, watchCb];
if (isProd) tasks.push(compileSrcCommonjs);
if (compileBenchmarking) tasks.push(compileBenchMark);

export default series(tasks);