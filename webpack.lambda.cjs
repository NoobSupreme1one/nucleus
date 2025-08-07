const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './server/lambda.ts',
  target: 'node',
  mode: 'production', 
  externals: [nodeExternals({
    allowlist: [/.*/],
    externals: [
      /^@aws-sdk\//,
      '@prisma/client',
      'prisma'
    ]
  })],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true, // Skip type checking for faster builds
            configFile: 'tsconfig.lambda.json'
          }
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
      '@server': path.resolve(__dirname, 'server'),
      '@client': path.resolve(__dirname, 'client'),
    },
    extensionAlias: {
      '.js': ['.ts', '.js'],
    }
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'lambda.js',
    libraryTarget: 'commonjs2',
  },
  optimization: {
    minimize: false, // Keep readable for debugging
  },
};