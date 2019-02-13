import Dexie from "dexie"
//import 'dexie-observable'
import getLogger from "common/log/Logger"

const log = getLogger(__filename)

class ObjectDatabase extends Dexie {



	constructor() {
		super("epicviz")


    this.version(1).stores({

    })

		log.info("Start database")
	}

}


export interface IObjectDatabase extends ObjectDatabase {
}


const db = new ObjectDatabase()

export type ObjectDatabaseType = keyof ObjectDatabase

export default db
