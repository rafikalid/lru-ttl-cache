require('@rushstack/eslint-patch/modern-module-resolution');

const prettierConfig = require('./.prettierrc.json');

module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es2021: true,
		node: true,
		// 'cypress/globals': true,
		'jest/globals': true
	},
	extends: [
		'eslint:recommended',
		'plugin:prettier/recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'next/core-web-vitals',
		'plugin:json/recommended'
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaFeatures: {
			jsx: true
		},

		// ecmaVersion: 12,
		sourceType: 'module'
	},
	plugins: [
		// 'cypress',
		'simple-import-sort',
		'import',
		'jest',
		'jsx-a11y',
		'testing-library'
	],
	overrides: [
		{
			// Limit eslint-plugin-testing-library rules to matching files
			files: ['**/*.spec.ts'],
			extends: ['plugin:testing-library/dom', 'plugin:testing-library/react'],
			rules: {
				'testing-library/no-container': 0,
				'testing-library/no-node-access': 'off'
			}
		},
		{
			// Limit eslint-plugin-testing-library rules to matching files
			files: ['**/*.cjs'],
			rules: {
				'@typescript-eslint/no-var-requires': 'off'
			}
		}
	],
	rules: {
		// Possible errors
		'no-console': [
			'warn',
			{
				allow: ['info', 'warn', 'error']
			}
		],

		// Comments
		// 'lines-around-comment': [
		// 	'error',
		// 	{
		// 		allowArrayStart: true,
		// 		allowBlockStart: true,
		// 		allowObjectStart: true,
		// 		beforeBlockComment: true,
		// 		beforeLineComment: true
		// 	}
		// ],

		// Params
		'no-param-reassign': [
			'error',
			{
				props: false
			}
		],

		// Prettier
		'prettier/prettier': ['error', prettierConfig]
	}
};
