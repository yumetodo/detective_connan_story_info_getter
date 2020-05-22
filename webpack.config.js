// @ts-check
/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  entry: {
    'tools/storyConverter': './tools/storyConverter.ts',
  },
  target: 'node',
  node: {
    __dirname: false,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
};
