const webpack = require('webpack');
const { merge } = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const StartServerPlugin = require('start-server-webpack-plugin');
const baseConfig = require('./webpack.base.config');

module.exports = merge(baseConfig, {
  entry: ['webpack/hot/poll?100', './src/main.ts'],
  watch: true,
  devtool: 'cheap-module-source-map',
  externals: [
    nodeExternals({
      allowlist: ['webpack/hot/poll?100'],
    }),
  ],
  mode: 'development',
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new StartServerPlugin({
      name: 'server.js',
      nodeArgs: [],
    }),
  ],
});
