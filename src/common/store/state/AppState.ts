import {State} from "typedux"
import {IConfig} from "common/config/Config"
import {getConfig} from "common/config/ConfigHelper"

import {IAcceleratorMap} from "common/models/CommandTypes"
import {IAppStatus, makeDefaultAppStatus} from "common/models/AppStatus"
import {Workspace} from "common/models/Workspace"

export class AppState implements State<string> {
  static Key = "AppState"

  static fromJS(o: any = {}): AppState {
    return new AppState(o)
  }

  type = AppState.Key
  config: IConfig = {
    maxHistory: 50
  }

  customAccelerators: IAcceleratorMap

  status: IAppStatus = makeDefaultAppStatus()

  constructor(o: any = {}) {
    Object.assign(this, o, {
      config: getConfig()
    })
  }

  toJS(): Object {
    return {
      ...this,
      config: null
    }
  }


}
