const { merge } = require('webpack-merge')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const nodeExternals = require('webpack-node-externals')
const baseConfig = require('./webpack.base.config')

module.exports = merge(baseConfig, {
  entry: ['./src/main.ts'],
  devtool: false,
  externals: [nodeExternals()],
  mode: 'production',
  plugins: [new CleanWebpackPlugin()],
})
