import {ILogger} from "common/log/Logger"
import {IDataSet, IOutput, OutputType} from "common/models/Workspace"

// eslint-disable-next-line
export function makeOutputManagement(log:ILogger,context):any {

  return {
    addOutput: (name:string, type:OutputType,data:Array<IDataSet<any>>):IOutput<any> => {
      return addOutput(name,type,data)
    },

    removeOutput: (idOrIndex:string|number):void => {
      removeOutput(idOrIndex)
    }
  }
}
