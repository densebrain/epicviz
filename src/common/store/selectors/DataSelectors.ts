
import {DataState} from "common/store/state/DataState"
import getLogger from "common/log/Logger"

const log = getLogger(__filename)


export function dataSelector<T,P = any>(
	fn:(state:DataState, props?:any) => T
):(state:IRootState,props?:P) => T {
	return (state:IRootState,props:P) => fn(state.DataState,props) as T
}

