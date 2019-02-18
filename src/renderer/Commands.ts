import {CommandContainerBuilder, CommandType, getCommandManager} from "common/command-manager"
import {clearHistory, openWorkspaceFolder} from "renderer/actions/WorkspaceActions"

async function init():Promise<void> {
  const
    builder = new CommandContainerBuilder(document.body,"body"),
    {commands, menuItems} = builder
      .command(
        "CommandOrControl+o", openWorkspaceFolder,{
          name: "Open Workspace",
          type: CommandType.App,
          hidden: false,
          overrideInput: true
        }
      )
      .command(
        "CommandOrControl+k", clearHistory,{
          name: "Clear History",
          type: CommandType.App,
          hidden: false,
          overrideInput: true
        }
      )
      .make()

  getCommandManager()
    .registerItems(commands,menuItems)


}

export default init
