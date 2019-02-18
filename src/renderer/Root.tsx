//import {createMuiTheme} from '@material-ui/core/styles'
import MuiThemeProvider from '@material-ui/core/styles/MuiThemeProvider'
import * as React from "react"
import {hot} from 'react-hot-loader/root'
import {Provider} from "react-redux"
import App from "renderer/components/App"
import {darkTheme} from "renderer/styles/Themes"

import getLogger from "common/log/Logger"

import ThemeProvider from '@material-ui/styles/ThemeProvider'
import {IThemedProperties, StyleDeclaration} from "renderer/styles/ThemedStyles"


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

/**
 * Generate the MUI palette for mapper
 */

class Root extends React.Component<P> {
  render() {
    return <Provider store={getReduxStore()}>
      <MuiThemeProvider theme={darkTheme}>
        <ThemeProvider theme={darkTheme}>
          <App/>
        </ThemeProvider>
      </MuiThemeProvider>
    </Provider>
  }
}



export default hot(Root)
