###*
 * Remove empty lines added by include plugin
###
RmEmptyLines= ()->
	Through2.obj (file, enc, cb)->
		return cb null unless file.isBuffer()
		err=null
		try
			file.contents= Buffer.from file.contents.toString('utf8').replace(/^[\n\r]+$/gm, '')
		catch e
			err= e
		cb err, file
		