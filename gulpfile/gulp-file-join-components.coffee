###
# get HTML element (will be serialized and saved as Components._)
###
createElement= ->
	dv= document.createElement 'div'
	(fxName, args, repeat)->
		fx= @[fxName]
		throw "Unknown component: #{fxName}" unless fx
		html= if Array.isArray args then args.map(fx).join('') else fx args
		html= html.repeat repeat if repeat
		dv.innerHTML= html
		nodes= dv.childNodes
		frag= document.createDocumentFragment()
		while nodes.length
			frag.appendChild nodes[0]
		return frag
###*
* Join view components
* @param {String} options.targetFile - name of the target file
###
joinViewComponentsDefaultOptions=
	targetFile: 'components.js'
	template: 'window.Template' # default var name
joinViewComponents= (options)->
	data= Object.create null
	cwd= null
	# options
	options ?= Object.create null
	targetFile= options.targetFile or joinViewComponentsDefaultOptions.targetFile
	templateFx= options.template or joinViewComponentsDefaultOptions.template
	# collect data
	collect= (file, enc, cb)->
		return cb null unless file.isBuffer()
		# process
		err = null
		try
			fileName= file.basename
			# normalise fileName
			fileName= fileName.toLowerCase()
				.replace /^[\s_-]+|[\s_-]+$/g, ''
				.replace /[_-\s]+(\w)/g, (_, w)-> w.toUpperCase()
			throw new Error "Expected JS file: #{file.path}\n-------\n#{file.contents.toString 'utf8'}" unless fileName.endsWith '.js'
			content = file.contents.toString 'utf8'
			# data[fileName.slice(0, -3)] = "(function(){#{content.replace(/module.exports\s*=/, 'return ')}})()"
			data[fileName.slice(0, -3)] = content.replace(/^function\s+template/, 'function').replace(/module.exports=\s*template$/, '')
			# base dir
			cwd= file._cwd
		catch e
			err= e
		cb err
		return 
	# send to pipe
	concatAll= (cb)->
		err= null
		try
			# join data
			jn=[]
			for k,v of data
				jn.push "#{k}:#{v}"
			# add creator
			jn.push "_:(#{createElement.toString()})()"
			# push as file
			@push new Vinyl
				cwd: cwd
				path: targetFile
				contents: Buffer.from "#{templateFx}={#{jn.join ','}};"
		catch e
			err= e
		cb err
		
	# return
	Through2.obj collect, concatAll