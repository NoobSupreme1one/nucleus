const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './server/lambda.ts',
  target: 'node',
  mode: 'production',
  externals: [nodeExternals({
    allowlist: [
      '@aws-sdk/client-bedrock-runtime',
      '@aws-sdk/client-cognito-identity-provider',
      '@aws-sdk/client-s3',
      '@aws-sdk/s3-request-presigner'
    ]
  })],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  output: {
    filename: 'lambda.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
  optimization: {
    minimize: false, // Keep readable for debugging
  },
};