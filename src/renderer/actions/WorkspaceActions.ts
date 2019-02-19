import getLogger from "common/log/Logger"
import {remote} from "electron"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import {
  DataConfigTypes,
  IDataSet,
  IOutput,
  makeOutput,
  makeSnippet,
  OutputType,
  RowTypes,
  Workspace
} from "common/models/Workspace"
import JavaScript from "common/languages/javascript/javascript"
import {getValue, isFunction} from "typeguard"
import delay from "common/util/Delay"

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

export async function runWorkspace(workspace:Workspace):Promise<void> {
  let {snippet} = getWorkspace()
  const {id} = snippet
  snippet = {
    ...snippet,
    output: []
  }


  patchWorkspace(ws => ({
    history: [...ws.history.slice(Math.max(0,ws.history.length - 50),ws.history.length), snippet],
    snippet: makeSnippet()
  }))

  //await delay(50)

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

export function addOutput<T extends OutputType = any>(type:T,data:Array<IDataSet<T>>):IOutput<T> {
  const newOutput = makeOutput(type)
  newOutput.dataSets = data
  patchWorkspace(ws => ({
    ...ws,
    outputs: [...ws.outputs,newOutput]
  }))
  return newOutput
}

export function removeOutput(idOrIndex:number|string):void {
  patchWorkspace(ws => ({
    ...ws,
    outputs: [...ws.outputs.filter((output,index) => output.id !== idOrIndex && index !== idOrIndex)]
  }))
}

Object.assign(global,{
  addOutput,
  removeOutput,
  patchWorkspace,
  getWorkspace
})

declare global {
  function addOutput<T extends OutputType = any>(type:T,data:Array<IDataSet<T>>):IOutput<T>
  function removeOutput(idOrIndex:number|string):void
  function patchWorkspace(patch:Partial<Workspace>|((current:Workspace) => Partial<Workspace>)):void
  function getWorkspace():Workspace | null
}
