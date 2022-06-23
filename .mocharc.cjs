module.exports = {
	extension: ['js'],
	spec: ['./dist/**/*.test.js'],
	parallel: true,
	bail: true,
	reporter: 'mochawesome',
	'reporter-option': [
		'reportDir=test-reports',
		'reportFilename=report-[status]_[datetime]-[name]',
		'overwrite=false',
		'showSkipped=true',
		'saveJson=true',
		'saveHtml=true'
	],
	require: 'mochawesome/register',
	timeout: '20s'
};