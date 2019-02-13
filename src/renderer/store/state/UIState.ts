import getLogger from "common/log/Logger"
import {State} from "typedux"
import {IDialog} from "renderer/models/Dialog"
import {ISearchChip, ISearchChipData} from "renderer/search/Search"

const log = getLogger(__filename)

/**
 *  UIState
 */

export class UIState implements State<string> {

  static Key = 'UIState'

  static fromJS(o:any = {}):UIState {
    return new UIState(o)
  }

  type = UIState.Key


  dialogs:Array<IDialog> = []

  notificationsOpen:boolean = false

  splitters = {
    notifications: 300 as string|number
  }

  searches: {
    [id:string]: Array<ISearchChipData>
  } = {}


  constructor(o: any = {}) {
    Object.assign(this, o)
  }

  /**
   * To plain JS object
   *
   * @returns {any}
   */
  toJS() {
    return {
      ...this,
      dialogs: []
    }
  }

}

export default UIState
