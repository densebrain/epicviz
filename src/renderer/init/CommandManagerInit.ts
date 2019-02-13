import getLogger from "common/log/Logger"


const log = getLogger(__filename)

export async function init():Promise<void> {
	const
		{SimpleMenuManagerProvider,getCommandManager} = require("common/command-manager")
	getCommandManager().setMenuManagerProvider(SimpleMenuManagerProvider)
}
