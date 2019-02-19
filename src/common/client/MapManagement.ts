//import * as L from "leaflet"
import {ILogger} from "common/log/Logger"
import {IDataSet} from "common/models/Workspace"

// eslint-disable-next-line
export function makeMapManagement(log:ILogger,context) {

  return {
    createPath: (dataSet:IDataSet<"map-path">):void => {
      addOutput<"map-path">("map-path",[dataSet])
    }
  }
}

// const DummyType = (false as true) && makeMapManagement(null,null)
//
// export type MapManagementType = typeof DummyType
