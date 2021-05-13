/**
 * Compile Typescript files
 */
import {src, dest, lastRun} from 'gulp';
import * as GulpTypescript from 'gulp-typescript';
import SrcMap from 'gulp-sourcemaps';
import Path from 'path'
import Uglify from 'gulp-terser';
import GulpFilter from 'gulp-filter';

import {transform} from 'ts-transform-import-path-rewrite'


//TODO Get "isProd" from CLI
const isProd= process.argv.includes('--prod');

const TsProject = GulpTypescript.createProject('tsconfig.json', {
	removeComments: isProd,
	pretty: !isProd,
	getCustomTransformers: ()=>({
		before: [
			transform({
				rewrite(impPath, sourceFilePath){
					var i=0;
					while(i<importPathsLen){
						var p= importPaths[i];
						if(impPath === p || impPath.startsWith(p+'/')){
							impPath= Path.relative(Path.dirname(sourceFilePath), Path.join(importPaths[i+1], impPath.substr(p.length+1))).replace(/\\/g, '/');
							if(!impPath.startsWith('.')) impPath= `./${impPath}`
							break;
						}
						i+= 2
					}
					return impPath;
				}
			})
		]
	})
});

// Prepare rewrite import paths
const importPaths= (function(){
	var ref= TsProject.config.compilerOptions.paths;
	var baseDir= Path.join(__dirname, '..', TsProject.config.compilerOptions.baseUrl);
	
	var result: string[]= [];
	for(var k in ref){
		result.push(
			k.replace(/\/\*$/, ''), // key
			// @ts-ignore
			Path.join(baseDir, ref[k][0].replace(/\/\*$/, '')) // value
		);
	}
	return result;
})();

const importPathsLen= importPaths.length;

// import babel from 'gulp-babel';

export default function(srcArg: string, destArg: string){
	function compile(path: string){
		var glp= src(path, {nodir: true})
		.pipe(SrcMap.init())
		.pipe(TsProject())
		// Uglify
		if(isProd){
			var f= GulpFilter(['*.js'], {restore: true});
			glp.pipe(f)
				.pipe(Uglify())
				.pipe(f.restore)
		}
		return glp.pipe(SrcMap.write('.'))
		.pipe(dest(destArg));
	}
	return {
		build: compile.bind(null, srcArg),
		watch: compile,
		src:	srcArg
	}
}