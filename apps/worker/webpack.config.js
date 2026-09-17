const {NxAppWebpackPlugin} = require('@nx/webpack/app-plugin')
const {join} = require('path')

const {createNodeNativeIgnorePlugins, nodeNativeExternals} = require('../../config/webpack/node-native-externals')

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  externals: [nodeNativeExternals],
  plugins: [
    ...createNodeNativeIgnorePlugins(),
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'swc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      mergeExternals: true,
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
}
