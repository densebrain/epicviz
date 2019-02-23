import getLogger from "common/log/Logger"
import {State} from "typedux"
import {IDialog} from "renderer/models/Dialog"
import {ISearchChip, ISearchChipData} from "renderer/search/Search"
import {ILoadableState} from "common/models/LoadableState"
import {Workspace} from "common/models/Workspace"
import {getValue} from "typeguard"
import {LiteralMap} from "common/Types"

const log = getLogger(__filename)

export type UISplitterNames = "snippets" | "data" | "repl" | "loaders" | "sources"

export type UITabNames = "components" | "outputs"

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
  projectDir: string = ""

  splitters = {
    snippets: 200,
    data: 200,
    sources: 200,
    loaders: 200,
    repl: getValue(() => window.document.body.clientWidth / 2, 400)
  } as LiteralMap<UISplitterNames,number | string>

  tabs = {
    components: "data",
    outputs: 0
  } as LiteralMap<UITabNames,number | string>

  searches: {
    [id:string]: Array<ISearchChipData>
  } = {}


  constructor(o: any = {}) {
    _.defaultsDeep(o,this)
    Object.assign(this,o)
  }

  async load(): Promise<void> {
    log.info("Loading workspace from",this.projectDir)
    if (!this.projectDir.isEmpty()) {
      try {
        const currentWorkspace = this.workspace
        this.workspace = await Workspace.load(this.projectDir)
        _.defaultsDeep(this.workspace,currentWorkspace)
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
