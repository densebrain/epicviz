import {ActionFactory, ActionMessage, ActionReducer, patchState} from "typedux"
import {DataState} from "../state/DataState"
import {IActionFactoryBase} from "./ActionFactoryBase"
import getLogger from "common/log/Logger"
import {makeDataSet, DataType, IDataSyncStatus, updateDataSet} from "common/Types"

const log = getLogger(__filename)

export class DataActionFactory extends ActionFactory<DataState,ActionMessage<DataState>> implements IActionFactoryBase<DataState> {

	constructor() {
		super(DataState)
	}

	leaf():string {
		return DataState.Key
	}


  @ActionReducer()
  setData<DT extends DataType = any, T extends any = any>(type:DT, data:Array<T>) {
    return (state:DataState) => patchState(state,{
      [type]: makeDataSet([...data])
    })
  }



	@ActionReducer()
	setState(newState:DataState) {
		return (state:DataState) => patchState(state,newState)
	}



}
