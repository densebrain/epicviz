import "codemirror/lib/codemirror.css"
import * as CodeMirror from 'codemirror'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/htmlmixed/htmlmixed'
import 'codemirror/mode/css/css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/darcula.css'
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/hint/show-hint'
import TernServerClient from './tern-client'
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
import {stopEvent} from "renderer/util/Event"
import {getCommandManager} from "common/command-manager"
import {getWorkspace} from "renderer/actions/WorkspaceActions"


const
  log = getLogger(__filename),
  //RunWorker = require("!!worker-loader!ts-loader?transpileOnly=true!./run-worker.ts"),
  GlobalEditorAPI = require("!!raw-loader!./GlobalEditorAPI.ts")


namespace JavaScript {
  let server: any | null = null

  export enum RunMode {
    Direct,
    Worker
  }

  const runMode = RunMode.Direct

  export async function executeRunRequest(dir: string, command: WorkspaceRunCommand, payload?: ISnippet | null, onOutput?: ((output: any[]) => void) | null): Promise<IWorkspaceRunResponseResult> {
    if (runMode === RunMode.Direct) {
      const {executeRunRequest} = await import("common/languages/javascript/WorkspaceRunnerDirect")
      return executeRunRequest(dir, command, payload, onOutput)
    } else if (runMode === RunMode.Worker) {
      const {executeRunRequest} = await import("common/languages/javascript/WorkspaceRunnerWorkerClient")
      return executeRunRequest(dir, command, payload, onOutput)
    }

    return null
  }


  export async function run(dir: string, snippet: ISnippet, onOutput?: ((output: any[]) => void) | null): Promise<IWorkspaceRunResponseResult> {
    const result = await executeRunRequest(dir, "execute", snippet, (output: any[]) => {
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

    editor.on("cursorActivity", function (cm) {
      server.updateArgHints(cm)
    })


    // HISTORY NAVIGATION
    let historyIndex = -1
    let navigatedHistory = false

    const navigateHistory = (editor:CodeMirror.Editor,event: KeyboardEvent):boolean => {
      const
        cursor = (editor as any).getCursor(),
        isLine0 = cursor.line === 0,
        history = getWorkspace().history,
        doc = editor.getDoc()

      if (navigatedHistory && !['ArrowUp','ArrowDown'].includes(event.key)) {
        navigatedHistory = false
        historyIndex = -1
      }

      if (event.key === "ArrowUp" && isLine0) {
        if (!navigatedHistory) {
          historyIndex = getWorkspace().history.length
        }

        if (historyIndex < 0) {
          return false
        }

        stopEvent(event)
        historyIndex = Math.max(0,historyIndex - 1)
        navigatedHistory = true

        const snippet = history[historyIndex]
        if (!snippet) {
          navigatedHistory = false
          historyIndex = -1
          return false
        }

        doc.setValue(snippet.code)
        return true
      }

      if (event.key === "ArrowDown" && navigatedHistory && historyIndex > -1) {
        historyIndex = Math.min(history.length, historyIndex + 1)
        navigatedHistory = true
        doc.undo()
        stopEvent(event)
        return true
      }

      return false
    }

    editor.on("keydown", (editor: CodeMirror.Editor, event: KeyboardEvent) => {
      log.info("Editor key", event.key)


      if (navigateHistory(editor,event))
        return


      getCommandManager().onKeyDown(event)

    })

    editor.setOption("extraKeys", {
      "Ctrl-Space": function (editor) {
        server.complete(editor)
      },
      "Ctrl-D,Cmd-D": function (editor) {
        server.showType(editor)
      },
      "Alt-P": function (editor) {
        server.showDocs(editor)
      }
      // "Alt-.": function (cm) {
      //   server.jumpToDef(cm);
      // },
      // "Alt-,": function (cm) {
      //   server.jumpBack(cm);
      // },
      // "Ctrl-Q": function (cm) {
      //   server.rename(cm);
      // },
      // "Ctrl-.": function (cm) {
      //   server.selectName(cm);
      // }
    })


    return server
  }


}

export default JavaScript
