// @ts-check
/**
 * @param {Object} env
 * @param {boolean} env.production
 * @param {Object} argv
 * @param {import('webpack').Configuration['mode']} argv.mode
 * @returns {import('webpack').Configuration}
 */
module.exports = (env, argv) => ({
  entry: {
    'tools/storyConverter': './tools/storyConverter.ts',
  },
  devtool: argv.mode === 'development' ? 'inline-source-map' : 'source-map',
  target: 'node',
  node: {
    __dirname: false,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: ['ts-loader?configFile=tools.tsconfig.json'],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  externals: {
    'moment-timezone': 'require("moment-timezone")',
  },
});
