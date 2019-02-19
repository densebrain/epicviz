import "./Ext"
import * as jQuery from 'jquery'
import * as LoDash from 'lodash'
//import * as LGlobal from 'leaflet'
//import 'leaflet/dist/leaflet.css'
//const PlotlyGlobal = require("plotly.js-dist")

Object.assign(global, {
  $: jQuery,
  _: LoDash,
  //Plotly: PlotlyGlobal,
  //L: LGlobal
})

declare global {
  const $: typeof jQuery
  const _: typeof LoDash
  const Plotly: any

}

//require("leaflet-osm")

export {}
