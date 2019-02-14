const
  {getValue} = require('typeguard'),
  Path = require('path'),
  Webpack = require("webpack"),
  _ = require('lodash'),
  {DefinePlugin} = Webpack,
  rootPath = Path.resolve(__dirname, '..', '..'),
  modulePath = Path.resolve(rootPath, 'node_modules'),
  sourcePath = Path.resolve(rootPath, 'src'),
  nodeExternals = require('webpack-node-externals'),
  merge = require("webpack-merge")


function makeConfig(isMain) {
  const
    DefinedEnv = require('./webpack.env')(isMain),
    {isDev} = DefinedEnv

  /**
   * Create externals array
   */
  function makeExternals() {
    const whitelist = [
      /webpack/,
      /codemirror/,
      /highlight\.js/,
      /octokit/,
      /hot-loader/,
      /node-fetch/,
      /\/tern\//,
      /acorn/,
      //"react-dom",
      // /babel/,
      /react-hot/,
      // /hot-loader/,
      //"react-dom/,
      ///material-ui/
    ]
    return nodeExternals({
      whitelist
    })
    //['fs', 'module']
  }


  const config = {
    devtool: "source-map",
    output: {
      devtoolModuleFilenameTemplate: "file://[absolute-resource-path]"
    },
    resolve: {
      alias: {
        //"@": isMain ? Path.resolve(rootPath, 'src', 'main') : Path.resolve(rootPath, 'src', 'renderer'),
        assets: Path.resolve(rootPath, 'src', 'assets'),
        common: Path.resolve(rootPath, 'src', 'common'),
        main: Path.resolve(rootPath, 'src', 'main'),
        test: Path.resolve(rootPath, 'src', 'test'),
        'node-fetch': "common/Fetch",
        'react-dom': '@hot-loader/react-dom',
        renderer: Path.resolve(rootPath, 'src', 'renderer')


      },
      extensions: ['.webpack.js', '.web.js', '.js', '.ts', '.tsx']
    },
    plugins: [
      // ENV
      new DefinePlugin(DefinedEnv),
      new Webpack.NamedModulesPlugin(),
      new Webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      // Ignore require() calls in vs/language/typescript/lib/typescriptServices.js
      // new Webpack.IgnorePlugin(
      //   /^((fs)|(path)|(os)|(crypto)|(source-map-support))$/,
      //   /vs(\/|\\)language(\/|\\)typescript(\/|\\)lib/
      // ),
      // new Webpack.ContextReplacementPlugin(
      //   /monaco-editor(\\|\/)esm(\\|\/)vs(\\|\/)editor(\\|\/)common(\\|\/)services/
      // )

    ],
    /**
     * Node Shims
     */
    node: {
      __filename: true,
      global: true,
      process: true,

    },

    optimization: {
      minimize: false,
      namedModules: true,
      concatenateModules: true,
    },

    cache: true,

    module: {
      noParse: [/\/tern\//],
      rules: [
        {
          include: /worker\.js$/,
          loaders: ['worker-loader?inline=true','babel-loader'],
          // options: { inline: true }
        },
        
  
        // {
        //   test: /\.js$/,
        //   include: /monaco-editor/,
        //   use: ["source-map-loader","babel-loader"],
        //   enforce: "pre"
        // }
        // {
        //   test: /\.js$/,
        //   include: /monaco-editor/,
        //   use: ["source-map-loader","babel-loader"],
        //   enforce: "pre"
        // }
        // {
        //   include: /\.js$/,
        //   exclude: [/\/tern\//,/tern\.js$/],
        //   use: ["babel-loader"],
        //
        // },
        // {
        //   test: /^\.(scss|css)$/,
        //   use: ['style-loader!css-loader!sass-loader']
        // },
        // {
        //   test: /\.jsx?$/,
        //     //exclude: /node_modules/,
        //   include: /node_modules/,
        //     use: [{
        //     //Path.resolve(rootPath,"node_modules",
        //     loader: "babel-loader",
        //     options: {
        //       cacheDirectory: true
        //     }
        //   }]
        // },
        // {
        //   test: /\.jsx?$/,
        //   include: [/monaco-editor/,/vscode/],
        //   use: [{
        //     //Path.resolve(rootPath,"node_modules",
        //     loader: "babel-loader",
        //     options: {
        //       cacheDirectory: true,
        //       babelrc: false,
        //       presets: [
        //         [
        //           "@babel/preset-env",
        //           {
        //             debug: true,
        //             targets: {
        //               electron: "4.0.2"
        //             }
        //           }
        //         ],
        //         //"@babel/preset-react"
        //       ],
        //       plugins: [
        //         // plugin-proposal-decorators is only needed if you're using experimental decorators in TypeScript
        //         // ["@babel/plugin-proposal-decorators", {legacy: true}],
        //         // ["@babel/plugin-proposal-class-properties", {loose: true}],
        //         ["@babel/plugin-syntax-dynamic-import"],
        //         //["react-hot-loader/babel"]
        //       ],
        //       sourceMaps: "both"
        //     }
        //   }]
        // },
        // {
        //   test: /\.([jt])sx?$/,
        //   use: ["source-map-loader"],
        //   enforce: "pre"
        // }
        // {
        //   test: /\.jsx?$/,
        //   include: /node_modules/,
        //   use: ['react-hot-loader/webpack'],
        // },
        // {
        //   test: /\.([jt])sx?$/,
        //   use: ["source-map-loader"],
        //   enforce: "pre"
        // }
      ]
    },
  }

  if (!isMain)
    config.externals = makeExternals()

  return config
}


module.exports = (isMain, webpackConfig, env, ...args) => {
  console.log("ENV: ", process.env.NODE_ENV)
  if (process.env.NODE_ENV !== "production") {
    return makeConfig(isMain)
  }

  console.log(`${isMain},${env},${args}`)
  webpackConfig = {...webpackConfig}

  const
    loaders = getValue(() => webpackConfig.module.rules.map(rule =>
      getValue(() => rule.use.loader, rule.use) || rule.loader), [""]),
    esLintLoaderIndex = loaders.indexOf("eslint-loader"),
    babelLoaderIndex = loaders.indexOf("babel-loader")


  if (esLintLoaderIndex > -1) {
    webpackConfig.module.rules.splice(esLintLoaderIndex, 1)
  }
  //
  if (babelLoaderIndex > -1) {
    webpackConfig.module.rules.splice(babelLoaderIndex, 1)
  }

  console.log("Loaders", loaders)


  const config = merge.smart(webpackConfig, makeConfig(isMain))


  if (config.plugins[0] instanceof Webpack.LoaderOptionsPlugin) {
    config.plugins[0].options.minimize = false
  }

  config.optimization.minimize = false
  config.optimization.concatenateModules = true
  delete config.optimization.minimizer


  return config
}

