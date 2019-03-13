const path = require("path")
const webpack = require("webpack")
const merge = require("webpack-merge")
const miniCssExtractPlugin = require("mini-css-extract-plugin")
const uglifyJsPlugin = require("uglifyjs-webpack-plugin")
const optimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin")
const common = require("./webpack.common.js")

module.exports = merge(common, {
	mode: "production",
	devtool: "source-map",
	stats: "errors-only",
	bail: true,
	output: {
		filename: "js/[name].[chunkhash:8].js",
		chunkFilename: "js/[name].[chunkhash:8].chunk.js",
	},
	plugins: [
		new webpack.DefinePlugin({
			"process.env.NODE_ENV": JSON.stringify("production"),
		}),
		new webpack.optimize.ModuleConcatenationPlugin(),
		new miniCssExtractPlugin({
			filename: "style.css",
		}),
	],
	module: {
		rules: [
			{
				test: /\.(js)$/,
				exclude: /node_modules/,
				use: "babel-loader",
			},
			{
				test: /\.s?(a|c)ss/i,
				use: [miniCssExtractPlugin.loader, "css-loader", "sass-loader"],
			},
			// {
			// 	test: /\.styl$/,
			// 	loader: ["style-loader", "css-loader", "stylus-loader"],
			// },
		],
	},
	optimization: {
		minimizer: [
			new uglifyJsPlugin({
				cache: true,
				parallel: true,
				sourceMap: true, // set to true if you want JS source maps
			}),
			new optimizeCssAssetsPlugin({}),
		],
	},
})
