import getLogger from "common/log/Logger"
import {State} from "typedux"
import {IDialog} from "renderer/models/Dialog"
import {ISearchChip, ISearchChipData} from "renderer/search/Search"
import {ILoadableState} from "common/models/LoadableState"
import {Workspace} from "common/models/Workspace"

const log = getLogger(__filename)

/**
 *  UIState
 */

export class UIState implements ILoadableState {

  static Key = 'UIState'

  static fromJS(o:any = {}):UIState {
    return new UIState(o)
  }

  type = UIState.Key


  dialogs:Array<IDialog> = []
  workspace: Workspace | null = null
  notificationsOpen:boolean = false
  projectDir: string = ""

  splitters = {
    notifications: 300 as string|number
  }

  searches: {
    [id:string]: Array<ISearchChipData>
  } = {}


  constructor(o: any = {}) {
    Object.assign(this, o)
  }

  async load(): Promise<void> {
    log.info("Loading workspace from",this.projectDir)
    if (!this.projectDir.isEmpty()) {
      try {
        this.workspace = await Workspace.load(this.projectDir)
      } catch (err) {
        log.error("Unable to load workspace", err)
      }
    }
  }

  /**
   * To plain JS object
   *
   * @returns {any}
   */
  toJS() {
    return {
      ...this,
      dialogs: [],
      workspace: null
    }
  }

}

export default UIState
