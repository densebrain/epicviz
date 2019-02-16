///<reference path="../../typings/custom.d.ts"/>

// TOP LINE STUFF
import 'source-map-support/register'
import 'common/util/ErrorHandler'
import "common/util/RendererExt"
import "./Env"

// CSS
import "./assets/fonts/fonts.global.scss"
import "./assets/css/global.scss"
import "./assets/css/output/repl.scss"

// REACT SETUP
import "./ReactHotConfig"
import "react-hot-loader/patch"
import * as ReactDOM from "react-dom"
import * as React from "react"
import {Provider} from "react-redux"

// IMPORT MOMENT TIMEZONES & OTHER FRONT END STUFF
import "moment-timezone"
import * as $ from 'jquery'

// STORE
import {loadAndInitStore} from "common/store/AppStore"
import "renderer/store/UIAppStoreTypes"


// SUGAR EXTEND GLOBAL
require("sugar").extend()

document.body.classList.add("dark-theme","cm-s-dark-theme")

let rendered = false

async function renderRoot():Promise<void> {
  const doRender = async ():Promise<void> => {
    if (rendered)
      return

    rendered = true
    const Root = (await import("./Root")).default

    ReactDOM.render(
      <Provider store={getReduxStore()}>
        <Root/>
      </Provider>,
      document.getElementById("app")
    )
  }

  require("common/Scheduler")
  await loadAndInitStore()
  await require('common/watchers/StorePersistWatcher').default
  await require("./init").default
  await require('common/watchers/ConfigWatcher').default
  require('renderer/watchers/WorkspaceWatcher')


  doRender()
}

// noinspection JSIgnoredPromiseFromCall
renderRoot()


if (module.hot) {
  module.hot.accept(["renderer/styles/Themes"],updates => {
    console.info("Re-render root",updates)
    renderRoot().catch(err => console.error("Failed to render root",err))
  })
}
