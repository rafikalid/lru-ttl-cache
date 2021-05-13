import {watch, series, parallel} from 'gulp';
// import babel from 'gulp-babel';

import typescriptCompile from './gulp/typescript'

const compileSrc= typescriptCompile('src/**/*.ts', 'build');
const compileTest= typescriptCompile('src-test/**/*.ts', 'test');

const argv= process.argv;
const doWatch= !~argv.indexOf('--nowatch');
const isProd= process.argv.includes('--prod');

/** Watch modified files */
function watchCb(cb: ()=>void):void{
	if(doWatch && !isProd){
		watch(compileSrc.src).on('change', compileSrc.watch);
		watch(compileTest.src).on('change', compileTest.watch);
	}
	cb();
}

export default series([
	compileSrc.build,
	compileTest.build,
	watchCb
]);
