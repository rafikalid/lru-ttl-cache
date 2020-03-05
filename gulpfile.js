const gulp = require('gulp');
const gutil = require('gulp-util');
const include = require("gulp-include");
const coffeescript = require('gulp-coffeescript');
const PluginError = gulp.PluginError;
const Through2= require('through2');
const {exec}= require('child_process');
const GulpErrHandler	= require('gulp-error-handle');
const Ejs				= require("gulp-ejs")
// const chug = require('gulp-chug');

// get arguments with '--'
args = [];
for(var i=0, argv= process.argv, len = argv.length; i < len; ++i){
	if(argv[i].startsWith('--'));
		args.push(argv[i]);
}


// is Prod: 
var isProd= false;
for(var i=0, len=args.length; i<len; i++){
	if(args[i] === '--prod'){
		isProd= true;
		break;
	}
}

// run gulp
function runGulp(){
	console.info('>> Exec compiled Gulpfile:');
	var ps= exec('gulp --gulpfile=gulp-file.js');
	ps.stdout.on('data', function(data){console.log(data.trim())});
	ps.stderr.on('data', function(data){console.error('ERROR>> ', data.trim())});
	ps.on('error', function(err){ console.error('ERR>> ', err); });
	ps.on('close', function(){ console.log('>> Closed.') });
}

/* compile gulp-file.coffee */
compileRunGulp= function(){
	return gulp.src('gulpfile/gulp-file.coffee')
		.pipe( GulpErrHandler() )
		.pipe( include({hardFail: true}) )
		.pipe( Ejs({isProd}) )
		.pipe( coffeescript({bare: true}) )
		.pipe( gulp.dest('./') )
};

// default task
gulp.task('default', gulp.series(compileRunGulp, runGulp));