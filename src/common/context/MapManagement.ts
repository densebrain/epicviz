//import * as L from "leaflet"
import {ILogger} from "common/log/Logger"
import {IDataSet} from "common/models/Workspace"

// eslint-disable-next-line
export function makeMapManagement(log:ILogger,context) {

  return {
    /**
     * Create path
     *
     * @param name:string
     * @param dataSet:{rows:Array<{latitude:number,longitude:number}>,config:{center:Array<number>, color:string}}
     */
    createPath: (name:string,dataSet:IDataSet<"map-path">):void => {
      addOutput<"map-path">(name,"map-path",[dataSet])
    }
  }
}


// const DummyType = (false as true) && makeMapManagement(null,null)
//
// export type MapManagementType = typeof DummyType
