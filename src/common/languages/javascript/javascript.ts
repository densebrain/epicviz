import "codemirror/lib/codemirror.css"
import * as CodeMirror from 'codemirror'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/htmlmixed/htmlmixed'
import 'codemirror/mode/css/css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/darcula.css'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/hint/show-hint'
import TernServerClient from  './tern-client'
import * as Path from "path"
import * as Fs from "async-file"
import getLogger from "common/log/Logger"
import {
  ISnippet,
  IWorkspaceRunRequest,
  IWorkspaceRunResponse, IWorkspaceRunResponseResult,
  WorkspaceRunCommand,
  WorkspaceRunResponsePayload
} from "common/models/Workspace"
import {StringMap} from "common/Types"
import Deferred from "common/Deferred"
import {shortId} from "common/IdUtil"


const
  log = getLogger(__filename),
  RunWorker = require("!!worker-loader!ts-loader?transpileOnly=true!./run-worker.ts"),
  GlobalEditorAPI = require("!!raw-loader!./GlobalEditorAPI.ts")


namespace JavaScript {
  let server:any | null = null

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

  async function executeRunRequest(dir:string, command:WorkspaceRunCommand, payload?: ISnippet | null, onOutput?:((output:any[]) => void) | null):Promise<IWorkspaceRunResponseResult> {
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


  export async function run(dir: string, snippet: ISnippet, onOutput?:((output:any[]) => void) | null): Promise<IWorkspaceRunResponseResult> {
    const result = await executeRunRequest(dir, "execute", snippet, (output:any[]) => {
      onOutput && onOutput(output)
    })
    log.info("run result", result)
    return result
  }

  export function attach(projectDir: string, editor: CodeMirror.Editor): any {

    server = new TernServerClient({
      projectDir,
      files: {
        "GlobalEditorAPI.ts": GlobalEditorAPI
      },
      getFile: async (name, c) => {
        log.info("Getting file", name)
        const fullPath = Path.resolve(process.cwd(), name)
        let data: string | null = null
        if (await Fs.exists(fullPath)) {
          data = await Fs.readFile(fullPath, "utf8")
        }
        c(name, data)
      }
    })


    editor.setOption("extraKeys", {
      "Ctrl-Space": function (cm) {
        server.complete(cm);
      },
      "Ctrl-I": function (cm) {
        server.showType(cm);
      },
      "Ctrl-O": function (cm) {
        server.showDocs(cm);
      },
      "Alt-.": function (cm) {
        server.jumpToDef(cm);
      },
      "Alt-,": function (cm) {
        server.jumpBack(cm);
      },
      "Ctrl-Q": function (cm) {
        server.rename(cm);
      },
      "Ctrl-.": function (cm) {
        server.selectName(cm);
      }
    })
    editor.on("cursorActivity", function (cm) {
      server.updateArgHints(cm);
    });


    return server
  }


}

export default JavaScript
