//import * as L from "leaflet"
import {ILogger} from "common/log/Logger"
import {IDataSet} from "common/models/Workspace"

// eslint-disable-next-line
export function makePlotManagement(log:ILogger,context) {

  return {
    createPlot2D: (name:string,dataSet:IDataSet<"plot-2d">):void => {
      addOutput<"plot-2d">(name,"plot-2d",[dataSet])
    }
  }
}


// const DummyType = (false as true) && makeMapManagement(null,null)
//
// export type MapManagementType = typeof DummyType
