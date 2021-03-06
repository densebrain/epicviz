import {ActionFactory, ActionMessage, ActionReducer, patchState} from "typedux"
import {AppState} from "common/store/state/AppState"
import {IConfig} from "common/config/Config"
import {IActionFactoryBase} from "./ActionFactoryBase"
import getLogger from "common/log/Logger"
import * as _ from 'lodash'
import {DataType, IDataSyncStatus} from "common/Types"
import {IAppStatus, IAppStatusMessage, IAppStatusNotification, INetworkCall} from "common/models/AppStatus"
import {getValue, isFunction} from "typeguard"

const log = getLogger(__filename)

export class AppActionFactory extends ActionFactory<AppState, ActionMessage<AppState>> implements IActionFactoryBase<AppState> {

  constructor() {
    super(AppState)
  }

  leaf(): string {
    return AppState.Key
  }


  @ActionReducer()
  setConfig(config: IConfig) {
    return (state: AppState) => patchState(state, {config})
  }


  @ActionReducer()
  setState(newState: AppState) {
    return (state: AppState) => patchState(state, newState)
  }


  private internalUpdateNotifications(status: IAppStatus, msg: IAppStatusNotification, remove: boolean): IAppStatus {
    status = {...status}

    let notifications = status.notifications = [...status.notifications]

    if (remove) {
      notifications = notifications.filter(it => it.id !== msg.id)
    } else {
      const index = notifications.findIndex(it => it.id === msg.id)
      if (index === -1) {
        notifications = [msg, ...notifications]
      } else {
        notifications[index] = {...msg}
      }
    }

    status.notifications = notifications
    return status
  }


  private internalUpdateMessages(status: IAppStatus, msg: IAppStatusMessage, remove: boolean): IAppStatus {
    status = {...status}

    let history = status.history = [...status.history]

    if (remove) {
      history = history.filter(it => it.id !== msg.id)
      if (getValue(() => status.message.id === msg.id) && history.length) {
        status.message = {...history[0]}
      }
    } else {
      const index = history.findIndex(it => it.id === msg.id)
      if (index === -1) {
        history = [msg, ...history]
      } else {
        history[index] = {...msg}
      }
      if (index === -1 || getValue(() => status.message.id === msg.id) && history.length) {
        status.message = {...msg}
      }
    }

    if (history.length > 100)
      history = history.slice(0,100)

    status.history = history
    return status
  }

  @ActionReducer()
  updateAppStatusMessage(msg: IAppStatusMessage, remove: boolean = false) {
    return (state: AppState) => patchState(state, {
      status: this.internalUpdateMessages(state.status, msg, remove)
    })

  }

  @ActionReducer()
  updateAppStatusNotification(notification: IAppStatusNotification, remove: boolean = false) {
    return (state: AppState) => patchState(state, {
      status: this.internalUpdateNotifications(state.status, notification, remove)
    })

  }

  @ActionReducer()
  updateAppStatusMessageAndNotification(msg: IAppStatusNotification, notification: IAppStatusNotification, remove: boolean = false) {
    return (state: AppState) => patchState(state, {
      status: this.internalUpdateNotifications(
        this.internalUpdateMessages(state.status,msg,remove),
        notification,
        remove
      )
    })
  }


  @ActionReducer()
  updateAppStatus(status:Partial<IAppStatus> | ((state:AppState) => Partial<IAppStatus>)) {
    return (state: AppState) => patchState(state, {
      status: {
        ...state.status,
        ...isFunction(status) ? status(state) : status
      }
    })
  }

  @ActionReducer()
  updateNetworkCall(networkCall: INetworkCall, remove: boolean = false) {
    return (state: AppState) => {
      const
        status = {...state.status},
        network = status.network = {...status.network}

      let pending = [...network.pending]
      if (remove) {
        pending = pending.filter(it => it.id !== networkCall.id)
      } else {
        const index = pending.findIndex(it => it.id === networkCall.id)
        if (index === -1)
          pending.push(networkCall)
        else
          pending[index] = {...networkCall}
      }

      network.pending = pending

      return patchState(state, {
        status
      })
    }
  }


}
