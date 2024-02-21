'use strict';

const path = require('path');

const {VueLoaderPlugin} = require('vue-loader');
const webpack = require('webpack');


module.exports = {
	mode: 'production',
	entry: {
		app: './frontend/index.js'
	},
	output: {
		path: path.resolve(__dirname, 'frontend', 'public', 'dist'),
		filename: '[name].js'
	},
	module: {
		rules: [
			{test: /.vue$/, use: 'vue-loader'},
			{
				test: /\.pug$/,
				oneOf: [
					{resourceQuery: /^\?vue/, use: ['pug-plain-loader']},
					{use: ['raw-loader', 'pug-plain-loader']}
				]
			},
			{test: /.css$/, use: ['style-loader', 'css-loader']},
			{test: /.styl(us)?$/, use: ['style-loader', 'css-loader', 'stylus-loader']}
		]
	},
	plugins: [
		new VueLoaderPlugin(),
		new webpack.DefinePlugin({
			__VUE_OPTIONS_API__: true,
			__VUE_PROD_DEVTOOLS__: false,
			__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
		}),
	],
	stats: 'minimal'
};
