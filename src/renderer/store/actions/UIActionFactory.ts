import {ActionFactory, ActionReducer, ActionMessage, patchState} from "typedux"
import getLogger from "common/log/Logger"
import {UISplitterNames, UIState, UITabNames} from "../state/UIState"
import {getValue} from "typeguard"
import {DialogDefaults, IDialog} from "renderer/models/Dialog"
import {getCommandManager} from "common/command-manager"
import {ISearchChip} from "renderer/search/Search"
import {ISnippet, Workspace} from "common/models/Workspace"

const
  log = getLogger(__filename)

export class UIActionFactory extends ActionFactory<UIState, ActionMessage<UIState>> {

  static ServiceName = "UIActions"

  static leaf = UIState.Key

  constructor() {
    super(UIState)
  }

  /**
   * Leaf name
   * @returns {string}
   */
  leaf(): string {
    return UIState.Key
  }


  private updateDialogCommandManager(state:UIState,dialog:IDialog | null = null) {
    const oldLength = getValue(() => state.dialogs.length,0)
    if (dialog && !oldLength) {
      getCommandManager().pushStack()
    } else if (!dialog && oldLength === 1) {
      getCommandManager().popStack()
    }
  }

  @ActionReducer()
  setProjectDirAndWorkspace(projectDir: string,workspace:Workspace | null) {
    return (state: UIState) => patchState(state, {
      projectDir,
      workspace
    })
  }

  @ActionReducer()
  patchWorkspace(workspace:Partial<Workspace>) {
    return (state:UIState) => patchState(state,{
      workspace: !state.workspace ? null : state.workspace.patch(workspace)
    })
  }

  @ActionReducer()
  patchSnippet(snippet:Partial<ISnippet>) {
    return (state:UIState) => patchState(state,{
      workspace: !state.workspace ? null : state.workspace.patchSnippet(snippet)
    })
  }

  @ActionReducer()
  showDialog(dialog:IDialog) {
    return (state:UIState) => {
      dialog = {...DialogDefaults, ...dialog}
      this.updateDialogCommandManager(state,dialog)
      return patchState(state,{
        dialogs: [...state.dialogs,dialog]
      })
  }}


  @ActionReducer()
  updateSearch(id:string,chips:Array<ISearchChip>) {
    const data = chips.map(chip => chip.data())
    log.info("Setting chip data",data,chips)

    return (state: UIState) => patchState(state, {
      searches: {
        ...state.searches,
        [id]: data
      }
    })
  }

  @ActionReducer()
  removeDialog({id}:IDialog) {
    return (state:UIState) => {
      this.updateDialogCommandManager(state)
      return patchState(state,{
        dialogs: [...state.dialogs.filter(dialog => dialog.id !== id)]
      })
    }
  }


  @ActionReducer()
  setSplitter(name:UISplitterNames, size: number | string) {
    return (state: UIState) => patchState(state, {
      splitters: {
        ...state.splitters,
        [name]: size
      }
    })
  }

  @ActionReducer()
  setTab(name:UITabNames, tab: number | string) {
    return (state: UIState) => patchState(state, {
      tabs: {
        ...state.tabs,
        [name]: tab
      }
    })
  }


  @ActionReducer()
  setState(newState:UIState) {
    return (state: UIState) => newState
  }

}
