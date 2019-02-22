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
import {getValue, isDefined, isFunction, isString} from "typeguard"
import {getContextCompletions} from "common/languages/javascript/javascript-context-helper"
import WorkspaceRunner from "common/languages/javascript/WorkspaceRunner"
import * as JSONTruncate from 'json-truncate'
import ReplOutput from "renderer/components/output/ReplOutput"
import * as React from 'react'

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

  export function attach(projectDir: string, file:string, editor: CodeMirror.Editor, doc: CodeMirror.Doc): any {

    // Local Ref
    const localEditor = editor

    /**
     * Create Tern Inference Server
     */
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

    server.addDoc(file,doc)

    ;(editor as any).server = server

    function stringsToHints(
      from: CodeMirror.Position,
      to: CodeMirror.Position,
      doc: (string | React.ReactNode | ((value: string | { name: string, prop: string }) => string | React.ReactNode)),
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
              doc: isString(doc) || !isFunction(doc) ? doc :  doc(value),
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
          //log.info("Using key=", prop, "value=", value, context)
          return ReplOutput.transformObject(value)
          // `<div class="tooltip-value"><span>${name}</span>${!isDefined(value) ? "" : `
          //   <pre>${isString(value) ? value : JSON.stringify(JSONTruncate(value, 2), null, 2)}</pre></div>
          // `}`
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

    /**
     * Hint provider
     *
     * @param editor
     */
    const showCompletions = (editor: CodeMirror.Editor = localEditor): void => {
      editor.showHint({
        completeSingle: false,
        hint: getHint
      })
    }


    /**
     * Signal/Event handlers
     */
    const signalHandlers = {
      epicUpdateArgHints: (editor:CodeMirror.Editor) => {
        server.updateArgHints(editor)
      },
      epicShowType: (editor:CodeMirror.Editor) => {
        server.showType(editor)
      },
      epicShowDocs: (editor:CodeMirror.Editor) => {
        server.showDocs(editor)
      },
      epicShowCompletions: (editor:CodeMirror.Editor) => {
        showCompletions(editor)
      }
    }

    // Attach event handlers
    Object.entries(signalHandlers).forEach(([signal,handler]) =>
      editor.on(signal,(editor:CodeMirror.Editor) => {
        if (!editor) return
        try {
          handler(editor)
        } catch (err) {
          log.error("Unable to handle",signal,err)
        }
      })
    )

    return server
  }


}

export default JavaScript
