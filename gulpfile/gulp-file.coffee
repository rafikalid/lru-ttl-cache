gulp			= require 'gulp'
# gutil			= require 'gulp-util'
# minify		= require 'gulp-minify'
include			= require "gulp-include"
uglify			= require('gulp-terser')
Rename			= require "gulp-rename"
GulpCoffeescript= require 'gulp-coffeescript'
Coffeescript	= require 'coffeescript'
Ejs				= require "gulp-ejs"
GulpErrHandler	= require 'gulp-error-handle'
# Babel			= require 'gulp-babel'

Through2		= require 'through2'
# Vinyl			= require 'vinyl'
Path			= require 'path'
Fs				= require 'fs'


###
# SETTINGS
###
isProd= <%= isProd %>
settings=
	#=include app-params.coffee


# coffeescript filter options
CsOptions=
	bare: no
	header: no
	sourceMap: no
	sourceRoot: no

<%
const uglfyExpNode= '.pipe uglify {module: on, compress: {toplevel: true, module: true, keep_infinity: on, warnings: on} }';
const uglfyExpBrowser= '.pipe uglify {compress: {toplevel: no, keep_infinity: on, warnings: on} }';
%>

# components join
#=include gulp-file-join-components.coffee
#=include gulp-rm-empty.coffee

###*
 * add new compiler
###
_addTaskWatchers= []
_addTaskPara= []
_addTask= (watchPath, cb)->
	_addTaskPara.push cb
	_addTaskWatchers.push watchPath, cb
	return

#=include _*.coffee

# watch files
watch = (cb)->
	unless isProd
		i=0
		len= _addTaskWatchers.length
		while i<len
			gulp.watch _addTaskWatchers[i++], _addTaskWatchers[i++]
	cb()
	return

# default task
gulp.task 'default', gulp.series gulp.parallel.apply(gulp, _addTaskPara), watch