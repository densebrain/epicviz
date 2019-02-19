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
import delay from "common/util/Delay"
import {realRequire} from "common/util/Require"
import WorkspaceRunner from "common/languages/javascript/WorkspaceRunner"
const ctx: Worker = self as any
const
  log = getLogger(__filename),
  errorLog = getLogger("REPL-ERROR"),
  vmLog = getLogger("REPL-LOG")

Object.assign(global,{
  window: global,
  console: log,
  originalConsole: global.console
})

const
  Path = realRequire("path"),
  Module = realRequire("module")



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
  const logListener = (level:LogLevel,tag:string,...args:any[]):boolean => {
    try {
      ctx.postMessage({
        id,
        type: "output",
        payload: [
          {
            type: "log",
            level,
            tag,
            args: args
          }
        ]
      })
    } catch (err) {
      errorLog.error("Unable to log",err,level,tag,...args)
    }
    return false
  }

  log.on(logListener)
  vmLog.on(logListener)
  try {
    response.payload = await WorkspaceRunner.Handlers[command](data, response.payload)
  } finally {
    vmLog.off(logListener)
    log.off(logListener)
  }

  try {
    ctx.postMessage(response)
  } catch (err) {
    log.error("Transmit error",err)
    response.payload.status = WorkspaceRunStatus.TransmitError
    response.payload.stack = err.stack.toString()
    response.payload.output = null
    response.payload.message = err.message
    ctx.postMessage(response)
  }
}
