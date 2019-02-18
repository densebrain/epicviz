import * as React from "react"


import {
  FillWidth,
  FillWindow,
  FlexColumn,
  FlexScale,
  IThemedProperties,
  PositionRelative,
  StyleDeclaration
} from "renderer/styles/ThemedStyles"
import {ConnectedRouter} from "react-router-redux"
import {Redirect, Route} from "react-router"
import Workspace from "./WorkspaceLayout"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import DialogContainer from "renderer/components/DialogContainer"
import StatusBar from "renderer/components/elements/StatusBar"
import Notifications from "renderer/components/elements/Notifications"
import BlockingWorkProgress from "renderer/components/elements/BlockingWorkProgress"
import {isMain} from "common/Process"
import {getHot} from "common/HotUtil"
import {useEffect} from "react"
import {openWorkspaceFolder} from "renderer/actions/WorkspaceActions"
import {projectDirSelector} from "renderer/store/selectors/UISelectors"

const history = isMain() ? null : getHot(module, 'history', require('history/createHashHistory').default) as any

/**
 * Get the history setup from npm history
 */
export function getRouterHistory():any {
  // import createHistory from 'history/createHashHistory'
  // import {History,LocationState} from "history"
  // history:History<LocationState> = isMain() ? null : getHot(module, 'history', createHistory) as any,
  return history
}

function baseStyles(): StyleDeclaration {
  return {
    app: [FillWindow, FlexColumn, {
      "& .content": [FlexScale, FillWidth, PositionRelative]
    }],
    "@global": {
      ".auth0-lock-container": [{
        zIndex: 20000
      }]
    }
  } as any
}

interface SP {
  projectDir: string
}

const selectors: Selectors<IThemedProperties, SP> = {
  projectDir: projectDirSelector
}

export default StyledComponent<IThemedProperties, SP>(baseStyles)(function App(props: IThemedProperties & SP): React.ReactElement<IThemedProperties> {
  const {classes,projectDir} = props

  // useEffect(() => {
  //   if (!projectDir || projectDir.isEmpty()) {
  //     openWorkspaceFolder()
  //   }
  // },[projectDir])

  return <div className={classes.app}>

      <ConnectedRouter store={getReduxStore()} history={getRouterHistory()}>
        <div id="content" className="content">
          <Route path="/workspace" component={() => <Workspace/>}/>
          <Redirect to="/workspace" path="/" exact/>
        </div>
      </ConnectedRouter>

      <DialogContainer/>
      <StatusBar/>
      <Notifications />
      <BlockingWorkProgress />
  </div>
})


