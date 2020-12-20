###*
 * LRU & TTL fast in-mermory cache
###
class LRU_TTL
	###*
	 * LRU & TTL cache
	 * @param  {Integer} options.max		- Max entries in the cache. @default Infinity
	 * @param  {Integer} options.maxBytes	- Cache max size before removing elements. @default Infinity
	 * @param  {Integer} options.ttl		- Timeout before removing entries. @default Infinity
	 * @param  {Integer} options.interval	- TTL check interval. @default options.ttl
	 * @return {[type]}         [description]
	###
	constructor: (options)->
		# Default options
		@_max= Infinity
		@_ttl= Infinity
		@_maxBytes= Infinity
		@_refreshOnGet= yes
		@_upsertCb= null
		# underline map
		@_totalBytes= 0 # Entries total bytes
		@_map= new Map()
		@_head= null # last used element
		@_tail= null # first used element
		# TTL
		@_tmeout= null # SetInterval pointer
		# set config
		@setConfig options if options
		return
	###*
	 * Set configuration
	###
	setConfig: (options)->
		if options
			try
				if Reflect.has options, 'max'
					vl= options.max
					throw 'Options.max expected positive integer' unless (vl is Infinity) or (Number.isSafeInteger(vl) and vl>=0)
					@_max= vl
				if vl= options.ttl
					throw 'Options.ttl expected positive integer' unless (vl is Infinity) or (Number.isSafeInteger(vl) and vl>0)
					@_ttl= vl
				if vl= options.maxBytes
					throw 'Options.maxBytes expected positive integer' unless (vl is Infinity) or (Number.isSafeInteger(vl) and vl>0)
					@_maxBytes= vl
				if Reflect.has options, 'refreshOnGet'
					throw 'Options.refreshOnGet expect boolean' unless typeof options.refreshOnGet is 'boolean'
					@_refreshOnGet= options.refreshOnGet
				# Upsert
				if upsertCb= options.upsert
					@_upsertCb= upsertCb
				# run TTL process
				do @_runTTL
			catch err
				err= "LRU_TTL_CACHE>> #{err}" if typeof err is 'string'
				throw err
		this # chain

	###*
	 * Add new entry
	###
	set: (key, value, bytes= 0)->
		# Override if key already set
		if el= @_map.get(key)
			el.value= value
			el.bytes= bytes
			@_refresh el
		else if @_max
			@_set key, value, bytes
		this # chain
	_set: (key, value, bytes= 0)->
		lastElement= @_head
		map= @_map
		el=
			value: value
			key: key
			bytes: bytes # entry bytes
			prev: lastElement
			next: null
			time: Date.now() # insert time
		# Add
		lastElement?.next= el
		@_head= el
		map.set key, el
		@_totalBytes+= bytes
		# set tail as element if first one
		@_tail?= el
		# Remove oldest if exceeds count
		do @pop if map.size > @_max
		# Remvove oldest element if exceeds max bytes
		do @pop while @_totalBytes > @_maxBytes
		# run TTL process if not yeat started
		do @_runTTL
		return
	###*
	 * Get entry
	###
	get: (key)->
		if el= @_map.get key
			@_refresh el if @_refreshOnGet
			return el.value
		else
			return undefined
	###*
	 * Remove and get olders element
	###
	pop: ->
		if oldest= @_tail
			@_map.delete oldest.key
			# adjut chain
			nxtElement= oldest.next
			if nxtElement
				@_tail= nxtElement
				nxtElement.prev= null
			else
				@_tail= @_head= null
			# adjust flags
			@_totalBytes-=oldest.bytes
			# return
			return oldest.value
		return
	###*
	 * Get value or create it
	###
	upsert: (key)->
		if element= @_map.get key
			@_refresh element if @_refreshOnGet
			value= element.value
		else if cb= @_upsertCb
			value= cb key
			if @_max
				@_set key, value
				if value and typeof value.then is 'function'
					value.then (v)=>
						@_set key, v
						return
		return value
	###*
	 * Remove entry
	###
	delete: (key)->
		if el= @_map.get key
			@_map.delete key
			# remove from chain
			el.prev?.next= el.next
			el.next?.prev= el.prev
			# flags
			@_totalBytes-= el.bytes
		this # chain

	###*
	 * Remove all entries
	###
	clear: ->
		@_map.clear()
		@_head= @_tail= null
		@_totalBytes= 0
		this # chain
	###*
	 * Check has entry
	###
	has: (key)-> @_map.has key
	###*
	 * Get all kies
	 * @returns {Iterator} Iterator on all kies
	###
	keys: -> @_map.keys()
	###*
	 * Iterate over entries
	###
	entries: -> @_map.entries()
	###*
	 * For each
	###
	forEach: (cb)-> @_map.forEach (v, k)-> cb(v.value, k)

	###*
	 * Refresh element
	 * @private
	###
	_refresh: (el)->
		el.time= Date.now() # refresh time
		if (last= @_head) and (last isnt el)
			# remove from chain
			el.prev?.next= el.next
			el.next?.prev= el.prev
			# put as the freshest
			@_head= el
			el.prev= last
			el.next= null
			last.next= el
		return
	###*
	 * Run TTL to remove outdated elements
	 * @private
	###
	_runTTL: ->
		clearTimeout @_tmeout if @_tmeout
		# remove outDated elements
		if old= @_tail
			tme= Date.now() - @_ttl
			while old and old.time < tme
				@_map.delete old.key
				@_totalBytes-=old.bytes
				old= old.next
			# Set new flags
			if old
				@_tail= old
				old.prev= null
				# run next round
				if tme isnt -Infinity
					@_tmeout= setTimeout (@_runTTL.bind this), old.time - tme
			else
				@_tail= @_head= null
		return

	###*
	 * GETTERS
	###
	```
	get size(){return this._map.size}
	get bytes(){return this._totalBytes}
	```

###* For of ###
LRU_TTL::[Symbol.iterator]= ->
	it= @_map[Symbol.iterator]() # Get map iterator
	return {
		next: ->
			vl= it.next()
			value: vl.value?.value
			done: vl.done
	}
