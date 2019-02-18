import UIState from "renderer/store/state/UIState"
import getLogger from "common/log/Logger"
import {Workspace} from "common/models/Workspace"

const log = getLogger(__filename)

getStore().observe([UIState.Key,"workspace"],async (workspace:Workspace) => {
  if (!workspace) return

  try {
    await workspace.save()
  } catch (err) {
    log.error("Unable to save workspace",err)
  }
})

export {}
