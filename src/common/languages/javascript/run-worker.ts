import {Context as VMContext, createContext as createVMContext, runInContext as runInVMContext} from 'vm'
import {transform} from "@babel/core"
import getLogger, {LogLevel} from "common/log/Logger"
import {
  ISnippet,
  IWorkspaceRunRequest,
  IWorkspaceRunResponse, IWorkspaceRunResponseResult,
  WorkspaceRunCommand,
  WorkspaceRunStatus
} from "common/models/Workspace"
import {isPromise} from "typeguard"
import {npmInstall} from "common/languages/javascript/GlobalEditorAPI"
import delay from "common/util/Delay"

const ctx: Worker = self as any
const
  log = getLogger(__filename),
  vmLog = getLogger("REPL-LOG")

Object.assign(global,{
  window: global
})

const
  realRequire = __non_webpack_require__,
  Path = realRequire("path"),
  Module = realRequire("module"),
  Process = realRequire("process"),
  workerRequire = Module.createRequireFromPath(
    Path.resolve(Process.cwd(), "node_modules")
  )

Object.assign(global,{
  window: global
})

namespace WorkspaceRunner {
  let runRequire:NodeRequire | null = null
  let runRequirePatch:NodeRequire | null = null
  let runContext:VMContext | null = null
  let dir:string | null = null

  async function init(data:IWorkspaceRunRequest, result:IWorkspaceRunResponseResult):Promise<IWorkspaceRunResponseResult> {
    if (data.dir !== dir || !runRequire || !runContext) {
      dir = data.dir

      runRequire = Module.createRequireFromPath(
        Path.resolve(dir, "node_modules")
      )
      runRequirePatch = ((...args) => {
        log.info("monkey patch require",...args)
        return (runRequire as any)(...args)
      }) as any

      Object.assign(runRequirePatch,runRequire)

      const context = {
        ...global,
        require: runRequirePatch,
        npmInstall: function(name:string) {
          return npmInstall(dir,name)
        },
        console: vmLog
      }

      runContext = createVMContext(context)
    }
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
      log.error("Compile error",err)
      result.status = WorkspaceRunStatus.CompileError
      result.stack = err.stack.toString()
      result.error = err.message
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
      log.error("Run error",err)
      result.status = WorkspaceRunStatus.Error
      result.stack = err.stack.toString()
      result.error = err.message
      return result
    }
  }

  type HandlerMap = {[command in WorkspaceRunCommand]:((data:IWorkspaceRunRequest,result:IWorkspaceRunResponseResult) => Promise<IWorkspaceRunResponseResult>)}
  export const Handlers:HandlerMap = {
    init,
    execute
  }
}



ctx.onmessage = async (event) => {
  const
    data = event.data as IWorkspaceRunRequest,
    {id,command} = data

  const
    response:IWorkspaceRunResponse<"result"> = {
      id,
      type: "result",
      payload: {
        status: WorkspaceRunStatus.Created
      }
    }

  log.info("Event received",data)
  const logListener = (level:LogLevel,tag:string,...args:any[]):void => {
    ctx.postMessage({
      id,
      type: "output",
      payload: [
        {
          type: "log",
          level,
          tag,
          args
        }
      ]
    })
  }

  vmLog.on(logListener)
  try {
    response.payload = await WorkspaceRunner.Handlers[command](data, response.payload)
  } finally {
    vmLog.off(logListener)
  }

  try {
    ctx.postMessage(response)
  } catch (err) {
    log.error("Transmit error",err)
    response.payload.status = WorkspaceRunStatus.TransmitError
    response.payload.stack = err.stack.toString()
    response.payload.output = null
    response.payload.error = err.message
  }
}
