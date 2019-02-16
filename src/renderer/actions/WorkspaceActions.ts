import getLogger from "common/log/Logger"
import {remote} from "electron"
import {UIActionFactory} from "renderer/store/actions/UIActionFactory"
import {makeSnippet, Workspace} from "common/models/Workspace"
import JavaScript from "common/languages/javascript/javascript"
import {isFunction} from "typeguard"

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
    history: [...ws.history, snippet],
    snippet: makeSnippet()
  }))

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
        output: [...newSnippet.output,...output]
      }
      return {
        ...current,
        history
      }
    })
  }

  const response = await JavaScript.run(workspace.dir,snippet,updateOutput)
  updateOutput(response.output)
}

export function getWorkspace():Workspace | null {
  return getRendererStoreState().UIState.workspace
}
