import Gulp from 'gulp';

import { compileEsNext, compileCommonjs } from './typescript.js';

const { watch, series } = Gulp;

const argv = process.argv;
const isProd = argv.includes('--prod');
const doWatch = argv.includes('--watch');

/** Watch modified files */
function watchCb(cb: Function) {
	if (doWatch) {
		watch('src/**/*.ts', compileEsNext);
	}
	cb();
}

var tasks: any[];
if (isProd) {
	tasks = [compileEsNext, compileCommonjs, watchCb];
} else {
	tasks = [compileEsNext, watchCb];
}

export default series(tasks);
