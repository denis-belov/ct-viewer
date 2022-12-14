const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const vtk_rules = require('vtk.js/Utilities/config/dependency.js').webpack.core.rules;

vtk_rules[2].use =
{
	loader: 'worker-loader',
	options: { inline: 'fallback' },
};

// console.log(vtk_rules[2].use);



module.exports = (env) =>
	({
		entry: './src/index.js',

		target: 'web',

		resolve:
		{
			extensions: [ '.js', '.scss' ],
		},

		output:
		{
			path: path.join(__dirname, 'build'),
		},

		module:
		{
			rules:
			[
				{
					test: /\.js$/,
					exclude: /node_modules/,

					use:

						env === 'development' ?

							[
								{
									loader: 'babel-loader',

									// workaround for correct transpiling glkit when linking from local directory
									options: JSON.parse(fs.readFileSync('.babelrc')),
								},
							] :

							[
								'babel-loader',
								'eslint-loader',
							],
				},

				{
					test: /\.(css|scss)$/,

					use
					[
						MiniCssExtractPlugin.loader,
						// to insert css into html
						// 'style-loader',
						'css-loader',
						'sass-loader',
					],
				},

				{
					test: /\.pug$/,

					use:
					[
						'html-loader',
						'pug-html-loader',
					],
				},

				{
					test: /\.html$/,
					use: { loader: 'html-loader', options: { minimize: true } },
				},

				{
					test: /\.(svg|png|jpg|jpeg)$/,
					use: 'base64-inline-loader',
				},

				{
					test: /\.cpp$/,
					use: '../xgk-cpp-webpack-loader/src/index.js',
				},

				...vtk_rules,
			],
		},

		devtool: env === 'development' ? 'source-map' : false,

		plugins:
		[
			new CleanWebpackPlugin(),

			new MiniCssExtractPlugin({ filename: 'index.css' }),

			new OptimizeCSSAssetsPlugin({}),

			new HtmlWebpackPlugin
			({
				filename: path.join(__dirname, 'build/index.html'),
				template: path.join(__dirname, 'src/index.pug'),
				inject: 'body',

				minify:
				{
					removeAttributeQuotes: true,
				},
			}),

			new CopyPlugin
			({
				patterns:
				[
					{ from: 'src/assets-debug', to: 'assets' },
				],
			}),

			new webpack.DefinePlugin
			({
				LOG: 'console.log',
			}),
		],

		devServer:
		{
			compress: true,
			historyApiFallback: true,
			host: 'localhost',
			port: 8080,
		},
	});
