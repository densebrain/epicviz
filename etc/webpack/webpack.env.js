const
  {getValue} = require("typeguard"),
  nodeEnv = process.env.NODE_ENV || "development",
  envName = getValue(() => process.env.MAPPER_ENV,
    getValue(() => process.env.USER, "prod")
  ).substring(0, 10),
  isDev = nodeEnv !== 'production',
  devToolsOpen = isDev,
  envStartupBuild = getValue(() => process.env.MAPPER_BUILD, "default"),
  Path = require('path'),
  Fs = require('fs'),
  baseDir = Path.resolve(__dirname, "..", ".."),
  _ = require('lodash'),
  pkgJson = JSON.parse(Fs.readFileSync(Path.resolve(baseDir, 'package.json'), 'utf-8')),
  isProd = envName === 'prod'

// noinspection WebpackConfigHighlighting
module.exports = isProcessMain => ({
  isDev,
  __DEV__: isDev,
  DEBUG: isDev,
  VERSION: JSON.stringify(pkgJson.version),
  'process.env.LANGUAGE_SERVER_PORT': JSON.stringify(3000),
  'process.env.isMainProcess': isProcessMain,
  'process.env.devToolsOpen': devToolsOpen,
  'process.env.__DEV__': isDev,
  'process.env.PACKAGE': JSON.stringify(process.env.PACKAGE ? "true" : "false"),
  'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  'process.env.BASEDIR': JSON.stringify(baseDir)
})
