const path = require('path');
const webpack = require('webpack');
require('./resolveEnv');

module.exports = {
  node: false,
  target: 'node',
  module: {
    rules: [
      {
        test: /.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, '../src'),
    },
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new webpack.DefinePlugin({
      PORT: JSON.stringify(Number(process.env.PORT)),
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    }),
    new webpack.ProgressPlugin(),
  ],
  output: {
    path: path.join(__dirname, '../dist'),
    filename: 'server.js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]',
  },
};
