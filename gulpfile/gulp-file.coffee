GridfwGulp= require 'gulp-gridfw'
Gulp= require 'gulp'

compiler= new GridfwGulp Gulp,
	isProd: <%= isProd %>


# INCLUDE PRECOMPILER PARAMS
params=
	isProd: <%= isProd %>

compiler
	.js
		name:	'API>> Compile for node'
		src:	['assets/node.coffee', 'assets/main.coffee']
		dest:	'build/'
		watch:	['assets/node.coffee', 'assets/main.coffee']
		data:	params
	.js
		name:	'API>> Compile for browser'
		src:	['assets/browser.coffee', 'assets/main.coffee']
		dest:	'build/'
		watch:	['assets/browser.coffee', 'assets/main.coffee']
		data:	params
		#TODO Check why babel do not work
		# babel:	<%- isProd %>
	.run()