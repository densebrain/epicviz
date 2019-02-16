import _ from 'lodash';
import ReplConsoleHook from './ReplConsoleHook';
import ReplConstants from './ReplConstants';
import vm from 'vm';
import fs from 'fs';
import {dirname, resolve} from 'path';
import timers from 'timers';
import module from 'module';
import util from 'util';
const remote = require('electron').remote;
const execSync = require('child_process').execSync;
let cxt = null;
let systemVariables = [];
let missingGlobals = [];

const getPreferences = () => global.Mancy.preferences;
const noop = () => {};
let linkFun = noop;
const link = (context) => { (linkFun || noop)(context); };

const hookContext = (fun) => {
  linkFun = fun;
}

const createContext = () => {
  if(cxt) { return cxt; }
  // sandbox
  const context = vm.createContext();
  const defaults = [
    'process',
    'Buffer',
    'console',
    'module',
    'require',
    '__filename',
    '__dirname'
  ];

  const circulars = ['global', 'GLOBAL', 'root'];

  _.each(defaults, (g) => {
    context[g] = global[g];
  });

  _.each(circulars, (g) => {
    context[g] = context;
  });

  context.console = require('console');
  _.each(['error', 'warn', 'info', 'log', 'debug'], (fun) => {
    context.console[fun] = ReplConsoleHook[fun];
  });

  const timerFuns = [ 'clearImmediate', 'clearInterval', 'clearTimeout',
    'setImmediate', 'setInterval', 'setTimeout' ];

  _.each(timerFuns, (fun) => {
    context[fun] = timers[fun];
  });

  context.process.on('uncaughtException', function (err) {
    context.console.error(err);
    console.error(err);
  });

  // load builtIns
  const builtins = require('repl')._builtinLibs;
  _.each(builtins, (name) => {
    Object.defineProperty(context, name, {
      get: () => (context[name] = require(name)),
      set: (val) => {
        delete context[name];
        context[name] = val;
      },
      configurable: true
    });
  });

  const _load = module._load;
  module._load = (request, parent, isMain) => {
    try {
      return _load(request, parent, isMain);
    } catch(e) {
      const path = dirname(parent.paths[parent.paths.length - 1]);
      try {
        const child = execSync(`npm install ${request}`,
          { cwd: `${path}`, stdio:[], timeout: global.Mancy.preferences.timeout });
        return _load(request, parent, isMain);
      } catch(ex) {
        e.message = `${e.message} + (${ex.message.split('\n')[0]})`;
        throw e;
      }
    }
  };

  const debuglog = util.debuglog;
  util.debuglog = (name) => {
    if(name === 'repl') {
      return (fun, e, ret) => {
        if(fun === 'finish' && !e) {
          // unlink context
          link({});
        }
        else if(fun === 'line %j') {
          // link context
          link(context);
        }
      };
    }
    return debuglog(name);
  };

  systemVariables = _.keys(context);

  if(process.platform !== 'win32' && context.process.env.PATH.indexOf() == -1) {
    context.process.env.PATH += ':/usr/local/bin';
  }

  // Auto complete issue because when useGlobal is set to false
  const {ipcRenderer} = require('electron');
  const globalNames = ipcRenderer.sendSync('application:global-context-names');
  missingGlobals = globalNames.filter(n => !context[n]);

  systemVariables = systemVariables.concat(missingGlobals);

  // TODO: revisit
  // commented because of #101 issue

  // try {
  //   let code =`
  //     (() => {
  //       var poly = require('core-js/shim');
  //       Object.getOwnPropertyNames(poly).forEach(function(obj) {
  //         if(!this[obj]) { this[obj] = poly[obj]; }
  //         else {
  //           Object.getOwnPropertyNames(poly[obj]).forEach(function(p) {
  //             if(poly[obj][p] && !this[obj][p]) {
  //               this[obj][p] = poly[obj][p];
  //             }
  //           });
  //         }
  //       });
  //     })();
  //   `
  //   let script = vm.createScript(code, {
  //     filename: 'mancy-repl',
  //     displayErrors: false,
  //   });
  //   script.runInContext(context, { displayErrors: false });
  // } catch(e) {
  //   console.log(e);
  // }

  const {createScript} = vm;
  vm.createScript = (code, options) => {
    try {
      const {timeout} = getPreferences();
      const cxt = createScript(code, options);
      const runInContext = cxt.runInContext.bind(cxt);
      cxt.runInContext = (contextifiedSandbox, options) => {
        return runInContext(contextifiedSandbox, {
          displayErrors: false,
          timeout: timeout
        });
      };
      global.Mancy.REPLError = null;
      return cxt;
    } catch(e) {
      if(e instanceof SyntaxError) {
        global.Mancy.REPLError = e;
      }
      throw e;
    }
  };

  const _findPath = module._findPath;
  const relativeRegex = /^\./;
  const isRelativePath = p => relativeRegex.test(p);
  module._findPath = (request, paths, isMain) => {
    return _findPath(request, paths, isMain) ||
      (isRelativePath(request) &&
        module._findPath(request, [process.cwd()].concat(module.paths), isMain));
  };

  return (cxt = context);
};

const getContext = () => {
  return cxt ? cxt : createContext();
};

const builtIns = () => {
  return systemVariables;
};

const missingBuiltIns = () => {
  return missingGlobals;
}

// hiding cljs objects exposed
const alphaNames = Object.getOwnPropertyNames(createContext())
  .concat(['goog', 'cljs']);
export default { createContext, getContext, builtIns, hookContext, alphaNames,
  missingBuiltIns };
