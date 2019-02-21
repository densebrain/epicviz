

import "./Ext"
import * as jQuery from 'jquery'
import * as LoDash from 'lodash'
//import * as LGlobal from 'leaflet'
//import 'leaflet/dist/leaflet.css'
import * as PlotlyGlobal from "plotly.js-dist"
//import * as PlotlyGlobalType from "plotly.js"

Object.assign(global, {
  $: jQuery,
  _: LoDash,
  Plotly: PlotlyGlobal,
  //L: LGlobal
})

declare global {
  const $: typeof jQuery
  const _: typeof LoDash
  //const Plotly: PlotlyGlobalType

}

//require("leaflet-osm")

export {}
