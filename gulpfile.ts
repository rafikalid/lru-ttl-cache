import {watch, series, parallel} from 'gulp';
// import babel from 'gulp-babel';

import typescriptCompile from './gulp/typescript'

const compileSrc= typescriptCompile('src/**/*.ts', 'build');
const compileTest= typescriptCompile('src-test/**/*.ts', 'test');

/** Watch modified files */
function watchCb():void{
	watch(compileSrc.src).on('change', compileSrc.watch);
	watch(compileTest.src).on('change', compileTest.watch);
}

export default series([
	compileSrc.build,
	compileTest.build,
	watchCb
]);
