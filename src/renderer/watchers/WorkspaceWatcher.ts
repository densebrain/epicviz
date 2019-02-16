import UIState from "renderer/store/state/UIState"
import getLogger from "common/log/Logger"

const log = getLogger(__filename)

getStore().observe([UIState.Key,"workspace"],async (workspace) => {
  if (!workspace) return

  try {
    await workspace.save()
  } catch (err) {
    log.error("Unable to save workspace",err)
  }
})

export {}
