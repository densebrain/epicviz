import {State} from "typedux"
import {IConfig} from "common/config/Config"
import {getConfig} from "common/config/ConfigHelper"

import {IAcceleratorMap} from "common/models/CommandTypes"
import {IDataSyncStatus} from "common/Types"
import {IAppStatus, makeDefaultAppStatus} from "common/models/AppStatus"




export class AppState implements State<string> {
	static Key = "AppState"

	static fromJS(o:any = {}):AppState {
		return new AppState(o)
	}

	type = AppState.Key
	config: IConfig

	customAccelerators:IAcceleratorMap

	enabledRepoIds = Array<number>()

	syncs:{[table:string]:IDataSyncStatus} = {}

  status: IAppStatus = makeDefaultAppStatus()

	constructor(o:any = {}) {
		Object.assign(this,o,{
			config: getConfig()
		})
	}

	toJS():Object {
		return {...this, config: null, editing: {
        open: false,
				issue: null,
				status: {
          blockingWork: []
				}
      }}
	}


}
