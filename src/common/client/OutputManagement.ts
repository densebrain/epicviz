import {ILogger} from "common/log/Logger"
import {IDataSet, IOutput, OutputType, RowTypes} from "common/models/Workspace"
import {addOutput} from "renderer/actions/WorkspaceActions"




// eslint-disable-next-line
export function makeOutputManagement(log:ILogger,context) {

  return {
    addOutput: <T extends OutputType>(type:T,data:Array<IDataSet<RowTypes<T>>>):IOutput<T> => {
      return addOutput(type,data)
    }
  }
}

// const DummyType = (false as true) && makeOutputManagement(null,null)
//
// export type OutputManagementType = typeof DummyType
