const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')

// A checker worker failure is not a successful type check. The upstream plugin
// logs worker errors but otherwise allows webpack to emit a successful build.
class FailOnTypecheckErrorPlugin {
  apply(compiler) {
    ForkTsCheckerWebpackPlugin.getCompilerHooks(compiler).error.tap(
      'FailOnTypecheckErrorPlugin',
      (error, compilation) => {
        compilation.errors.push(new compiler.webpack.WebpackError(`TypeScript checker failed: ${error.message || error}`))
      }
    )
  }
}

module.exports = { FailOnTypecheckErrorPlugin }
