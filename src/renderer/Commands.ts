import {CommandContainerBuilder, getCommandManager} from "common/command-manager"
import {openWorkspaceFolder} from "renderer/actions/WorkspaceActions"

async function init ():Promise<void> {
  const builder = new CommandContainerBuilder(document.body,"body")
  builder
    .command("CommandOrControl+o", openWorkspaceFolder, {
      name: "Open workspace folder"
    })

  const {commands, menuItems} = builder.make()
  getCommandManager()
    .registerItems(commands,menuItems)


}

export default init
