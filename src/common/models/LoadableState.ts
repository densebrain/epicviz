import {State} from "typedux"
import {isFunction} from "typeguard"

export interface ILoadableState extends State<string> {
  load():Promise<void>
}

export function isLoadableState(o:State<string>):o is ILoadableState {
  return isFunction(o.load)
}
