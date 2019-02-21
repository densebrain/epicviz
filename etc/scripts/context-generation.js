const chokidar = require('chokidar');
const Sh = require("shelljs")
const Path = require("path")
const Root = Path.resolve(__dirname,'..','..')
const ContextSrc = Path.resolve(Root,'src','common','context')

function log(...args) {
  console.log(...args)
}

chokidar.watch(ContextSrc, {ignored: /(^|[\/\\])\../}).on('all', (event, path) => {
  log("File changed", path)
  Sh.cd(Root)
  Sh.exec("npm run defs:compile")
})
