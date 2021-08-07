import Gulp from 'gulp';

import {typescriptCompile, compileTestFiles} from './typescript.js'

const {watch, series, parallel}= Gulp;

const argv= process.argv;
const isProd= argv.includes('--prod');
const doWatch= !isProd && !argv.includes('--nowatch');

/** Watch modified files */
function watchCb(cb: Function){
	if(doWatch){
		watch('src/**/*.ts', typescriptCompile);
		// watch('test/**/*.ts', compileTestFiles);
		// watch('src/app/graphql/schema/**/*.gql', graphQlCompile)
	}
	cb();
}

export default series([
	parallel([
		typescriptCompile,
		// compileTestFiles,
	]),
	watchCb
]);
