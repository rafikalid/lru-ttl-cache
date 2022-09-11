#!/bin/sh

case $1 in
	build)
		yarn tsc -p tsconfig.esm.build.json
		yarn tsc -p tsconfig.cjs.build.json
		yarn terser dist/esm/index.js -o dist/esm/index.mjs -m toplevel
		rm dist/esm/index.js
		yarn terser dist/cjs/index.js -o dist/cjs/index.js -m toplevel
		for a in dist/esm/benchmark/*.js; do
			mv -- "$a" "${a%.js}.mjs"
		done
		;;
	benchmark)
		node --expose-gc dist/esm/benchmark/lru-bench.mjs
		node --expose-gc dist/esm/benchmark/ttl-bench.mjs
		;;
	*)
		echo 'Illegal argument:' $1
		;;
esac