import Benchmark from 'benchmark';

const suite = new Benchmark.Suite('TTL cache Benchmark');
const PM = Date.now();
suite
	.add('===undefined', function () {
		const b = undefined
		if (b === undefined) {
			Math.random();
		}
	})
	.add('==null', function () {
		const b = undefined
		if (b == null) {
			Math.random();
		}
	})
	//* HOOKS
	.on('start', function () {
		console.log('Benchmark Starts');
	})
	.on('cycle', function (e: any) {
		console.log(e.target.toString());
	})
	.on('complete', function (e: any) {
		console.log('\x1b[43m\x1b[34mThe fastest is: ', suite.filter('fastest').map('name').join(), "\x1b[0m");
		process.exit(0);
	})
	.run({ async: true });