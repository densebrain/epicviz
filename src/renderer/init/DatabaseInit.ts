import getLogger from "common/log/Logger"

const log = getLogger(__filename)

export async function init():Promise<void> {
	const db = (require("renderer/db/ObjectDatabase")).default
	await db.open()


}
