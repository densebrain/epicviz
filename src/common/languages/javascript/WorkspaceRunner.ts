import {Context as VMContext, createContext as createVMContext, runInContext as runInVMContext} from 'vm'
import {transform} from "@babel/core"
import getLogger, {LogEventListener, LogLevel} from "common/log/Logger"
import {
  ISnippet,
  IWorkspaceRunRequest,
  IWorkspaceRunResponse, IWorkspaceRunResponseResult,
  WorkspaceRunCommand,
  WorkspaceRunStatus
} from "common/models/Workspace"
import {isPromise} from "typeguard"

import delay from "common/util/Delay"
import {makeRequireFromPath, realRequire} from "common/util/Require"
import {makeReplContext} from "common/context/Context"
//import {makeReplContext} from "common/client/Context"
//const ctx: Worker = self as any
const
  log = getLogger(__filename),
  errorLog = getLogger("REPL-ERROR"),
  vmLog = getLogger("REPL-LOG")

// if (typeof window === "undefined") {
//   Object.assign(global,{
//     window: global
//   })
// }
//
// Object.assign(global,{
//   console: log,
//   originalConsole: global.console
// })

const
  Path = realRequire("path"),
  Module = realRequire("module")


namespace WorkspaceRunner {
  let runRequire:NodeRequire | null = null
  let runRequirePatch:NodeRequire | null = null
  let runContext:VMContext | null = null
  let dir:string | null = null

  export async function getContext(newDir:string):Promise<(VMContext & any) | null> {
    if (newDir !== dir || !runRequire || !runContext) {
      dir = newDir

      runRequire = makeRequireFromPath(
        Path.resolve(dir, "node_modules")
      )
      runRequirePatch = ((...args) => {
        //log.info("monkey patch require",...args)
        return (runRequire as any)(...args)
      }) as any

      Object.assign(runRequirePatch,runRequire)
      const Sh = require("shelljs")
      Sh.cd(dir)
      const context = {
        ...global,
        require: runRequirePatch,
        console: vmLog,
        ...Sh,
        ...(await makeReplContext(log,dir))
      }

      runContext = createVMContext(context)

      if (DEBUG) {
        Object.assign(global,{
          runContext
        })
      }
    }
    return runContext
  }

  export function addLogEventListener(listener:LogEventListener):void {
    vmLog.on(listener)
    log.on(listener)
  }

  export function removeLogEventListener(listener:LogEventListener):void {
    vmLog.off(listener)
    log.off(listener)
  }

  async function init(data:IWorkspaceRunRequest, result:IWorkspaceRunResponseResult):Promise<IWorkspaceRunResponseResult> {
    await getContext(data.dir)
    result.status = WorkspaceRunStatus.Success
    return result
  }

  async function execute(data:IWorkspaceRunRequest, result:IWorkspaceRunResponseResult):Promise<IWorkspaceRunResponseResult> {
    await init(data,result)

    const snippet = data.payload as ISnippet
    let code: string
    try {
      code = transform(snippet.code).code
    } catch (err) {
      //log.error("Compile error",err)
      result.status = WorkspaceRunStatus.CompileError
      result.stack = err.stack.toString()
      result.message = err.message
      result.error = err
      return result
    }

    try {
      if (!runContext)
        throw Error("Run context is not set")

      let output = runInVMContext(code,runContext)
      if (output && isPromise(output)) {
        output = await output
      }
      result.output = [output]
      result.status = WorkspaceRunStatus.Success
      await delay(100)
      return result
    } catch (err) {
      //log.error("Run error",err)
      result.status = WorkspaceRunStatus.Error
      result.stack = err.stack.toString()
      result.message = err.message
      result.error = err
      return result
    }
  }

  type HandlerMap = {[command in WorkspaceRunCommand]:((data:IWorkspaceRunRequest,result:IWorkspaceRunResponseResult) => Promise<IWorkspaceRunResponseResult>)}
  export const Handlers:HandlerMap = {
    init,
    execute
  }
}

export default WorkspaceRunner
