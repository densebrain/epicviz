import EventHub from "common/events/Event"

import getLogger from "common/log/Logger"
import {getConfig} from "common/config/ConfigHelper"

const log = getLogger(__filename)


async function init():Promise<void> {
	const config = getConfig()
	log.info("Config is", config)
}

export default init()
