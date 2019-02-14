// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// declare global: tern, server

let server;
const nodeRequire = __non_webpack_require__


  require("acorn/dist/acorn.js")
require("acorn-loose/dist/acorn-loose.js")
require("acorn-walk/dist/walk.js")
//require("tern/doc/demo/polyfill.js"></script>
require("tern/lib/signal.js")
const tern = require("tern/lib/tern.js")
require("tern/lib/def.js")
require("tern/lib/comment.js")
require("tern/lib/infer.js")
require("tern/plugin/doc_comment.js")
const defs = [
// @ts-ignore
  require("tern/defs/browser"),
  // @ts-ignore
  require("tern/defs/ecmascript"),
  // @ts-ignore
  require("tern/defs/underscore")
]

this.onmessage = function (e) {
  const data = e.data;
  switch (data.type) {
    case "init":
      return startServer(data.defs, data.plugins);
    case "add":
      return server.addFile(data.name, data.text);
    case "del":
      return server.delFile(data.name);
    case "req":
      return server.request(data.body, function (err, reqData) {
        postMessage({id: data.id, body: reqData, err: err && String(err)});
      });
    case "getFile":
      const c = pending[data.id];
      delete pending[data.id];
      return c(data.err, data.text);
    default:
      throw new Error("Unknown message type: " + data.type);
  }
};

let nextId = 0
const pending = {};

function getFile(file, c) {
  postMessage({type: "getFile", name: file, id: ++nextId});
  pending[nextId] = c;
}

function startServer(defs, plugins, scripts) {
  if (scripts) importScripts.apply(null, scripts);
  
  server = new tern.Server({
    getFile: getFile,
    async: true,
    defs: defs,
    plugins: {
      doc_comment: {},
      modules: {},
      es_modules: {},
      commonjs: {},
      node: {},
      node_resolve: {}
    }
  });
}

this.console = {
  log: function (v) {
    postMessage({type: "debug", message: v});
  }
};
