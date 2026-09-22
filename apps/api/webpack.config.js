const {NxAppWebpackPlugin} = require('@nx/webpack/app-plugin')
const {join} = require('path')
const webpack = require('webpack')

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
    new webpack.IgnorePlugin({
      resourceRegExp:
        /^(class-validator|class-transformer(?:\/.*)?|@fastify\/static|@nestjs\/(?:microservices|websockets)(?:\/.*)?)$/,
    }),
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'swc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [{input: join(__dirname, 'config'), glob: '**/*', output: 'config'}],
      // Images copy only dist + @node-rs/argon2. Nx defaults to externalizing all node_modules.
      externalDependencies: process.env.NODE_ENV === 'production' ? 'none' : 'all',
      mergeExternals: true,
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
    }),
  ],
}
