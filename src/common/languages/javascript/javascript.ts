import "codemirror/lib/codemirror.css"
import * as CodeMirror from 'codemirror'
// noinspection ES6UnusedImports
import * as ShowHint from 'codemirror/codemirror-showhint'

import TernServerClient from './tern-client'
import * as Path from "path"
import * as Fs from "async-file"
import getLogger from "common/log/Logger"
import {ISnippet, IWorkspaceRunner, IWorkspaceRunResponseResult, WorkspaceRunCommand} from "common/models/Workspace"

import {stopEvent} from "renderer/util/Event"
import {getCommandManager} from "common/command-manager"
import {getWorkspace} from "renderer/actions/WorkspaceActions"
import {getValue, isDefined, isString} from "typeguard"
import {getContextCompletions} from "common/languages/javascript/javascript-context-helper"
import WorkspaceRunner from "common/languages/javascript/WorkspaceRunner"
import * as JSONTruncate from 'json-truncate'


const
  log = getLogger(__filename)
//RunWorker = require("!!worker-loader!ts-loader?transpileOnly=true!./run-worker.ts"),
//GlobalEditorAPI = require("!!raw-loader!/GlobalEditorAPI.ts")


namespace JavaScript {
  let server: any | null = null

  export enum RunMode {
    Direct,
    Worker
  }

  const runMode = RunMode.Direct

  async function getRunner(): Promise<IWorkspaceRunner> {
    let runner: IWorkspaceRunner
    if (runMode === RunMode.Direct) {
      runner = await import("common/languages/javascript/WorkspaceRunnerDirect")
    } else {
      runner = await import("common/languages/javascript/WorkspaceRunnerWorkerClient")
    }

    return runner
  }

  export async function executeRunRequest(dir: string, command: WorkspaceRunCommand, payload?: ISnippet | null, onOutput?: ((output: any[]) => void) | null): Promise<IWorkspaceRunResponseResult> {
    const runner = await getRunner()
    return runner.executeRunRequest(dir, command, payload, onOutput)
  }


  export async function run(dir: string, snippet: ISnippet, onOutput?: ((output: any[]) => void) | null): Promise<IWorkspaceRunResponseResult> {
    const result = await executeRunRequest(dir, "execute", snippet, (output: any[]) => {
      onOutput && onOutput(output)
    })
    log.info("run result", result)
    return result
  }

  export function attach(projectDir: string, editor: CodeMirror.Editor): any {

    const localEditor = editor

    server = new TernServerClient({
      projectDir,
      files: {
        //"GlobalEditorAPI.ts": GlobalEditorAPI
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

    const navigateHistory = (editor: CodeMirror.Editor, event: KeyboardEvent): boolean => {
      const
        cursor = (editor as any).getCursor(),
        isLine0 = cursor.line === 0,
        history = getWorkspace().history,
        doc = editor.getDoc()

      if (navigatedHistory && !['ArrowUp', 'ArrowDown'].includes(event.key)) {
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
        historyIndex = Math.max(0, historyIndex - 1)
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

    function stringsToHints(
      from: CodeMirror.Position,
      to: CodeMirror.Position,
      doc: (string | ((value: string | { name: string, prop: string }) => string)),
      values: Array<string | { name: string, prop: string }>,
      excludedHints: Array<CodeMirror.Hint | string>
    ): Array<CodeMirror.Hint> {
      return values
        .filter(value => {
          const name = isString(value) ? value : value.name
          return excludedHints.none(hint =>
            (isString(hint) ?
              [hint] :
              [hint.text, hint.displayText])
              .includes(name))
        })
        .map(value => {
          const name = isString(value) ? value : value.name
          return ({
            data: {
              className: "CodeMirror-Tern-completion CodeMirror-Tern-completion-guess",
              name,
              type: "variable",
              doc: isString(doc) ? doc : doc(value),
              from,
              to
            },
            displayText: name,
            text: name
          })
        })
    }

    const getHint: CodeMirror.AsyncHintFunction = async (editor: CodeMirror.Editor, callback: (hints: CodeMirror.Hints) => any): Promise<any> => {
      const
        context = await WorkspaceRunner.getContext(getWorkspace().dir),
        jsHints = (CodeMirror as any).hint.javascript(editor),
        ternHints = await new Promise<any>((resolve, reject) => {
          server.getHint(editor, hints => resolve(hints))
        }),
        contextHints = getContextCompletions(editor, context)


      log.info("Hints", jsHints, contextHints, ternHints)
      const
        {from, to} = jsHints || ternHints,
        jsHintList = getValue(() => jsHints.list, [])

      const
        valueDocConverter = (result: any): string => {
          const name = result.name || result
          const prop = result.prop || name
          const value = _.get(context, prop) || name
          log.info("Using key=", prop, "value=", value, context)
          return `<div class="tooltip-value"><span>${name}</span>${!isDefined(value) ? "" : `
            <pre>${isString(value) ? value : JSON.stringify(JSONTruncate(value, 2), null, 2)}</pre></div>
          `}`
          //${isString(value) ? `"${value}"` : JSON.stringify(value, null, 2)}
        },
        hints = {
          ...(jsHints || {}),
          ...ternHints,
          list: [
            ...stringsToHints(from, to, "Keyword", jsHintList, [...contextHints, ...ternHints.list]),
            ...stringsToHints(from, to, valueDocConverter, contextHints, ternHints.list),
            ...ternHints.list
          ]
        }

      callback(hints)
    }

    getHint.async = true

    // HINT PROVIDER
    const showCompletions = (editor: CodeMirror.Editor = localEditor): void => {
      editor.showHint({
        completeSingle: false,
        hint: getHint
      })
    }

    editor.on("keydown", (editor: CodeMirror.Editor, event: KeyboardEvent) => {
      log.info("Editor key", event.key)


      if (navigateHistory(editor, event))
        return


      getCommandManager().onKeyDown(event)

    })


    editor.setOption("extraKeys", {
      "Ctrl-Space": function (editor) {
        //server.complete(editor)
        showCompletions(editor)
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

    ;(CodeMirror as any).hintOptions = {completeSingle: false}

    editor.on("inputRead", (editor: CodeMirror.Editor) => {
      if (editor.state.completionActive) {
        return
      }
      const cur = (editor as any).getCursor()
      const token = (editor as any).getTokenAt(cur)
      if (token.type && token.type !== "comment") {
        //server.complete(editor)
        //(CodeMirror as any).commands.autocomplete(editor)
        showCompletions(editor)
      }
    })

    return server
  }


}

export default JavaScript
