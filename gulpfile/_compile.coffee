###*
 * Compile server files
###
_addTask 'assets/**/*.coffee', ->
	gulp.src [ 'assets/**/[!_]*.coffee' ], nodir: true
		.pipe GulpErrHandler()
		.pipe include hardFail: true
		.pipe RmEmptyLines()
		.pipe Ejs settings
		# .pipe gulp.dest 'tmp/app/'
		.pipe GulpCoffeescript(bare: true)
		# if is prod
		<%= isProd ? uglfyExpNode : '' %>
		.pipe gulp.dest 'build/'

# ###*
#  * Copy static libs
# ###
# _addTask 'assets/lib/**/*', ->
# 	gulp.src 'assets/lib/**/*', nodir: true
# 		.pipe GulpErrHandler()
# 		.pipe gulp.dest 'build/lib/'

###* COMPILE TEST FILES ###
_addTask 'tests/**/*.coffee', ->
	gulp.src [ 'tests/**/[!_]*.coffee' ], nodir: true
		.pipe GulpErrHandler()
		.pipe include hardFail: true
		.pipe RmEmptyLines()
		.pipe Ejs settings
		# .pipe gulp.dest 'tmp/app/'
		.pipe GulpCoffeescript(bare: true)
		.pipe gulp.dest 'build/tests/'