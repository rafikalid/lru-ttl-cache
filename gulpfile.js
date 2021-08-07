import Gulp from 'gulp';
import GulpTypescript from 'gulp-typescript';

const {series, dest, src}= Gulp;

const TsProject = GulpTypescript.createProject('tsconfig.json', {
	declaration: false
});

function compileGulp(){
	return src('gulp/**/*.ts')
		.pipe(TsProject())
		.pipe(dest('gulp-dist'));
}

async function runGulp(){
	return (await import('./gulp-dist/gulpfile.js')).default();
}

export default series([
	compileGulp,
	runGulp
]);
