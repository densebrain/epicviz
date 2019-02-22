import UIState from "renderer/store/state/UIState"
import getLogger from "common/log/Logger"
import {Workspace} from "common/models/Workspace"

const log = getLogger(__filename)

async function saveWorkspace(workspace:Workspace):Promise<void> {
  try {
    await workspace.save()
  } catch (err) {
    log.error("Unable to save workspace",err)
  }
}

const saveWorkspaceDebounced = _.debounce(saveWorkspace,5000)

getStore().observe([UIState.Key,"workspace"],(workspace:Workspace) => {
  if (!workspace) return

  saveWorkspaceDebounced(workspace)
})

export {}
