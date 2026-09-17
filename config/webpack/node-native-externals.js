const webpack = require('webpack')

/** Returns true when the module request is a native N-API package that must stay external. */
function isNodeNativeExternal(request) {
  return request === '@node-rs/argon2' || /^@node-rs\/argon2-/.test(request)
}

/** Webpack externals hook — keeps native packages in node_modules at runtime. */
function nodeNativeExternals(_ctx, callback) {
  const request = _ctx.request

  if (request && isNodeNativeExternal(request)) {
    callback(null, `commonjs ${request}`)
    return
  }

  callback()
}

/** Ignore optional platform packages probed by `@node-rs/argon2` at runtime. */
function createNodeNativeIgnorePlugins() {
  return [new webpack.IgnorePlugin({resourceRegExp: /^@node-rs\/argon2-/})]
}

module.exports = {
  nodeNativeExternals,
  createNodeNativeIgnorePlugins,
}
