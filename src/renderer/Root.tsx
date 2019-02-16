//import {createMuiTheme} from '@material-ui/core/styles'
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider'
import * as React from "react"
//import Loadable from "react-loadable"

//import {makeTransition, mergeStyles, rem, remToPx} from "renderer/styles/ThemedStyles"
import {hot} from 'react-hot-loader/root'



import App from "renderer/components/App"
import {darkTheme} from "renderer/styles/Themes"

import getLogger from "common/log/Logger"

import ThemeProvider from '@material-ui/styles/ThemeProvider'
import {useEffect} from "react"
import {Selectors, StyledComponent} from "renderer/components/elements/StyledComponent"
import {IThemedProperties, StyleDeclaration} from "renderer/styles/ThemedStyles"
import {projectDirSelector} from "renderer/store/selectors/UISelectors"
import {openWorkspaceFolder} from "renderer/actions/WorkspaceActions"


const log = getLogger(__filename)

type Classes = "root"

function baseStyles(theme:Theme):StyleDeclaration<Classes> {
  return {
    root: {

    }
  }
}

interface P extends IThemedProperties<Classes> {

}

interface SP {
  projectDir:string
}

const selectors = {
  projectDir: projectDirSelector
} as Selectors<P,SP>

/**
 * Generate the MUI palette for mapper
 */

const Root = StyledComponent<P,SP>(baseStyles,selectors)((props:P & SP):React.ReactElement<P> => {
  const {projectDir} = props

  useEffect(() => {
    // LOAD COMMANDS
    import("./Commands")
      .then(async ({default:init}) => {
        log.info("Init commands")
        await init()
      })
      .catch(err => log.error("Unable to init commands", err))
  },[])

  useEffect(() => {
    if (!projectDir || projectDir.isEmpty()) {
      openWorkspaceFolder()
    }
  },[projectDir])

    // ConnectedRouter will use the store from the Provider automatically
    return <MuiThemeProvider theme={darkTheme}>
        <ThemeProvider theme={darkTheme}>
          <App/>
        </ThemeProvider>
      </MuiThemeProvider>


})

const HotRoot:any = hot(Root)

export default HotRoot as React.ComponentClass
