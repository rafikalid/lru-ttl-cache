const Gulp = require('gulp');
const GulpTypescript = require('gulp-typescript');

const { series, dest, src } = Gulp;

const TsProject = GulpTypescript.createProject('tsconfig.json', {
	declaration: false,
	target: 'ES2015',
	module: 'CommonJS'
});

function compileGulp() {
	return src('gulp/**/*.ts').pipe(TsProject()).pipe(dest('gulp-dist'));
}

exports.default = series([compileGulp, runGulp]);

function runGulp(cb) {
	return require('./gulp-dist/gulpfile.js').default(cb);
}
