// @ts-check
/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
  entry: {
    'tools/storyConverter': './tools/storyConverter.ts',
  },
  target: 'node',
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
