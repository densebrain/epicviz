import Deferred from "common/Deferred"
import {
  ISnippet,
  IWorkspaceRunRequest,
  IWorkspaceRunResponse,
  IWorkspaceRunResponseResult, WorkspaceRunCommand,
  WorkspaceRunResponsePayload
} from "common/models/Workspace"
import {StringMap} from "common/Types"
import {shortId} from "common/IdUtil"
import getLogger from "common/log/Logger"

const
  log = getLogger(__filename),
  RunWorker = require("!!worker-loader!ts-loader?transpileOnly=true!./WorkspaceRunnerWorker.ts")


type RunRequestWrapper = {
  deferred:Deferred<IWorkspaceRunResponseResult>
  request:IWorkspaceRunRequest
  onOutput: (output:any[]) => void
}

const
  runWorker = new RunWorker(),
  runRequests:StringMap<RunRequestWrapper> = {}

runWorker.onmessage = (event) => {
  const
    data = event.data as IWorkspaceRunResponse,
    {id,type,payload} = data,
    wrapper = runRequests[id]

  log.info("Received event", data)

  switch(type) {
    case "output":
      wrapper.onOutput(payload as WorkspaceRunResponsePayload<"output">)
      break
    case "result":
      delete runRequests[id]

      if (!wrapper) {
        log.error("Unable to find pending request for", id)
        return
      }

      wrapper.deferred.resolve(payload as WorkspaceRunResponsePayload<"result">)
      break
  }



}

export async function executeRunRequest(dir:string, command:WorkspaceRunCommand, payload?: ISnippet | null, onOutput?:((output:any[]) => void) | null):Promise<IWorkspaceRunResponseResult> {
  const
    id = shortId(),
    deferred = new Deferred<IWorkspaceRunResponseResult>(),
    request = {
      id,
      dir,
      command,
      payload
    }

  runRequests[id] = {deferred,request,onOutput}
  runWorker.postMessage(request)
  const result = await deferred.promise
  log.info("Result",result)
  return result
}
