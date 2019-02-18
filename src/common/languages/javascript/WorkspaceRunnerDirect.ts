import {transform} from "@babel/core"
import getLogger, {LogLevel} from "common/log/Logger"
import {
  ISnippet,
  IWorkspaceRunRequest,
  IWorkspaceRunResponse, IWorkspaceRunResponseResult,
  WorkspaceRunCommand,
  WorkspaceRunStatus
} from "common/models/Workspace"

import {realRequire} from "common/util/Require"
import WorkspaceRunner from "common/languages/javascript/WorkspaceRunner"
import {shortId} from "common/IdUtil"

const
  log = getLogger(__filename),
  errorLog = getLogger("REPL-ERROR")

// Object.assign(global, {
//   window: global,
//   console: log,
//   originalConsole: global.console
// })

const
  Path = realRequire("path"),
  Module = realRequire("module")


export async function executeRunRequest(dir: string, command: WorkspaceRunCommand, payload?: ISnippet | null, onOutput?: ((output: any[]) => void) | null): Promise<IWorkspaceRunResponseResult> {
  const
    id = shortId(),
    request = {
      id,
      dir,
      command,
      payload
    }

  let
    result =  {
      status: WorkspaceRunStatus.Created
    } as IWorkspaceRunResponseResult

  log.info("Event received", request)
  const logListener = (level: LogLevel, tag: string, ...args: any[]): boolean => {
    try {
      onOutput([
        {
          type: "log",
          level,
          tag,
          args: args
        }
      ])
    } catch (err) {
      errorLog.error("Unable to log", err, level, tag, ...args)
    }
    return false
  }

  WorkspaceRunner.addLogEventListener(logListener)
  try {
    result = await WorkspaceRunner.Handlers[command](request, result)
  } finally {
    WorkspaceRunner.removeLogEventListener(logListener)
  }

  log.info("Result", result)
  return result
}
