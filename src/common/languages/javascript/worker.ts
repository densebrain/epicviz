// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// declare global: tern, server

//let server;
import getLogger from "common/log/Logger"
import {makeRequireFromPath} from "common/util/Require"

const ctx: Worker = self as any
const log = getLogger(__filename)

Object.assign(global,{
  window: global
})

const
  realRequire = __non_webpack_require__,
  Path = realRequire("path"),
  Module = realRequire("module"),
  Process = realRequire("process"),
  workerRequire = makeRequireFromPath(Path.resolve(Process.cwd(), "node_modules"))

workerRequire("acorn/dist/acorn.js")
workerRequire("acorn-loose/dist/acorn-loose.js")
workerRequire("acorn-walk/dist/walk.js")
workerRequire("tern/doc/demo/polyfill.js")
workerRequire("tern/lib/signal.js")
const tern:any = workerRequire("tern") as any
// const tern = require("tern/lib/tern.js")
workerRequire("tern/lib/def.js")
workerRequire("tern/lib/comment.js")
workerRequire("tern/lib/infer.js")
workerRequire("tern/plugin/doc_comment.js")
workerRequire("tern/plugin/requirejs.js");
workerRequire("tern/plugin/node.js");
workerRequire("tern/plugin/es_modules.js");
workerRequire("tern/plugin/doc_comment.js");
//workerRequire("../plugin/angular.js");

const defs = [
  // // @ts-ignore
  workerRequire("tern/defs/browser.json"),
  // // @ts-ignore
  workerRequire("tern/defs/ecmascript.json"),
  {
    ...require("context.json"),
    ...require("./GlobalEditorAPI.json")
  }

  // // @ts-ignore
  // workerRequire("tern/defs/underscore")
]

namespace TernWorker {
  let nextId = 0
  const pending = {} as any
  let server:any = null


  function getFile(file, c):void {
    log.info("Getting file",file)
    ctx.postMessage({type: "getFile", name: file, id: ++nextId});
    pending[nextId] = c;
  }

  function startServer(params): void {
    const {projectDir,files} = params
    //if (scripts) importScripts.apply(null, scripts);

    const opts = {
      getFile,
      async: true,
      defs,
      debug: true,
      ecmaScript: true,
      ecmaVersion: 9,
      projectDir,
      dependencyBudget: 1000000,// tern.defaultOptions.dependencyBudget,
      loadEagerly: ["node_modules/**/*.js"],

      plugins: {
        doc_comment: true,
        modules: {},
        es_modules: {},
        commonjs: {},
        node: {},
        node_resolve: {},
        complete_strings: {}
      }
    }

    server = new (tern as any).Server(opts)

    Object.entries(files).forEach(([name,code]) => {
      log.info("Adding file",name)
      server.addFile(name,code)
    })
  }

  ctx.onmessage = function (e) {
    const data = e.data;
    switch (data.type) {
      case "init":
        return startServer(data);
      case "add":
        return server.addFile(data.name, data.text);
      case "del":
        return server.delFile(data.name);
      case "req":
        return server.request(data.body, function (err, reqData) {
          ctx.postMessage({id: data.id, body: reqData, err: err && String(err)});
        });
      case "getFile":
        const c = pending[data.id];
        delete pending[data.id];
        return c(data.err, data.text);
      default:
        throw new Error("Unknown message type: " + data.type);
    }
  };


}

;(ctx as any).console = {
  log: function (v) {
    ctx.postMessage({type: "debug", message: v});
  }
}

Object.assign(global,{
  console: {
    info:function (...args) {
      ctx.postMessage({type: "debug", message: args});
    },
    error: function (...args) {
      ctx.postMessage({type: "debug", message: args});
    },
    log: function (...args) {
      ctx.postMessage({type: "debug", message: args});
    }
  }
})
