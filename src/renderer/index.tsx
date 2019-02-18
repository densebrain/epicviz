///<reference path="../../typings/custom.d.ts"/>

// TOP LINE STUFF
import 'source-map-support/register'
import 'common/util/ErrorHandler'

// CSS
import "./assets/fonts/fonts.global.scss"
import "./assets/css/global.scss"
import "./assets/css/output/repl.scss"
//require("leaflet/dist/leaflet.css")
//$(iframe.contentDocument.head).append($('<link rel="stylesheet" href="https://unpkg.com/leaflet@1.4.0/dist/leaflet.css" integrity="sha512-puBpdR0798OZvTTbP4A8Ix/l+A4dHDD0DGqYW6RQ+9jxkRFclaxxQb/SJAWZfWAkuyeQUytO7+7N4QKrDh+drA==" crossorigin=""/>'))
// REACT SETUP
import "./ReactHotConfig"
import "react-hot-loader/patch"
import * as ReactDOM from "react-dom"
//import * as ReactDOM from "@hot-loader/react-dom"
import * as React from "react"

import "common/util/RendererExt"
import "./Env"




// IMPORT MOMENT TIMEZONES & OTHER FRONT END STUFF
import "moment-timezone"
import * as $ from 'jquery'

// STORE
import {loadAndInitStore} from "common/store/AppStore"
import "renderer/store/UIAppStoreTypes"


// SUGAR EXTEND GLOBAL
require("sugar").extend()

document.body.classList.add("dark-theme","cm-s-dark-theme")

const appEl = $("#app")

let rendered = false


async function renderRoot():Promise<void> {
  const doRender = ():void => {
    if (rendered)
      return

    rendered = true

    const Root = require("./Root").default

    ReactDOM.render(
      <Root/>,
      appEl[0]
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
