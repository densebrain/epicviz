import getLogger from "common/log/Logger"
import {remote} from "electron"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import {
  DataConfigTypes,
  IDataSet,
  IOutput, ISnippet,
  makeOutput,
  makeSnippet,
  OutputType,
  RowTypes,
  Workspace
} from "common/models/Workspace"
import JavaScript from "common/languages/javascript/javascript"
import {getValue, isFunction} from "typeguard"

import {shortId} from "common/IdUtil"
import {inputTextDialog} from "renderer/util/UIHelper"

const log = getLogger(__filename)

export async function openWorkspaceFolder():Promise<void> {
  const
    {dialog} = remote,
    win = remote.getCurrentWindow(),
    dirs = dialog.showOpenDialog(win,{
      title: "Open Workspace",
      properties: ["openDirectory","showHiddenFiles"]
    })

  if (!dirs || !dirs.length)
    return

  const projectDir = dirs[0]
  new UIActionFactory().setProjectDirAndWorkspace(projectDir, await Workspace.load(projectDir))

}

export function clearSnippetOutput():void {
  patchWorkspace(current => ({
    snippet: {
      ...current.snippet,
      output: []
    }
  }))
}

export function patchWorkspace(patch:Partial<Workspace>|((current:Workspace) => Partial<Workspace>)):void {
  new UIActionFactory().patchWorkspace(isFunction(patch) ? patch(getWorkspace()) : patch)
}

export async function runWorkspace(workspace:Workspace, snippet:ISnippet | null = null):Promise<void> {
  const snippetProvided = Boolean(snippet)
  if (!snippet) {
    snippet = getWorkspace().snippet
  }

  const {id} = snippet
  snippet = {
    ...snippet,
    output: []
  }

  const
    ws = getWorkspace(),
    patch = {

    } as Partial<Workspace>

  if (!snippetProvided) {
    Object.assign(patch,{
      history: [...ws.history.slice(Math.max(0,ws.history.length - 50),ws.history.length), snippet],
      snippet: makeSnippet()
    })
  } else {
    const
      newHistory = [...ws.history],
      snippetIndex = newHistory.findIndex(it => it.id === id)

    if (snippetIndex === -1)
      throw Error(`Unable to find snippet with id: ${id}`)

    newHistory[snippetIndex] = snippet
    Object.assign(patch,{
      history: newHistory
    })
  }
  patchWorkspace(patch)

  const updateOutput = (output:any[]):void => {
    patchWorkspace(current => {
      const
        history = [...current.history],
        index = history.findIndex(other => id ===other.id)

      if (index === -1) {
        log.warn("Snippet does not exist",history,id,index)
        return current
      }
      const newSnippet = {...history[index]}
      history[index] = {
        ...newSnippet,
        output: [
          ...newSnippet.output,
          ...output
        ]
      }
      return {
        ...current,
        history
      }
    })
  }

  const
    response = await JavaScript.run(workspace.dir,snippet,updateOutput),
    output = response.error ? [response.error] : !response.output ? [] :
      Array.isArray(response.output) ?
        response.output :
        [response.output]

  updateOutput(output)
}

export function clearHistory():void {
  patchWorkspace({history: []})
}

export function getWorkspace():Workspace | null {
  return getRendererStoreState().UIState.workspace
}

export function addOutput<T extends OutputType = any>(name:string,type:T,data:Array<IDataSet<T>>):IOutput<T> {
  const newOutput = makeOutput(name,type)
  newOutput.dataSets = data
  patchWorkspace(ws => ({
    ...ws,
    outputs: [...ws.outputs,newOutput]
  }))
  return newOutput
}

export async function saveSnippet(snippet:ISnippet):Promise<void> {
  const name = await inputTextDialog("Choose a name for your snippet","Set Name","")

  if (!name) return

  patchWorkspace(ws => ({
    savedSnippets: [...ws.savedSnippets,{...snippet,id: shortId(),name}]
  }))
}

export function setCurrentSnippet(snippet:ISnippet):void {
  patchWorkspace({
    snippet: {
      ...snippet,
      id: shortId(),
      output: []
    }
  })
  focusRepl()
}

export function removeSnippet(idOrIndexOrName:number|string):void {
  patchWorkspace(ws => ({
    ...ws,
    savedSnippets: [...ws.savedSnippets.filter((snippet,index) => snippet.name !== idOrIndexOrName && snippet.id !== idOrIndexOrName && index !== idOrIndexOrName)]
  }))
}

export function removeOutput(idOrIndexOrName:number|string):void {
  patchWorkspace(ws => ({
    ...ws,
    outputs: [...ws.outputs.filter((output,index) => output.name !== idOrIndexOrName && output.id !== idOrIndexOrName && index !== idOrIndexOrName)]
  }))
}

export function focusRepl():void {
  $(`#repl-input input, #repl-input textarea`).focus()
}

Object.assign(global,{
  addOutput,
  removeOutput,
  patchWorkspace,
  getWorkspace
})

declare global {
  function addOutput<T extends OutputType = any>(name:string, type:T,data:Array<IDataSet<T>>):IOutput<T>
  function removeOutput(idOrIndex:number|string):void
  function patchWorkspace(patch:Partial<Workspace>|((current:Workspace) => Partial<Workspace>)):void
  function getWorkspace():Workspace | null
}
